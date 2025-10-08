export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenPayloadFromCookies } from '@/lib/auth'
import { callProvider, type ProviderName } from '@/lib/providers'
import { Provider as DbProvider } from '@prisma/client'

type ReviewAnalysis = {
  scores: Record<string, number>
  total: number
  feedback: string[]
}

function parseReviewJson(raw: string): {
  scores?: Record<string, number>
  overall_score?: number
  actionable_suggestions?: unknown
} {
  const trimmed = raw.trim()

  const candidates: string[] = []
  if (trimmed) candidates.push(trimmed)

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (codeBlockMatch?.[1]) {
    candidates.push(codeBlockMatch[1].trim())
  }

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1).trim())
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      if (parsed && typeof parsed === 'object') {
        return parsed as {
          scores?: Record<string, number>
          overall_score?: number
          actionable_suggestions?: unknown
        }
      }
    } catch {}
  }

  throw new Error('審核模型未回傳有效的 JSON，請調整提示詞或模型設定')
}

// 優化器邏輯
class OptimizerClient {
  private improverPrompt: string
  private criticPrompt: string

  constructor(improverPrompt?: string, criticPrompt?: string) {
    this.improverPrompt = improverPrompt || `你是一位世界頂尖的 Prompt 工程專家，你的任務是將一個簡單的用戶需求，轉化為一個結構化、功能強大、細節豐富的 Prompt。

你的工作流程是：
1.  **分析輸入**: 仔細理解用戶的\`初始需求\`、\`當前 Prompt 版本\`以及\`審核者回饋\`。
2.  **應用最佳實踐**: 在你的新 Prompt 中，靈活運用以下一種或多種高級技巧來增強效果：
    - **角色扮演 (Role-Playing)**: 明確指定 AI 扮演的角色。
    - **結構化格式 (Structured Format)**: 使用 Markdown（如 #, ##, ###）來組織結構，例如 \`Role\`, \`Task\`, \`Context\`, \`Constraints\`, \`Output Format\` 等。
    - **思維鏈 (Chain of Thought, CoT)**: 引導 AI 一步步思考。
    - **提供範例 (Few-shot Examples)**: 給出輸入和輸出的範例，讓 AI 更好地理解期望。
    - **明確的約束 (Constraints)**: 設定清晰的規則和限制，避免 AI 偏離主題。
3.  **整合回饋**: 針對\`審核者回饋\`中的每一條建議，思考如何將其融入到新的 Prompt 中。
4.  **輸出**: 只輸出**完整且可直接使用**的新 Prompt 內容，不要包含任何額外的解釋或對話。`

    this.criticPrompt = criticPrompt || `你是一位嚴謹、注重細節的 AI 系統分析師。你的任務是評估一個給定的 Prompt，並提供結構化的、可執行的回饋。

你的評估必須基於以下五個維度，每個維度滿分 100：
1.  **清晰度 (Clarity)**: Prompt 是否清晰易懂，沒有歧義？
2.  **具體性 (Specificity)**: 是否包含了足夠的細節和上下文，讓 AI 能準確執行任務？
3.  **完整性 (Completeness)**: 是否考慮了任務的各個方面和潛在的邊界情況？
4.  **穩健性 (Robustness)**: Prompt 是否足夠靈活，能應對輕微變化的輸入，而不是過於僵化？
5.  **原意符合度 (Intent Adherence)**: 是否完全符合用戶的\`初始需求\`，沒有添加不相關或偏離核心目標的內容？

你的工作流程是：
1.  **比較**: 將\`待審核的 Prompt\`與用戶的\`初始需求\`進行比較，確保核心目標一致。
2.  **評分**: 根據上述五個維度，獨立打分。
3.  **計算總分**: \`overall_score\` 是五個維度分數的加權平均值 (原意符合度權重最高，例如 40%，其餘各 15%)。
4.  **提供回饋**:
    - \`feedback_summary\`: 用一句話總結你的整體看法。
    - \`actionable_suggestions\`: 提供 2-3 條具體的、可立即執行的修改建議，用於指導下一個版本的改進。

你的輸出必須是**嚴格的 JSON 格式**，結構如下：
{
  "scores": { "clarity": int, "specificity": int, "completeness": int, "robustness": int, "intent_adherence": int },
  "overall_score": int,
  "feedback_summary": "string",
  "actionable_suggestions": ["string1", "string2", ...]
}

不要輸出任何 JSON 以外的內容。`
  }

