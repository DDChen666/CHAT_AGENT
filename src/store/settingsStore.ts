import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createAutoSyncScheduler } from '@/lib/autoSync'

let scheduleSettingsSync: () => void = () => {}

interface SyncResult {
  conflict?: boolean
  serverVersion?: number
  clientVersion?: number
  lastSyncAt?: string
  success?: boolean
  version?: number
  conflictResolved?: boolean
}

type SystemPromptSettings = { chat: string }
const DEFAULT_CHAT_SYSTEM_PROMPT = '請輸出繁體中文回覆'

export interface Settings {
  apiKeys: {
    gemini: string
    deepseek: string
  }
  modelSettings: {
    temperature: number
    defaultProvider: 'gemini' | 'deepseek'
    defaultModel: string
  }
  systemPrompts: SystemPromptSettings
  features: {
    showTokenUsage: boolean
    enableGeminiCache: boolean
  }
  connectionStatus: {
    gemini: boolean
    deepseek: boolean
    lastTested: number
  }
  userModelPreferences: {
    gemini: string[]  // User's preferred Gemini models
    deepseek: string[]  // User's preferred DeepSeek models
  }
}

interface SettingsState extends Settings {
  settingsVersion: number
  setApiKey: (provider: keyof Settings['apiKeys'], key: string) => void
  setModelSettings: (settings: Partial<Settings['modelSettings']>) => void
  setSystemPrompt: (type: keyof Settings['systemPrompts'], prompt: string) => void
  setFeature: (feature: keyof Settings['features'], enabled: boolean) => void
  testConnections: () => Promise<void>
  setConnectionStatus: (provider: 'gemini' | 'deepseek', status: boolean) => void
  resetToDefaults: () => void
  clearSensitiveData: () => void
  // User model preferences
  addPreferredModel: (provider: 'gemini' | 'deepseek', model: string) => void
  removePreferredModel: (provider: 'gemini' | 'deepseek', model: string) => void
  // Sync functionality
  syncToServer: (forceOverwrite?: boolean) => Promise<SyncResult | undefined>
  loadFromServer: () => Promise<void>
  syncStatus: 'idle' | 'syncing' | 'success' | 'error'
  lastSyncAt: number | null
  setSyncStatus: (status: SettingsState['syncStatus']) => void
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
    chat: DEFAULT_CHAT_SYSTEM_PROMPT,
  },
  features: {
    showTokenUsage: true,
    enableGeminiCache: true,
  },
  connectionStatus: {
    gemini: false,
    deepseek: false,
    lastTested: 0,
  },
  userModelPreferences: {
    gemini: [], // Will be populated when models are first fetched
    deepseek: [], // Will be populated when models are first fetched
  },
}

