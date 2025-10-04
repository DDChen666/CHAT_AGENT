export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenPayloadFromCookies } from '@/lib/auth'
import { callProvider, type ChatMessage as ChatMsg, type ProviderName } from '@/lib/providers'
import { Provider as DbProvider, MessageRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, model, messages, stream, temperature, maxTokens, apiKey, conversationId } = body as {
      provider: 'gemini' | 'deepseek'
      model?: string
      messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
      stream?: boolean
      temperature?: number
      maxTokens?: number
      apiKey?: string
      conversationId?: string
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
      return Response.json({ message: `No API key configured for ${provider}. Please add your key in settings.`, code: 'MISSING_API_KEY' }, { status: 400 })
    }
    // Optional persistence to DB if conversationId is provided and valid
    let validatedConversationId: string | null = null
    let lastUserMessageContent: string | null = null
    const sessionForPersist = await getTokenPayloadFromCookies()
    if (conversationId && conversationId.trim()) {
      if (!sessionForPersist?.userId) {
        return Response.json({ message: 'Unauthorized (login required for persistence)' }, { status: 401 })
      }
      const conv = await prisma.conversation.findFirst({ where: { id: conversationId.trim(), userId: sessionForPersist.userId }, select: { id: true } })
      if (!conv) {
        return Response.json({ message: 'Conversation not found' }, { status: 404 })
      }
      validatedConversationId = conv.id
      // Find the latest user message content from provided messages
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i]
        if (m.role === 'user' && m.content?.trim()) { lastUserMessageContent = m.content.trim(); break }
      }
      if (lastUserMessageContent) {
        try {
          await prisma.message.create({
            data: { conversationId: validatedConversationId, role: MessageRole.USER, content: lastUserMessageContent },
            select: { id: true },
          })
          await prisma.conversation.update({ where: { id: validatedConversationId }, data: { updatedAt: new Date() } })
        } catch (e) {
          console.error('Persist user message failed:', e)
        }
      }
    }

    if (stream) {
      console.log('Starting streaming response for provider:', provider, 'model:', chosenModel)
      const encoder = new TextEncoder()
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            console.log('Calling provider with messages:', messages.length, 'messages')
            const responseText = await callProvider(
              provider as ProviderName,
              chosenModel,
              messages as ChatMsg[],
              effectiveKey,
              { temperature, maxTokens }
            )
            console.log('Provider response received, length:', responseText.length)
            // Persist assistant message after generating the full text
            if (validatedConversationId && responseText) {
              try {
                await prisma.message.create({
                  data: { conversationId: validatedConversationId, role: MessageRole.ASSISTANT, content: responseText },
                  select: { id: true },
                })
                await prisma.conversation.update({ where: { id: validatedConversationId }, data: { updatedAt: new Date() } })
              } catch (e) {
                console.error('Persist assistant message failed:', e)
              }
            }
            
            // 模擬逐字流式傳輸，使用 OpenAI 兼容格式
            for (let i = 0; i < responseText.length; i++) {
              const chunk = {
                choices: [{
                  delta: {
                    content: responseText[i]
                  }
                }]
              }

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
              )

              await new Promise(resolve => setTimeout(resolve, 20))
            }

            // 最終完成消息，使用 OpenAI 兼容格式
            controller.enqueue(
              encoder.encode(`data: [DONE]\n\n`)
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
        provider as ProviderName,
        chosenModel,
        messages as ChatMsg[],
        effectiveKey,
        { temperature, maxTokens }
      )
      if (validatedConversationId && responseText) {
        try {
          await prisma.message.create({
            data: { conversationId: validatedConversationId, role: MessageRole.ASSISTANT, content: responseText },
            select: { id: true },
          })
          await prisma.conversation.update({ where: { id: validatedConversationId }, data: { updatedAt: new Date() } })
        } catch (e) {
          console.error('Persist assistant message failed:', e)
        }
      }
      
      return Response.json({
        message: responseText,
        usage: {
          prompt_tokens: Math.ceil((messages as ChatMsg[]).reduce((sum: number, msg: ChatMsg) => sum + msg.content.length, 0) / 4),
          completion_tokens: Math.ceil(responseText.length / 4),
        },
        provider,
        model: chosenModel,
        conversationId: validatedConversationId || undefined,
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
