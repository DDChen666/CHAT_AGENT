'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, StopCircle } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useSettingsStore } from '@/store/settingsStore'
import { cn } from '@/lib/utils'
import MessageBubble from './MessageBubble'
import ThinkingAnimation from './ThinkingAnimation'
import { toast } from 'sonner'

interface ChatInterfaceProps {
  tabId: string
}

export default function ChatInterface({ tabId }: ChatInterfaceProps) {
  const { chatStates, addChatMessage, updateChatMessage } = useAppStore()
  const { features, modelSettings, apiKeys, systemPrompts } = useSettingsStore()
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [tokenUsage, setTokenUsage] = useState({ prompt: 0, completion: 0, total: 0 })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const chatState = chatStates[tabId]
  const messages = useMemo(() => chatState?.messages || [], [chatState?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
    
    // Calculate token usage when messages change
    if (features.showTokenUsage) {
      const promptTokens = messages
        .filter(msg => msg.role === 'user')
        .reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0)
      
      const completionTokens = messages
        .filter(msg => msg.role === 'assistant')
        .reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0)
      
      setTokenUsage({
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens
      })
    }
  }, [messages, features.showTokenUsage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    const userMessage = input.trim()
    setInput('')
    addChatMessage(tabId, { role: 'user', content: userMessage })

    setIsStreaming(true)
    setIsThinking(true)
    const controller = new AbortController()
    setAbortController(controller)

    try {
      // Call the actual API
      const provider = modelSettings.defaultProvider
      const selectedKey = provider === 'gemini' ? apiKeys.gemini : apiKeys.deepseek

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          model: modelSettings.defaultModel,
          messages: [
            ...(systemPrompts.chat ? [{ role: 'system' as const, content: systemPrompts.chat }] : []),
            ...messages,
            { role: 'user' as const, content: userMessage }
          ],
          temperature: modelSettings.temperature,
          stream: true,
          enableCache: features.enableGeminiCache,
          apiKey: selectedKey || undefined,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''
      let assistantMessageId: string | null = null

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6)

                // Skip the [DONE] signal
                if (dataStr === '[DONE]') {
                  continue
                }

                try {
                  const data = JSON.parse(dataStr)

                  // Handle OpenAI-compatible format
                  if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                    assistantMessage += data.choices[0].delta.content

                    // Update the last message with streaming content
                    if (assistantMessageId) {
                      // Update existing assistant message
                      updateChatMessage(tabId, assistantMessageId, assistantMessage)
                    } else {
                      // Create new assistant message on first chunk
                      assistantMessageId = addChatMessage(tabId, {
                        role: 'assistant',
                        content: assistantMessage
                      })
                    }
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e)
                }
              }
            }
          }
        } finally {
          reader.releaseLock()
        }
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted')
      } else {
        console.error('Streaming error:', error)
        toast.error('Failed to send message. Please try again.')
        addChatMessage(tabId, {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        })
      }
    } finally {
      setIsStreaming(false)
      setIsThinking(false)
      setAbortController(null)
    }
  }


  const stopStreaming = () => {
    if (abortController) {
      abortController.abort()
      setIsStreaming(false)
      setAbortController(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSubmit(e)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground mt-16">
            <p>Start a conversation by typing a message below</p>
            <p className="text-sm mt-2">Press ⌘⏎ to send</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isThinking && (
              <div className="flex items-start space-x-3 p-4 animate-fade-in">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-6 h-6 bg-primary rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <ThinkingAnimation className="mb-2" />
                  <div className="text-sm text-muted-foreground">
                    正在生成回應，請稍候...
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Token Usage Display */}
      {features.showTokenUsage && tokenUsage.total > 0 && (
        <div className="px-4 py-2 border-t border-border bg-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tokens: {tokenUsage.total} total</span>
            <span>
              Prompt: {tokenUsage.prompt} • Completion: {tokenUsage.completion}
            </span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full resize-none min-h-[44px] max-h-32 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={1}
              disabled={isStreaming}
              aria-label="Message input"
            />
          </div>
          
          {isStreaming ? (
            <button
              type="button"
              onClick={stopStreaming}
              className="px-4 py-3 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-all duration-200 btn-smooth"
              aria-label="Stop generating"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className={cn(
                'px-4 py-3 rounded-lg transition-all duration-200',
                input.trim()
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 btn-smooth'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </form>
        
        <div className="text-xs text-muted-foreground mt-2 text-center">
          {isStreaming ? 'Generating response...' : '⌘⏎ to send'}
        </div>
      </div>
    </div>
  )
}
