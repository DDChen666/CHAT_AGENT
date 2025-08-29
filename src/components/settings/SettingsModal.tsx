'use client'

import { useState } from 'react'
import { Save, TestTube } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { useSettingsStore } from '@/store/settingsStore'
import { cn } from '@/lib/utils'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const {
    apiKeys,
    modelSettings,
    systemPrompts,
    features,
    setApiKey,
    setModelSettings,
    setSystemPrompt,
    setFeature,
  } = useSettingsStore()

  const [isTesting, setIsTesting] = useState(false)

  const handleSave = () => {
    // Settings are automatically saved to the store
    onOpenChange(false)
  }

  const handleTestConnection = async (provider: string) => {
    setIsTesting(true)
    try {
      const apiKey = apiKeys[provider as keyof typeof apiKeys]
      
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, apiKey }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`✅ ${provider.toUpperCase()} API connection successful!\n${result.message}`)
      } else {
        alert(`❌ ${provider.toUpperCase()} API connection failed:\n${result.message}`)
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      alert(`❌ ${provider.toUpperCase()} API connection test failed: Network error`)
    } finally {
      setIsTesting(false)
    }
  }

  const restoreDefaultPrompt = (promptType: 'improver' | 'critic') => {
    const defaultPrompts = {
      improver: `你是一位世界頂尖的 Prompt 工程專家，你的任務是將一個簡單的用戶需求，轉化為一個結構化、功能強大、細節豐富的 Prompt。

你的工作流程是：
1.  **分析輸入**: 仔細理解用戶的\`初始需求\`、\`當前 Prompt 版本\`以及\`審核者回饋\`。
2.  **應用最佳實踐**: 在你的新 Prompt 中，靈活運用以下一種或多種高級技巧來增強效果：
    - **角色扮演 (Role-Playing)**: 明確指定 AI 扮演的角色。
    - **結構化格式 (Structured Format)**: 使用 Markdown（如 #, ##, ###）來組織結構，例如 \`Role\`, \`Task\`, \`Context\`, \`Constraints\`, \`Output Format\` 等。
    - **思維鏈 (Chain of Thought, CoT)**: 引導 AI 一步步思考。
    - **提供範例 (Few-shot Examples)**: 給出輸入和輸出的範例，讓 AI 更好地理解期望。
    - **明確的約束 (Constraints)**: 設定清晰的規則和限制，避免 AI 偏離主題。
3.  **整合回饋**: 針對\`審核者回饋\`中的每一條建議，思考如何將其融入到新的 Prompt 中。
4.  **輸出**: 只輸出**完整且可直接使用**的新 Prompt 內容，不要包含任何額外的解釋或對話。`,
      critic: `你是一位嚴謹、注重細節的 AI 系統分析師。你的任務是評估一個給定的 Prompt，並提供結構化的、可執行的回饋。

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
    
    setSystemPrompt(promptType, defaultPrompts[promptType])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* API Keys Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">API Keys</h3>
            
            {/* Gemini */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Gemini API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeys.gemini}
                  onChange={(e) => setApiKey('gemini', e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={() => handleTestConnection('gemini')}
                  disabled={!apiKeys.gemini || isTesting}
                  className={cn(
                    'px-3 py-2 border border-border rounded-lg transition-colors',
                    apiKeys.gemini && !isTesting
                      ? 'hover:bg-accent'
                      : 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <TestTube className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* DeepSeek */}
            <div>
              <label className="block text-sm font-medium mb-2">
                DeepSeek API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeys.deepseek}
                  onChange={(e) => setApiKey('deepseek', e.target.value)}
                  placeholder="Enter your DeepSeek API key"
                  className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={() => handleTestConnection('deepseek')}
                  disabled={!apiKeys.deepseek || isTesting}
                  className={cn(
                    'px-3 py-2 border border-border rounded-lg transition-colors',
                    apiKeys.deepseek && !isTesting
                      ? 'hover:bg-accent'
                      : 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <TestTube className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Model Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Model Settings</h3>
            
            {/* Default Provider */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Default Provider
              </label>
              <select
                value={modelSettings.defaultProvider}
                onChange={(e) => setModelSettings({ defaultProvider: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="gemini">Gemini</option>
                <option value="deepseek">DeepSeek</option>
              </select>
            </div>

            {/* Default Model */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Default Model
              </label>
              <select
                value={modelSettings.defaultModel}
                onChange={(e) => setModelSettings({ defaultModel: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="deepseek-chat">DeepSeek Chat</option>
              </select>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Temperature: {modelSettings.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={modelSettings.temperature}
                onChange={(e) => setModelSettings({ temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>More deterministic</span>
                <span>More creative</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Prompts Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">System Prompts</h3>
          
          <div className="space-y-4">
            {/* Improver Prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">
                  Improver Prompt
                </label>
                <button
                  onClick={() => restoreDefaultPrompt('improver')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Restore Default
                </button>
              </div>
              <textarea
                value={systemPrompts.improver}
                onChange={(e) => setSystemPrompt('improver', e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                placeholder="Enter Improver system prompt"
              />
            </div>

            {/* Critic Prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">
                  Critic Prompt
                </label>
                <button
                  onClick={() => restoreDefaultPrompt('critic')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Restore Default
                </button>
              </div>
              <textarea
                value={systemPrompts.critic}
                onChange={(e) => setSystemPrompt('critic', e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                placeholder="Enter Critic system prompt"
              />
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Features</h3>
          
          <div className="space-y-3">
            {/* Show Token Usage */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Show Token Usage
                </label>
                <p className="text-xs text-muted-foreground">
                  Display token counts in chat interface
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={features.showTokenUsage}
                  onChange={(e) => setFeature('showTokenUsage', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Enable Gemini Cache */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Enable Gemini Cache
                </label>
                <p className="text-xs text-muted-foreground">
                  Use caching to reduce API costs (Gemini only)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={features.enableGeminiCache}
                  onChange={(e) => setFeature('enableGeminiCache', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}