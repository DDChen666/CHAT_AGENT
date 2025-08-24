import { NextRequest } from 'next/server'

// AI API 客戶端實現
interface ChatMessage {
  role: string
  content: string
}

class AIClient {

  private async callGeminiAPI(messages: ChatMessage[]) {
    try {
      const apiKey = process.env.GOOGLE_GEMINI_API_KEY
      if (!apiKey) {
        throw new Error('Gemini API key not configured')
      }

      // 轉換消息格式為 Gemini 格式，包含完整的對話歷史
      const contents = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify({ contents }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      
      if (!text) {
        throw new Error('Gemini API returned empty response')
      }

      return text
    } catch (error) {
      console.error('Gemini API error:', error)
      throw new Error('Failed to call Gemini API')
    }
  }

  private async callDeepSeekAPI(messages: ChatMessage[]) {
    try {
      // DeepSeek API 實現（暫時保持模擬）
      const lastMessage = messages[messages.length - 1]?.content || ''
      return `這是來自 DeepSeek 的回應：${lastMessage}`
    } catch (error) {
      console.error('DeepSeek API error:', error)
      throw new Error('Failed to call DeepSeek API')
    }
  }

  async generateResponse(provider: string, messages: ChatMessage[]) {
    switch (provider) {
      case 'gemini':
        return this.callGeminiAPI(messages)
      case 'deepseek':
        return this.callDeepSeekAPI(messages)
      default:
        throw new Error(`不支持的提供商: ${provider}`)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, messages, stream } = body

    const aiClient = new AIClient()
    
    if (stream) {
      const encoder = new TextEncoder()
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            // 獲取實際的 AI 回應
            const responseText = await aiClient.generateResponse(provider, messages)
            
            // 模擬逐字流式傳輸
            for (let i = 0; i < responseText.length; i++) {
              const chunk = {
                type: 'chunk',
                id: 'response',
                delta: responseText[i],
              }
              
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
              )
              
              await new Promise(resolve => setTimeout(resolve, 20))
            }

            // 最終完成消息
            const doneMessage = {
              type: 'done',
              usage: {
                prompt_tokens: Math.ceil(messages.reduce((sum: number, msg: ChatMessage) => sum + msg.content.length, 0) / 4),
                completion_tokens: Math.ceil(responseText.length / 4),
              },
            }
            
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(doneMessage)}\n\n`)
            )
            
          } catch (error) {
            console.error('Streaming error:', error)
            const errorMessage = {
              type: 'error',
              message: 'Failed to generate response'
            }
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`)
            )
          } finally {
            controller.close()
          }
        },
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // 非流式回應
    try {
      const responseText = await aiClient.generateResponse(provider, messages)
      
      return Response.json({
        message: responseText,
        usage: {
          prompt_tokens: Math.ceil(messages.reduce((sum: number, msg: ChatMessage) => sum + msg.content.length, 0) / 4),
          completion_tokens: Math.ceil(responseText.length / 4),
        },
      })
    } catch (error) {
      console.error('Non-streaming error:', error)
      return Response.json(
        { 
          message: 'Failed to generate response', 
          code: 'API_ERROR' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Chat API error:', error)
    return Response.json(
      { 
        message: 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      },
      { status: 500 }
    )
  }
}