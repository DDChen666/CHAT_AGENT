export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenPayloadFromCookies } from '@/lib/auth'
import { callProvider, type ChatMessage as ChatMsg } from '@/lib/providers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, model, messages, stream, temperature, maxTokens, apiKey } = body as {
      provider: 'gemini' | 'deepseek'
      model?: string
      messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
      stream?: boolean
      temperature?: number
      maxTokens?: number
      apiKey?: string
    }

    if (!provider || !Array.isArray(messages)) {
      return Response.json({ message: 'Invalid payload' }, { status: 400 })
    }

    const chosenModel = model && model.trim()
      ? model.trim()
      : provider === 'gemini' ? 'gemini-2.5-flash' : 'deepseek-chat'

    // Resolve API key precedence: body > stored per-user > env
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
    if (!effectiveKey) {
      return Response.json({ message: `No API key for ${provider}` }, { status: 400 })
    }
    
    if (stream) {
      const encoder = new TextEncoder()
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            const responseText = await callProvider(
              provider,
              chosenModel,
              messages as ChatMsg[],
              effectiveKey,
              { temperature, maxTokens }
            )
            
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
                prompt_tokens: Math.ceil(messages.reduce((sum: number, msg: any) => sum + msg.content.length, 0) / 4),
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
      const responseText = await callProvider(
        provider,
        chosenModel,
        messages as ChatMsg[],
        effectiveKey,
        { temperature, maxTokens }
      )
      
      return Response.json({
        message: responseText,
        usage: {
          prompt_tokens: Math.ceil(messages.reduce((sum: number, msg: any) => sum + msg.content.length, 0) / 4),
          completion_tokens: Math.ceil(responseText.length / 4),
        },
        provider,
        model: chosenModel,
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
