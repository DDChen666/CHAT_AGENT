'use client'

import { useState } from 'react'
import { Play, Square, Copy, RotateCcw, Clipboard } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useSettingsStore } from '@/store/settingsStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import ThinkingAnimation from './ThinkingAnimation'

interface OptimizerInterfaceProps {
  tabId: string
}

export default function OptimizerInterface({ tabId }: OptimizerInterfaceProps) {
  const { optimizerStates, setOptimizerInitialPrompt, addOptimizerRound, setOptimizerBestResult, resetOptimizerProgress } = useAppStore()
  const { modelSettings, apiKeys, systemPrompts } = useSettingsStore()
  const [input, setInput] = useState('')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [currentRound, setCurrentRound] = useState(0)

  const activeProviderKey = modelSettings.defaultProvider === 'gemini' ? apiKeys.gemini : apiKeys.deepseek

  const optimizerState = optimizerStates[tabId]
  const rounds = optimizerState?.rounds || []
  const bestResult = optimizerState?.bestResult

  const handleStartOptimization = async () => {
    if (!input.trim() || isOptimizing) return

    const provider = modelSettings.defaultProvider
    const selectedKey = provider === 'gemini' ? apiKeys.gemini : apiKeys.deepseek

    if (!selectedKey) {
      toast.error(`Please configure your ${provider === 'gemini' ? 'Gemini' : 'DeepSeek'} API key in Settings before optimizing.`)
      return
    }

    resetOptimizerProgress(tabId)
    setOptimizerInitialPrompt(tabId, input.trim())
    setIsOptimizing(true)
    setCurrentRound(0)

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initialPrompt: input.trim(),
          iterations: 8,
          threshold: 90,
          provider,
          apiKey: selectedKey,
          systemPrompts,
          model: modelSettings.defaultModel,
          temperature: modelSettings.temperature,
        }),
      })

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const data = await response.json()
          if (data?.message) {
            errorMessage = data.message
          }
        } catch {
          try {
            const text = await response.text()
            if (text) {
              errorMessage = text
            }
          } catch {
            // ignore
          }
        }
        throw new Error(errorMessage)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let encounteredError = false
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue

              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === 'error') {
                  setIsOptimizing(false)
                  setCurrentRound((prev) => (prev > 0 ? prev : data.round ?? 0))
                  toast.error(data.message || 'Optimizer pipeline failed')
                  encounteredError = true
                  break
                }

                if (data.round) {
                  setCurrentRound(data.round)
                  addOptimizerRound(tabId, data)

                  if (data.bestSoFar) {
                    setOptimizerBestResult(tabId, {
                      prompt: data.bestSoFar.prompt,
                      score: data.bestSoFar.score,
                    })
                  }
                }

                if (data.type === 'final') {
                  setOptimizerBestResult(tabId, {
                    prompt: data.prompt,
                    score: data.score,
                  })
                  setIsOptimizing(false)
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e)
              }
            }

            if (encounteredError) {
              break
            }
          }
        } finally {
          reader.releaseLock()
        }
      }
    } catch (error) {
      console.error('Optimization error:', error)
      toast.error(error instanceof Error ? error.message : 'Optimization failed. Please try again.')
    } finally {
      setIsOptimizing(false)
    }
  }


  const handleCopyBestResult = async () => {
    if (bestResult) {
      try {
        await navigator.clipboard.writeText(bestResult.prompt)
        toast.success('Prompt copied to clipboard!')
      } catch (err) {
        console.error('Failed to copy text: ', err)
        toast.error('Failed to copy prompt')
      }
    }
  }

  const handleCopyPrompt = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Prompt copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy text: ', err)
      toast.error('Failed to copy prompt')
    }
  }

  const handleRestartWithFeedback = () => {
    if (bestResult) {
      setInput(bestResult.prompt)
      setOptimizerBestResult(tabId, undefined)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Three-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Control Panel */}
        <div className="w-80 border-r border-border p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Prompt Optimizer</h2>
          
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your initial prompt or idea..."
              className="w-full h-64 p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isOptimizing}
            />
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress:</span>
                <span className="font-medium">
                  {isOptimizing ? `${currentRound}/8` : rounds.length > 0 ? 'Complete' : 'Ready'}
                </span>
              </div>
              
              {bestResult && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Best Score:</span>
                  <span className="font-medium text-green-600">{bestResult.score}/100</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {isOptimizing ? (
              <button
                onClick={() => setIsOptimizing(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
              >
                <Square className="w-4 h-4" />
                Stop Optimization
              </button>
            ) : (
              <button
                onClick={handleStartOptimization}
                disabled={!input.trim() || !activeProviderKey}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors',
                  input.trim() && activeProviderKey
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                <Play className="w-4 h-4" />
                Start Optimization
              </button>
            )}

            {bestResult && (
              <button
                onClick={handleRestartWithFeedback}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Restart with Feedback
              </button>
            )}
          </div>
        </div>

        {/* Middle Column - Improver Results */}
        <div className="flex-1 border-r border-border overflow-y-auto">
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Improved Prompts</h3>

            {isOptimizing && (
              <div className="flex items-start space-x-3 p-4 border border-dashed border-border rounded-lg bg-muted/30 animate-fade-in">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-6 h-6 bg-primary rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <ThinkingAnimation className="mb-2" />
                  <div className="text-sm text-muted-foreground">
                    正在優化提示，請稍候...
                  </div>
                </div>
              </div>
            )}

            {rounds.length === 0 ? (
              <div className="text-center text-muted-foreground mt-16">
                <p>Optimization results will appear here</p>
                <p className="text-sm mt-2">Each round shows the improved prompt</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rounds.map((round) => (
                  <div
                    key={round.round}
                    className={cn(
                      'p-4 border border-border rounded-lg',
                      bestResult?.score === round.review.total && 'border-2 border-green-500'
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">Round {round.round}</span>
                      <span className="text-sm px-2 py-1 bg-muted rounded">
                        Score: {round.review.total}/100
                      </span>
                    </div>
                    
                    <div className="whitespace-pre-wrap text-sm bg-muted p-3 rounded mb-3">
                      {round.improved}
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleCopyPrompt(round.improved)}
                        className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded hover:bg-accent transition-colors"
                        title="Copy prompt"
                      >
                        <Clipboard className="w-3 h-3" />
                        Copy
                      </button>
                      <button
                        onClick={() => {
                          setInput(round.improved)
                          setOptimizerBestResult(tabId, undefined)
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded hover:bg-accent transition-colors"
                        title="Restart with this prompt"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Reviewer Feedback */}
        <div className="w-96 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Review Feedback</h3>
            
            {rounds.length === 0 ? (
              <div className="text-center text-muted-foreground mt-16">
                <p>Review feedback will appear here</p>
                <p className="text-sm mt-2">Detailed scores and suggestions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rounds.map((round) => (
                  <div key={round.round} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium">Round {round.round}</span>
                      <span className="text-2xl font-bold text-green-600">
                        {round.review.total}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {Object.entries(round.review.scores || {}).map(([category, score]) => {
                        // Ensure score is a number
                        const numericScore = typeof score === 'number' ? score : 0
                        return (
                          <div key={category} className="flex items-center justify-between text-sm">
                            <span className="capitalize text-muted-foreground">{category}:</span>
                            <span className="font-medium">{numericScore}/100</span>
                          </div>
                        )
                      })}
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Suggestions:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {round.review.feedback.map((item, index) => (
                          <li key={index} className="ml-4 list-disc">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Best Result Banner */}
      {bestResult && (
        <div className="border-t border-border bg-green-50 dark:bg-green-950 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                🎉 Best Result Achieved!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Final score: {bestResult.score}/100
              </p>
            </div>
            
            <button
              onClick={handleCopyBestResult}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy Prompt
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