  async optimizePrompt(
    initialPrompt: string,
    currentPrompt: string,
    previousFeedback: string[],
    provider: string,
    apiKey: string | undefined,
    options?: {
      model?: string
      temperature?: number
      maxTokens?: number
    }
  ) {
    const sanitizedInitial = initialPrompt.trim()
    const sanitizedCurrent = currentPrompt.trim() || sanitizedInitial
    const feedbackSection = previousFeedback.length
      ? previousFeedback.map((item, index) => `${index + 1}. ${item}`).join('\n')
      : '目前尚未收到審核回饋，請根據初始需求自行優化。'

    const messages = [
      { role: 'system' as const, content: this.improverPrompt },
      {
        role: 'user' as const,
        content: `以下是 Prompt 優化所需的完整資訊：

初始使用者需求：
"""
${sanitizedInitial}
"""

當前提示詞版本：
"""
${sanitizedCurrent}
"""

上一輪審核者回饋（若有）：
${feedbackSection}

請依據上述內容輸出一份可以直接使用的最終提示詞，不要輸出任何額外說明。`,
      },
    ]

    const model = options?.model?.trim() || (provider === 'gemini' ? 'gemini-2.5-flash' : 'deepseek-chat')
    const temperature = typeof options?.temperature === 'number' ? options.temperature : 0.3
    const maxTokens =
      typeof options?.maxTokens === 'number' && options.maxTokens > 0
        ? Math.floor(options.maxTokens)
        : undefined

    const callConfig: { temperature?: number; maxTokens?: number } = {}
    if (Number.isFinite(temperature)) {
      callConfig.temperature = temperature
    }
    if (typeof maxTokens === 'number' && Number.isFinite(maxTokens)) {
      callConfig.maxTokens = maxTokens
    }

    const text = (await callProvider(
      provider as ProviderName,
      model,
      messages,
      apiKey || '',
      callConfig
    ))?.trim()

    if (!text) {
      throw new Error('LLM 回傳內容為空，請檢查模型及金鑰設定')
    }

    return text
  }

