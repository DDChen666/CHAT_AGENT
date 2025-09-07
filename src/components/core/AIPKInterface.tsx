'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, StopCircle, Plus, X, Settings } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useSettingsStore } from '@/store/settingsStore'
import { cn } from '@/lib/utils'
import MessageBubble from './MessageBubble'
import ThinkingAnimation from './ThinkingAnimation'
import { toast } from 'sonner'
import { getModelOptions, type ProviderName } from '@/lib/providers'

interface AIPKInterfaceProps {
  tabId: string
}

export default function AIPKInterface({ tabId }: AIPKInterfaceProps) {
  const {
    aipkStates,
    setAIPKPrompt,
    addAIPKChat,
    removeAIPKChat,
    updateAIPKChatModel,
    addAIPKMessage,
    updateAIPKMessage,
    setAIPKChatLoading
  } = useAppStore()
  const { features, modelSettings, apiKeys, connectionStatus, testConnections, userModelPreferences } = useSettingsStore()

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const aipkState = aipkStates[tabId]
  const prompt = aipkState?.prompt || ''
  const chats = aipkState?.chats || []

  // Selector function to filter models based on user preferences
  const getFilteredModels = useCallback((provider: ProviderName, availableModels: string[]) => {
    const preferredModels = userModelPreferences[provider] || []

    // If no preferences set, return all available models
    if (preferredModels.length === 0) {
      return availableModels
    }

    // Return intersection of available models and user preferences
    return availableModels.filter(model => preferredModels.includes(model))
  }, [userModelPreferences])

  // Get available models from providers config with user preferences
  const allModels = getModelOptions()
  const availableModels = {
    gemini: getFilteredModels('gemini', allModels.gemini),
    deepseek: getFilteredModels('deepseek', allModels.deepseek)
  }

  // Update default chat if it's using wrong defaults
  useEffect(() => {
    if (chats.length === 1 && chats[0].provider === 'openai') {
      // Update to use settings default
      updateAIPKChatModel(tabId, chats[0].id, modelSettings.defaultModel, modelSettings.defaultProvider)
    }
  }, [chats, modelSettings])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }


  useEffect(() => {
    scrollToBottom()
  }, [chats])

  useEffect(() => {
    // Test connections on component mount
    testConnections()
  }, []) // Only run once on mount

  useEffect(() => {
    // Re-test connections when API keys change
    if (apiKeys.deepseek || apiKeys.gemini) {
      testConnections()
    }
  }, [apiKeys.deepseek, apiKeys.gemini])

  const handlePromptChange = (value: string) => {
    setAIPKPrompt(tabId, value)
  }

  const handleAddChat = () => {
    if (chats.length >= 5) {
      toast.error('最多只能同時開啟5個聊天視窗')
      return
    }
    addAIPKChat(tabId, 'gpt-3.5-turbo', 'openai')
  }

  const handleRemoveChat = (chatId: string) => {
    if (chats.length <= 1) {
      toast.error('至少需要保留一個聊天視窗')
      return
    }
    removeAIPKChat(tabId, chatId)
  }

  const handleModelChange = (chatId: string, model: string, provider: string) => {
    updateAIPKChatModel(tabId, chatId, model, provider)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    const userMessage = input.trim()
    setInput('')

    // 为所有聊天窗口添加用户消息
    const userMessageIds: string[] = []
    const assistantMessageIds: string[] = []
    chats.forEach(chat => {
      const userMessageId = addAIPKMessage(tabId, chat.id, {
        role: 'user',
        content: userMessage
      })
      userMessageIds.push(userMessageId)

      // 预创建空的助手消息
      const assistantMessageId = addAIPKMessage(tabId, chat.id, {
        role: 'assistant',
        content: ''
      })
      assistantMessageIds.push(assistantMessageId)
    })

    setIsStreaming(true)
    setIsThinking(true)

    // 为每个聊天窗口发送请求，带时间差
    const delay = 1000 // 1秒延迟
    const requests = chats.map((chat, index) => {
      return new Promise<void>((resolve) => {
        setTimeout(async () => {
          try {
            setAIPKChatLoading(tabId, chat.id, true)

            const controller = new AbortController()
            setAbortController(controller)

            const provider = chat.provider as ProviderName
            const selectedKey = provider === 'gemini' ? apiKeys.gemini : apiKeys.deepseek

            // Only proceed if we have a valid provider and API key
            if (!selectedKey || !connectionStatus[provider as keyof typeof connectionStatus]) {
              console.warn(`Skipping chat for ${provider} - no valid API key or not connected`)
              resolve()
              return
            }

            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                provider,
                model: chat.model,
                messages: [
                  ...(prompt ? [{ role: 'system' as const, content: prompt }] : []),
                  ...chat.messages,
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
            console.log('Starting to read streaming response for chat:', chat.id)

            if (reader) {
              while (true) {
                const { done, value } = await reader.read()
                if (done) {
                  console.log('Stream reading completed for chat:', chat.id)
                  break
                }

                const chunk = decoder.decode(value)
                console.log('Received chunk for chat', chat.id, ':', chunk.slice(0, 100) + '...')
                const lines = chunk.split('\n')

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6)
                    if (data === '[DONE]') {
                      console.log('Received [DONE] for chat:', chat.id)
                      break
                    }

                    try {
                      const parsed = JSON.parse(data)
                      console.log('Parsed data for chat', chat.id, ':', parsed)
                      if (parsed.choices?.[0]?.delta?.content) {
                        assistantMessage += parsed.choices[0].delta.content
                        console.log('Updated message for chat', chat.id, 'length:', assistantMessage.length)
                        updateAIPKMessage(tabId, chat.id, assistantMessageIds[index], assistantMessage)
                      }
                    } catch (e) {
                      console.error('Parse error for chat', chat.id, ':', e, 'data:', data)
                    }
                  }
                }
              }
            }

            // Assistant message is already updated during streaming, no need to add again

          } catch (error) {
            console.error('Error in chat request:', error)
            // Update the pre-created assistant message with error content
            updateAIPKMessage(tabId, chat.id, assistantMessageIds[index], '抱歉，發生了錯誤。請檢查您的API設定。')
          } finally {
            setAIPKChatLoading(tabId, chat.id, false)
            resolve()
          }
        }, index * delay)
      })
    })

    // 等待所有请求完成
    await Promise.all(requests)

    setIsStreaming(false)
    setIsThinking(false)
  }

  const stopStreaming = () => {
    abortController?.abort()
    setIsStreaming(false)
    setIsThinking(false)
    chats.forEach(chat => {
      setAIPKChatLoading(tabId, chat.id, false)
    })
  }

  return (
    <div className="flex h-full">
      {/* 左侧 Prompt 输入框 */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-foreground mb-2">System Prompt</h3>
          <textarea
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="輸入系統提示詞..."
            className="w-full h-32 resize-none rounded-lg border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* 模型选择区域 */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium text-foreground">AI Models</h3>
            </div>
            <button
              onClick={handleAddChat}
              disabled={chats.length >= 5}
              className="p-1 hover:bg-accent rounded transition-colors disabled:opacity-50"
              title="Add Chat Window"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {/* Connection status overview */}
          <div className="mb-3 p-2 bg-muted/50 rounded text-xs">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">連接狀態:</span>
              <span className={`flex items-center gap-1 ${connectionStatus.deepseek ? 'text-green-600' : 'text-red-500'}`}>
                DeepSeek {connectionStatus.deepseek ? '✅' : '❌'}
              </span>
              <span className={`flex items-center gap-1 ${connectionStatus.gemini ? 'text-green-600' : 'text-red-500'}`}>
                Gemini {connectionStatus.gemini ? '✅' : '❌'}
              </span>
            </div>
            {/* Debug info */}
            <div className="mt-1 text-xs text-muted-foreground">
              API Keys: DeepSeek({apiKeys.deepseek ? '✓' : '✗'}) | Gemini({apiKeys.gemini ? '✓' : '✗'})
              <br />
              最後測試: {connectionStatus.lastTested ? new Date(connectionStatus.lastTested).toLocaleTimeString() : '未測試'}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span>
                按鈕狀態: 輸入({input.trim() ? '✓' : '✗'})
              </span>
              <button
                onClick={testConnections}
                className="text-xs px-2 py-1 bg-primary/20 hover:bg-primary/30 rounded transition-colors"
              >
                重新測試
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {chats.map((chat, index) => (
              <div key={chat.id} className="flex items-center gap-2">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  AI {index + 1}
                </span>
                <select
                  value={`${chat.provider}:${chat.model}`}
                  onChange={(e) => {
                    const [provider, model] = e.target.value.split(':')
                    handleModelChange(chat.id, model, provider)
                  }}
                  className="flex-1 text-xs rounded border border-border p-1 focus:outline-none focus:ring-1 focus:ring-primary"
                  disabled={false}
                >
                  {/* Only show connected providers with their available models */}
                  {Object.entries(connectionStatus).filter(([key]) => key !== 'lastTested').map(([provider, isConnected]) => {
                    if (!isConnected) return null

                    const providerName = provider as ProviderName
                    const models = availableModels[providerName] || []

                    return models.map(model => {
                      // Truncate long model names for better display
                      const displayModel = model.length > 15 ? `${model.substring(0, 12)}...` : model
                      const providerShort = provider === 'deepseek' ? 'DS' : 'GM'
                      return (
                        <option key={`${provider}:${model}`} value={`${provider}:${model}`} title={`${provider === 'deepseek' ? 'DeepSeek' : 'Gemini'} ${model}`}>
                          {providerShort} {displayModel} ✅
                        </option>
                      )
                    })
                  })}
                  {/* Show message if no providers are connected */}
                  {Object.entries(connectionStatus).filter(([key]) => key !== 'lastTested').every(([, connected]) => !connected) && (
                    <option disabled>請先在設定中配置API Key</option>
                  )}
                </select>
                {chats.length > 1 && (
                  <button
                    onClick={() => handleRemoveChat(chat.id)}
                    className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded transition-colors"
                    title="Remove Chat"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 输入区域 */}
        <div className="flex-1 p-4">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder="輸入您的訊息..."
              className="flex-1 resize-none rounded-lg border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-3"
              disabled={isStreaming}
            />

            <div className="flex items-center gap-2">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStreaming}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-all duration-200 btn-smooth flex-1"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  停止
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={cn(
                    'px-4 py-2 rounded-lg transition-all duration-200 flex-1 flex items-center justify-center',
                    input.trim()
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 btn-smooth'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  <Send className="w-4 h-4 mr-2" />
                  發送給所有AI
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* 右侧聊天窗口区域 */}
      <div className="flex-1 flex">
        {chats.map((chat, index) => (
          <div
            key={chat.id}
            className={cn(
              'flex-1 border-r border-border last:border-r-0 flex flex-col',
              chats.length === 1 && 'flex-1',
              chats.length === 2 && 'flex-1',
              chats.length === 3 && 'flex-1',
              chats.length === 4 && 'flex-1',
              chats.length === 5 && 'flex-1'
            )}
          >
            {/* 聊天窗口头部 */}
            <div className="p-3 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  AI {index + 1} - {chat.model}
                </span>
              </div>
            </div>

            {/* 消息区域 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chat.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  showTokenUsage={features.showTokenUsage}
                />
              ))}
              {chat.isLoading && (
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
              <div ref={messagesEndRef} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
