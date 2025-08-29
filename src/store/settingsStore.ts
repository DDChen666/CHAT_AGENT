import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Settings {
  apiKeys: {
    gemini: string
    deepseek: string
  }
  modelSettings: {
    temperature: number
    defaultProvider: string
    defaultModel: string
  }
  systemPrompts: {
    improver: string
    critic: string
  }
  features: {
    showTokenUsage: boolean
    enableGeminiCache: boolean
  }
}

interface SettingsState extends Settings {
  setApiKey: (provider: keyof Settings['apiKeys'], key: string) => void
  setModelSettings: (settings: Partial<Settings['modelSettings']>) => void
  setSystemPrompt: (type: keyof Settings['systemPrompts'], prompt: string) => void
  setFeature: (feature: keyof Settings['features'], enabled: boolean) => void
  resetToDefaults: () => void
}

const defaultSettings: Settings = {
  apiKeys: {
    gemini: '',
    deepseek: '',
  },
  modelSettings: {
    temperature: 0.3,
    defaultProvider: 'gemini',
    defaultModel: 'gemini-2.5-flash',
  },
  systemPrompts: {
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

不要輸出任何 JSON 以外的內容。`,
  },
  features: {
    showTokenUsage: true,
    enableGeminiCache: true,
  },
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setApiKey: (provider, key) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
        })),

      setModelSettings: (settings) =>
        set((state) => ({
          modelSettings: { ...state.modelSettings, ...settings },
        })),

      setSystemPrompt: (type, prompt) =>
        set((state) => ({
          systemPrompts: { ...state.systemPrompts, [type]: prompt },
        })),

      setFeature: (feature, enabled) =>
        set((state) => ({
          features: { ...state.features, [feature]: enabled },
        })),

      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'synapse-settings',
    }
  )
)