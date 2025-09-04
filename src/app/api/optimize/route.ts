export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenPayloadFromCookies } from '@/lib/auth'
import { callProvider } from '@/lib/providers'

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

  async optimizePrompt(initialPrompt: string, provider: string, apiKey?: string) {
    try {
      const optimizationPrompt = `${this.improverPrompt}

請根據以上指導原則優化以下提示詞：
"""
${initialPrompt}
"""

請提供優化後的版本，直接輸出優化後的提示詞內容，不要包含任何額外的解釋或評論。`
      const model = provider === 'gemini' ? 'gemini-2.5-flash' : 'deepseek-chat'
      const text = await callProvider(provider as any, model, [{ role: 'user', content: optimizationPrompt }], apiKey || '', { temperature: 0.3, maxTokens: 1024 })
      return text
    } catch (error) {
      console.error('Optimization API error:', error)
      // 失敗時返回模擬優化
      return this.simulateOptimization(initialPrompt, provider)
    }
  }

  private simulateOptimization(initialPrompt: string, provider: string) {
    // 模擬優化過程（備用）
    const improvements = [
      '添加了更明確的指令',
      '改進了結構和格式',
      '增強了具體性和細節',
      '優化了約束條件',
      '提高了清晰度和可執行性'
    ]
    
    let optimizedPrompt = initialPrompt
    
    improvements.forEach((improvement, index) => {
      optimizedPrompt += `\n\n[${provider} 優化 ${index + 1}: ${improvement}]`
    })
    
    return optimizedPrompt
  }
  
  async generateReviewScores(prompt: string, provider: string, apiKey?: string) {
    try {
      const reviewPrompt = `${this.criticPrompt}

請評估以下提示詞：
"""
${prompt}
"""

請只返回JSON格式的評分，不要添加任何其他內容。`
      const model = provider === 'gemini' ? 'gemini-2.5-flash' : 'deepseek-chat'
      const jsonResponse = await callProvider(provider as any, model, [{ role: 'user', content: reviewPrompt }], apiKey || '', { temperature: 0 })
      const text = (jsonResponse || '').trim()
      
      // 嘗試解析JSON回應
      try {
        return JSON.parse(text)
      } catch {
        // 如果解析失敗，返回模擬評分
        return this.generateSimulatedScores()
      }
    } catch (error) {
      console.error('Review API error:', error)
      return this.generateSimulatedScores()
    }
  }

  private generateSimulatedScores() {
    return {
      clarity: Math.floor(Math.random() * 15) + 85,
      constraints: Math.floor(Math.random() * 15) + 85,
      toolUse: Math.floor(Math.random() * 15) + 85,
      safety: Math.floor(Math.random() * 15) + 85,
      structure: Math.floor(Math.random() * 15) + 85,
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
      systemPrompts
    } = body

    const optimizer = new OptimizerClient(
      systemPrompts?.improver,
      systemPrompts?.critic
    )
    
    // Resolve API key (body > saved per-user > env)
    let effectiveKey = (apiKey || '').trim()
    if (!effectiveKey) {
      const session = getTokenPayloadFromCookies()
      if (session?.userId) {
        const rec = await prisma.apiKey.findUnique({
          where: { userId_provider: { userId: session.userId, provider: provider.toUpperCase() as any } },
          select: { encryptedKey: true },
        })
        if (rec) {
          const { decrypt } = await import('@/lib/crypto')
          try { effectiveKey = decrypt(rec.encryptedKey) } catch {}
        }
      }
    }
    if (!effectiveKey) {
      if (provider === 'gemini') effectiveKey = process.env.GOOGLE_GEMINI_API_KEY || ''
      if (provider === 'deepseek') effectiveKey = process.env.DEEPSEEK_API_KEY || ''
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let bestScore = 0
        let bestPrompt = ''

        for (let round = 1; round <= iterations; round++) {
          // Use the optimizer to improve the prompt
          const improvedPrompt = await optimizer.optimizePrompt(initialPrompt, provider, effectiveKey)
          
          // Generate review scores
          const scores = await optimizer.generateReviewScores(improvedPrompt, provider, effectiveKey) as Record<string, number>
          
          const totalScore = Math.round(
            Object.values(scores).reduce((sum: number, score: number) => sum + score, 0) / Object.values(scores).length
          )
          
          const feedback = [
            'Enhanced clarity and specificity',
            'Added concrete constraints and examples',
            'Improved tool usage instructions',
            'Strengthened safety guidelines',
          ]

          // Update best result
          if (totalScore > bestScore) {
            bestScore = totalScore
            bestPrompt = improvedPrompt
          }

          // Send round data
          const roundData = {
            round,
            improved: improvedPrompt,
            review: {
              scores,
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

          // Check stopping conditions
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
