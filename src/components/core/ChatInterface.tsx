'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, StopCircle } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/lib/utils'
import MessageBubble from './MessageBubble'
import { toast } from 'sonner'

interface ChatInterfaceProps {
  tabId: string
}

export default function ChatInterface({ tabId }: ChatInterfaceProps) {
  const { chatStates, addChatMessage, updateChatMessage } = useAppStore()
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const chatState = chatStates[tabId]
  const messages = useMemo(() => chatState?.messages || [], [chatState?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    const userMessage = input.trim()
    setInput('')
    addChatMessage(tabId, { role: 'user', content: userMessage })

    setIsStreaming(true)
    const controller = new AbortController()
    setAbortController(controller)

    try {
      // Call the actual API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          messages: [...messages, { role: 'user', content: userMessage }],
          temperature: 0.3,
          stream: true,
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
                try {
                  const data = JSON.parse(line.slice(6))
                  
                  if (data.type === 'chunk' && data.delta) {
                    assistantMessage += data.delta
                    
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
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

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
              className="px-4 py-3 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
              aria-label="Stop generating"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className={cn(
                'px-4 py-3 rounded-lg transition-colors',
                input.trim()
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
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