  async generateReviewScores(
    initialPrompt: string,
    prompt: string,
    provider: string,
    apiKey: string | undefined,
    options?: {
      model?: string
      maxTokens?: number
    }
  ): Promise<ReviewAnalysis> {
    const messages = [
      { role: 'system' as const, content: this.criticPrompt },
      {
        role: 'user' as const,
        content: `請依據下列資訊提供評分結果，務必輸出合法 JSON：

使用者初始需求：
"""
${initialPrompt}
"""

待審核的提示詞：
"""
${prompt}
"""`,
      },
    ]

    const model = options?.model?.trim() || (provider === 'gemini' ? 'gemini-2.5-flash' : 'deepseek-chat')
    const maxTokens =
      typeof options?.maxTokens === 'number' && options.maxTokens > 0
        ? Math.floor(Math.min(options.maxTokens, 800))
        : undefined

    const callConfig: { temperature?: number; maxTokens?: number } = { temperature: 0 }
    if (typeof maxTokens === 'number' && Number.isFinite(maxTokens)) {
      callConfig.maxTokens = maxTokens
    }

    const jsonResponse = await callProvider(
      provider as ProviderName,
      model,
      messages,
      apiKey || '',
      callConfig
    )

    const text = (jsonResponse || '').trim()
    if (!text) {
      throw new Error('審核模型回傳內容為空，請檢查設定')
    }

    const parsed = parseReviewJson(text)

    const normalizedScores = Object.entries(parsed.scores || {}).reduce<Record<string, number>>((acc, [key, value]) => {
      if (typeof value === 'number' && !Number.isNaN(value)) {
        acc[key] = value
      }
      return acc
    }, {})

    const feedback = Array.isArray(parsed.actionable_suggestions)
      ? parsed.actionable_suggestions.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : []

    const totalFromResponse = typeof parsed.overall_score === 'number' && !Number.isNaN(parsed.overall_score)
      ? parsed.overall_score
      : Object.values(normalizedScores).length
        ? Object.values(normalizedScores).reduce((sum, num) => sum + num, 0) / Object.values(normalizedScores).length
        : 0

    return {
      scores: normalizedScores,
      total: Math.round(totalFromResponse),
      feedback,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      initialPrompt, 
      iterations = 8, 
      threshold = 90, 
      provider = 'gemini',
      apiKey,
      systemPrompts,
      model,
      temperature,
      maxTokens,
    } = body

    const optimizer = new OptimizerClient(
      systemPrompts?.improver,
      systemPrompts?.critic
    )
    
    // Resolve API key (request payload > saved per-user value)
    let effectiveKey = (apiKey || '').trim()
    if (!effectiveKey) {
      const session = await getTokenPayloadFromCookies()
      if (session?.userId) {
        const rec = await prisma.apiKey.findUnique({
          where: { userId_provider: { userId: session.userId, provider: (provider === 'gemini' ? DbProvider.GEMINI : DbProvider.DEEPSEEK) } },
          select: { encryptedKey: true },
        })
        if (rec) {
          const { decrypt } = await import('@/lib/crypto')
          try { effectiveKey = decrypt(rec.encryptedKey) } catch {}
        }
      }
    }
    if (!effectiveKey) {
      return Response.json(
        {
          message: `No API key configured for ${provider}. Please add your key in settings before using the optimizer.`,
          code: 'MISSING_API_KEY'
        },
        { status: 400 }
      )
    }

    const encoder = new TextEncoder()
    const chosenModel = typeof model === 'string' && model.trim()
      ? model.trim()
      : provider === 'gemini'
        ? 'gemini-2.5-flash'
        : 'deepseek-chat'

    const effectiveTemperature = typeof temperature === 'number' ? temperature : 0.3
    const userMaxTokens = typeof maxTokens === 'number' && maxTokens > 0 ? Math.floor(maxTokens) : undefined

    const stream = new ReadableStream({
      async start(controller) {
        let bestScore = 0
        let bestPrompt = ''
        let currentPrompt = initialPrompt
        let previousFeedback: string[] = []

        for (let round = 1; round <= iterations; round++) {
          try {
            const improvedPrompt = await optimizer.optimizePrompt(
              initialPrompt,
              currentPrompt,
              previousFeedback,
              provider,
              effectiveKey,
              {
                model: chosenModel,
                temperature: effectiveTemperature,
                ...(typeof userMaxTokens === 'number' ? { maxTokens: userMaxTokens } : {}),
              }
            )

            const review = await optimizer.generateReviewScores(
              initialPrompt,
              improvedPrompt,
              provider,
              effectiveKey,
              {
                model: chosenModel,
                ...(typeof userMaxTokens === 'number'
                  ? { maxTokens: Math.max(1, Math.min(userMaxTokens, 800)) }
                  : {}),
              }
            )

            const totalScore = review.total
            const feedback = review.feedback.length
              ? review.feedback
              : ['強化提示詞的清晰度', '補充必要的限制條件', '提供具體輸出格式建議']

            if (totalScore > bestScore) {
              bestScore = totalScore
              bestPrompt = improvedPrompt
            }

            previousFeedback = feedback
            currentPrompt = improvedPrompt

            const roundData = {
              round,
              improved: improvedPrompt,
              review: {
                scores: review.scores,
                total: totalScore,
                feedback,
              },
              bestSoFar: {
                prompt: bestPrompt,
                score: bestScore,
              },
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(roundData)}\n\n`)
            )

            if (totalScore >= threshold) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'final',
                  prompt: bestPrompt,
                  score: bestScore,
                  stopBy: 'threshold',
                })}\n\n`)
              )
              break
            }

            if (round === iterations) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'final',
                  prompt: bestPrompt,
                  score: bestScore,
                  stopBy: 'max_iterations',
                })}\n\n`)
              )
            }

            await new Promise(resolve => setTimeout(resolve, 500))
          } catch (error) {
            const message = error instanceof Error ? error.message : '未知錯誤，請稍後再試'
            console.error('Optimizer pipeline error:', error)
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'error',
                round,
                message,
              })}\n\n`)
            )
            break
          }
        }

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Optimize API error:', error)
    return Response.json(
      { 
        message: 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      },
      { status: 500 }
    )
  }
}