const sanitizeSystemPrompts = (value: unknown): SystemPromptSettings => {
  if (value && typeof (value as { chat?: unknown }).chat === 'string') {
    const rawChat = String((value as { chat: unknown }).chat)
    return { chat: rawChat.trim().length ? rawChat : DEFAULT_CHAT_SYSTEM_PROMPT }
  }
  return { chat: DEFAULT_CHAT_SYSTEM_PROMPT }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      syncStatus: 'idle' as const,
      lastSyncAt: null,
      settingsVersion: 0,

      setApiKey: (provider, key) => {
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
        }))
        scheduleSettingsSync()
      },

      setModelSettings: (settings) => {
        set((state) => ({
          modelSettings: { ...state.modelSettings, ...settings },
        }))
        scheduleSettingsSync()
      },

      setSystemPrompt: (type, prompt) => {
        set((state) => ({
          systemPrompts: sanitizeSystemPrompts({ ...state.systemPrompts, [type]: prompt }),
        }))
        scheduleSettingsSync()
      },

      setFeature: (feature, enabled) => {
        set((state) => ({
          features: { ...state.features, [feature]: enabled },
        }))
        scheduleSettingsSync()
      },

      testConnections: async () => {
        const currentState = get()
        const currentApiKeys = currentState.apiKeys
        const previousStatus = currentState.connectionStatus

        const updatedStatus: Settings['connectionStatus'] = {
          gemini: previousStatus.gemini,
          deepseek: previousStatus.deepseek,
          lastTested: Date.now(),
        }

        const providers = [
          { name: 'deepseek' as const, hasKey: !!currentApiKeys.deepseek },
          { name: 'gemini' as const, hasKey: !!currentApiKeys.gemini },
        ]

        for (const provider of providers) {
          if (!provider.hasKey) {
            updatedStatus[provider.name] = false
            continue
          }

          try {
            const response = await fetch(`/api/keys/test?provider=${provider.name}`)
            const data = await response.json()
            updatedStatus[provider.name] = data.success || false
          } catch {
            updatedStatus[provider.name] = false
          }
        }

        set(() => ({
          connectionStatus: updatedStatus,
        }))

        scheduleSettingsSync()
      },

      setConnectionStatus: (provider, status) => {
        set((state) => ({
          connectionStatus: {
            ...state.connectionStatus,
            [provider]: status,
            lastTested: Date.now(),
          },
        }))

        scheduleSettingsSync()
      },

      resetToDefaults: () => {
        set(() => ({
          ...defaultSettings,
          systemPrompts: sanitizeSystemPrompts(defaultSettings.systemPrompts),
        }))
        scheduleSettingsSync()
      },

      clearSensitiveData: () => set(() => ({
        apiKeys: { gemini: '', deepseek: '' },
        connectionStatus: {
          gemini: false,
          deepseek: false,
          lastTested: 0,
        },
        lastSyncAt: null,
        syncStatus: 'idle',
      })),

      // User model preferences methods
      addPreferredModel: (provider, model) => {
        set((state) => ({
          userModelPreferences: {
            ...state.userModelPreferences,
            [provider]: [...new Set([...state.userModelPreferences[provider], model])],
          },
        }))

        scheduleSettingsSync()
      },

      removePreferredModel: (provider, model) => {
        set((state) => ({
          userModelPreferences: {
            ...state.userModelPreferences,
            [provider]: state.userModelPreferences[provider].filter(m => m !== model),
          },
        }))

        scheduleSettingsSync()
      },

      // Sync functionality
      setSyncStatus: (syncStatus) => set({ syncStatus }),

      syncToServer: async (forceOverwrite = false) => {
        try {
          set({ syncStatus: 'syncing' })

          const currentState = get()
          const settingsData = {
            apiKeys: currentState.apiKeys,
            modelSettings: currentState.modelSettings,
            systemPrompts: sanitizeSystemPrompts(currentState.systemPrompts),
            features: currentState.features,
            connectionStatus: currentState.connectionStatus,
            userModelPreferences: currentState.userModelPreferences,
          }

          const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              settings: settingsData,
              clientVersion: currentState.settingsVersion || 0,
              forceOverwrite,
            }),
          })

          const result = await response.json()

          if (!response.ok) {
            // 處理衝突
            if (response.status === 409 && result.conflict) {
              return {
                conflict: true,
                serverVersion: result.serverVersion,
                clientVersion: result.clientVersion,
                lastSyncAt: result.lastSyncAt,
              }
            }
            if (response.status === 401) {
              set({ syncStatus: 'idle' })
              return undefined
            }
            throw new Error(`Sync failed: ${response.status} - ${result.message}`)
          }

          const serverVersion = typeof result.version === 'number'
            ? result.version
            : currentState.settingsVersion
          const serverLastSync = result.lastSyncAt
            ? new Date(result.lastSyncAt).getTime()
            : Date.now()

          set({
            syncStatus: 'success',
            lastSyncAt: serverLastSync,
            settingsVersion: serverVersion,
          })

          return result
        } catch (error) {
          console.error('Settings sync error:', error)
          set({ syncStatus: 'error' })
          throw error
        }
      },

      loadFromServer: async () => {
        try {
          set({ syncStatus: 'syncing' })

          const response = await fetch('/api/settings')
          if (!response.ok) {
            throw new Error(`Load failed: ${response.status}`)
          }

          const result = await response.json()

          const serverVersion = typeof result.version === 'number' ? result.version : 0
          const serverLastSync = result.lastSyncAt ? new Date(result.lastSyncAt).getTime() : Date.now()

          if (result.settings) {
            set({
              ...result.settings,
              systemPrompts: sanitizeSystemPrompts(result.settings.systemPrompts),
              syncStatus: 'success',
              lastSyncAt: serverLastSync,
              settingsVersion: serverVersion,
            })
          } else {
            set({
              syncStatus: 'success',
              lastSyncAt: serverLastSync,
              settingsVersion: serverVersion,
            })
          }

          return result
        } catch (error) {
          console.error('Load settings error:', error)
          set({ syncStatus: 'error' })
          throw error
        }
      },

    }),
    {
      name: 'synapse-settings',
      // 排除同步狀態不持久化，只保留設定資料
      partialize: (state) => ({
        modelSettings: state.modelSettings,
        systemPrompts: sanitizeSystemPrompts(state.systemPrompts),
        features: state.features,
        connectionStatus: state.connectionStatus,
        userModelPreferences: state.userModelPreferences,
        settingsVersion: state.settingsVersion,
        lastSyncAt: state.lastSyncAt,
        // 不持久化同步狀態
      }),
    }
  )
)

scheduleSettingsSync = createAutoSyncScheduler(
  async () => {
    await useSettingsStore.getState().syncToServer()
  },
  { taskName: 'settings-sync' }
)
