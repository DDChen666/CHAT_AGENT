import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateId } from '@/lib/utils'
import { createAutoSyncScheduler } from '@/lib/autoSync'

let scheduleAppStateSync: () => void = () => {}

interface SyncResult {
  conflict?: boolean
  serverVersion?: number
  clientVersion?: number
  lastSyncAt?: string
  success?: boolean
  version?: number
  conflictResolved?: boolean
}

export interface Tab {
  id: string
  type: 'chat' | 'optimizer' | 'aipk' | 'file2file'
  title: string
  createdAt: number
  updatedAt: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface AIPKChat {
  id: string
  model: string
  provider: string
  messages: ChatMessage[]
  isLoading: boolean
}

export interface AIPKState {
  tabId: string
  prompt: string
  chats: AIPKChat[]
}

export interface ChatState {
  tabId: string
  messages: ChatMessage[]
}

export interface OptimizerState {
  tabId: string
  initialPrompt: string
  rounds: Array<{
    round: number
    improved: string
    review: {
      scores: Record<string, number>
      total: number
      feedback: string[]
    }
  }>
  bestResult?: {
    prompt: string
    score: number
  }
}

export interface File2FileState {
  tabId: string
  inputText: string
  isConverting: boolean
  isDownloading: boolean
  error: string | null
  success: boolean
  lastConvertedAt?: number
}

interface AppState {
  // Tabs management
  tabs: Tab[]
  activeTab: string | null
  stateVersion: number

  // Actions
  setActiveTab: (tabId: string) => void
  createChatTab: () => void
  createOptimizerTab: () => void
  createAIPKTab: () => void
  closeTab: (tabId: string) => void
  updateTabTitle: (tabId: string, title: string) => void

  // Chat states
  chatStates: Record<string, ChatState>
  addChatMessage: (tabId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => string
  updateChatMessage: (tabId: string, messageId: string, content: string) => void

  // Optimizer states
  optimizerStates: Record<string, OptimizerState>
  setOptimizerInitialPrompt: (tabId: string, prompt: string) => void
  addOptimizerRound: (tabId: string, round: OptimizerState['rounds'][0]) => void
  setOptimizerBestResult: (tabId: string, result: OptimizerState['bestResult']) => void
  resetOptimizerProgress: (tabId: string) => void

  // AIPK states
  aipkStates: Record<string, AIPKState>
  setAIPKPrompt: (tabId: string, prompt: string) => void
  addAIPKChat: (tabId: string, model: string, provider: string) => string
  removeAIPKChat: (tabId: string, chatId: string) => void
  updateAIPKChatModel: (tabId: string, chatId: string, model: string, provider: string) => void
  addAIPKMessage: (tabId: string, chatId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => string
  updateAIPKMessage: (tabId: string, chatId: string, messageId: string, content: string) => void
  setAIPKChatLoading: (tabId: string, chatId: string, isLoading: boolean) => void

  // File2File states
  file2fileStates: Record<string, File2FileState>
  setFile2FileInputText: (tabId: string, inputText: string) => void
  setFile2FileConverting: (tabId: string, isConverting: boolean) => void
  setFile2FileDownloading: (tabId: string, isDownloading: boolean) => void
  setFile2FileError: (tabId: string, error: string | null) => void
  setFile2FileSuccess: (tabId: string, success: boolean) => void
  createFile2FileTab: () => void

  // Sync functionality
  syncToServer: (forceOverwrite?: boolean) => Promise<SyncResult | undefined>
  loadFromServer: () => Promise<void>
  syncStatus: 'idle' | 'syncing' | 'success' | 'error'
  lastSyncAt: number | null
  setSyncStatus: (status: AppState['syncStatus']) => void
  resetState: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTab: null,
      stateVersion: 0,
      chatStates: {},
      optimizerStates: {},
      aipkStates: {},
      file2fileStates: {},
      syncStatus: 'idle' as const,
      lastSyncAt: null,

      setActiveTab: (tabId) => {
        set({ activeTab: tabId })
        scheduleAppStateSync()
      },

      createChatTab: () => {
        const tabId = generateId()
        const newTab: Tab = {
          id: tabId,
          type: 'chat',
          title: 'New Chat',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTab: tabId,
          chatStates: {
            ...state.chatStates,
            [tabId]: {
              tabId,
              messages: [],
            },
          },
        }))

        scheduleAppStateSync()
      },

      createOptimizerTab: () => {
        const tabId = generateId()
        const newTab: Tab = {
          id: tabId,
          type: 'optimizer',
          title: 'Prompt Optimizer',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTab: tabId,
          optimizerStates: {
            ...state.optimizerStates,
            [tabId]: {
              tabId,
              initialPrompt: '',
              rounds: [],
            },
          },
        }))

        scheduleAppStateSync()
      },

      createAIPKTab: () => {
        const tabId = generateId()
        const chatId = generateId()
        const newTab: Tab = {
          id: tabId,
          type: 'aipk',
          title: 'AI PK',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        // Use default provider and model from settings store
        // We'll handle this in the component instead to avoid circular dependencies
        const defaultProvider = 'gemini' as const
        const defaultModel = 'gemini-2.5-flash'

        const defaultChat: AIPKChat = {
          id: chatId,
          model: defaultModel,
          provider: defaultProvider,
          messages: [],
          isLoading: false,
        }

        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTab: tabId,
          aipkStates: {
            ...state.aipkStates,
            [tabId]: {
              tabId,
              prompt: '請輸出繁體中文回覆',
              chats: [defaultChat],
            },
          },
        }))

        scheduleAppStateSync()
      },

      createFile2FileTab: () => {
        const tabId = generateId()
        const newTab: Tab = {
          id: tabId,
          type: 'file2file',
          title: 'File to File',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTab: tabId,
          file2fileStates: {
            ...state.file2fileStates,
            [tabId]: {
              tabId,
              inputText: '',
              isConverting: false,
              isDownloading: false,
              error: null,
              success: false,
            },
          },
        }))

        scheduleAppStateSync()
      },

      closeTab: (tabId) => {
        set((state) => {
          const newTabs = state.tabs.filter(tab => tab.id !== tabId)
          const newActiveTab = state.activeTab === tabId
            ? newTabs[0]?.id || null
            : state.activeTab

          const newChatStates = { ...state.chatStates }
          delete newChatStates[tabId]

          const newOptimizerStates = { ...state.optimizerStates }
          delete newOptimizerStates[tabId]

          const newAIPKStates = { ...state.aipkStates }
          delete newAIPKStates[tabId]

          const newFile2FileStates = { ...state.file2fileStates }
          delete newFile2FileStates[tabId]

          return {
            tabs: newTabs,
            activeTab: newActiveTab,
            chatStates: newChatStates,
            optimizerStates: newOptimizerStates,
            aipkStates: newAIPKStates,
            file2fileStates: newFile2FileStates,
          }
        })

        scheduleAppStateSync()
      },

      updateTabTitle: (tabId, title) => {
        set((state) => ({
          tabs: state.tabs.map(tab =>
            tab.id === tabId ? { ...tab, title, updatedAt: Date.now() } : tab
          ),
        }))

        scheduleAppStateSync()
      },

      addChatMessage: (tabId, message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateId(),
          timestamp: Date.now(),
        }

        set((state) => ({
          chatStates: {
            ...state.chatStates,
            [tabId]: {
              ...state.chatStates[tabId],
              messages: [...(state.chatStates[tabId]?.messages || []), newMessage],
            },
          },
        }))

        scheduleAppStateSync()

        // Update tab title based on first user message
        if (message.role === 'user' && message.content) {
          const tab = get().tabs.find(t => t.id === tabId)
          if (tab && tab.title === 'New Chat') {
            const firstLine = message.content.split('\n')[0]
            const title = firstLine.slice(0, 30) + (firstLine.length > 30 ? '...' : '')
            get().updateTabTitle(tabId, title)
          }
        }

        return newMessage.id
      },

      updateChatMessage: (tabId, messageId, content) => {
        set((state) => ({
          chatStates: {
            ...state.chatStates,
            [tabId]: {
              ...state.chatStates[tabId],
              messages: state.chatStates[tabId]?.messages.map(msg =>
                msg.id === messageId ? { ...msg, content } : msg
              ) || [],
            },
          },
        }))

        scheduleAppStateSync()
      },

      setOptimizerInitialPrompt: (tabId, prompt) => {
        set((state) => ({
          optimizerStates: {
            ...state.optimizerStates,
            [tabId]: {
              ...state.optimizerStates[tabId],
              initialPrompt: prompt,
            },
          },
        }))

        scheduleAppStateSync()
      },

      addOptimizerRound: (tabId, round) => {
        set((state) => ({
          optimizerStates: {
            ...state.optimizerStates,
            [tabId]: {
              ...state.optimizerStates[tabId],
              rounds: [...(state.optimizerStates[tabId]?.rounds || []), round],
            },
          },
        }))

        scheduleAppStateSync()
      },

      setOptimizerBestResult: (tabId, result) => {
        set((state) => ({
          optimizerStates: {
            ...state.optimizerStates,
            [tabId]: {
              ...state.optimizerStates[tabId],
              bestResult: result,
            },
          },
        }))

        scheduleAppStateSync()
      },

      resetOptimizerProgress: (tabId) => {
        set((state) => {
          const current = state.optimizerStates[tabId] || { tabId, initialPrompt: '', rounds: [] as OptimizerState['rounds'] }
          return {
            optimizerStates: {
              ...state.optimizerStates,
              [tabId]: {
                ...current,
                rounds: [],
                bestResult: undefined,
              },
            },
          }
        })

        scheduleAppStateSync()
      },

      setAIPKPrompt: (tabId, prompt) => {
        set((state) => ({
          aipkStates: {
            ...state.aipkStates,
            [tabId]: {
              ...state.aipkStates[tabId],
              prompt,
            },
          },
        }))

        scheduleAppStateSync()
      },

      addAIPKChat: (tabId, model, provider) => {
        const chatId = generateId()
        const newChat: AIPKChat = {
          id: chatId,
          model,
          provider,
          messages: [],
          isLoading: false,
        }

        set((state) => ({
          aipkStates: {
            ...state.aipkStates,
            [tabId]: {
              ...state.aipkStates[tabId],
              chats: [...state.aipkStates[tabId].chats, newChat],
            },
          },
        }))

        scheduleAppStateSync()

        return chatId
      },

      removeAIPKChat: (tabId, chatId) => {
        set((state) => ({
          aipkStates: {
            ...state.aipkStates,
            [tabId]: {
              ...state.aipkStates[tabId],
              chats: state.aipkStates[tabId].chats.filter(chat => chat.id !== chatId),
            },
          },
        }))

        scheduleAppStateSync()
      },

      updateAIPKChatModel: (tabId, chatId, model, provider) => {
        let updated = false

        set((state) => {
          const currentState = state.aipkStates[tabId]
          if (!currentState) {
            console.warn(`AIPK state not found for tab ${tabId}`)
            return state
          }

          updated = true

          return {
            aipkStates: {
              ...state.aipkStates,
              [tabId]: {
                ...currentState,
                chats: currentState.chats.map(chat =>
                  chat.id === chatId ? { ...chat, model, provider } : chat
                ),
              },
            },
          }
        })

        if (updated) {
          scheduleAppStateSync()
        }
      },

      addAIPKMessage: (tabId, chatId, message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateId(),
          timestamp: Date.now(),
        }

        let updated = false

        set((state) => {
          const currentState = state.aipkStates[tabId]
          if (!currentState) {
            console.warn(`AIPK state not found for tab ${tabId}`)
            return state
          }

          updated = true

          return {
            aipkStates: {
              ...state.aipkStates,
              [tabId]: {
                ...currentState,
                chats: currentState.chats.map(chat =>
                  chat.id === chatId
                    ? { ...chat, messages: [...chat.messages, newMessage] }
                    : chat
                ),
              },
            },
          }
        })

        if (updated) {
          scheduleAppStateSync()
        }

        return newMessage.id
      },

      updateAIPKMessage: (tabId, chatId, messageId, content) => {
        let updated = false

        set((state) => {
          const currentState = state.aipkStates[tabId]
          if (!currentState) {
            console.warn(`AIPK state not found for tab ${tabId}`)
            return state
          }

          updated = true

          return {
            aipkStates: {
              ...state.aipkStates,
              [tabId]: {
                ...currentState,
                chats: currentState.chats.map(chat =>
                  chat.id === chatId
                    ? {
                        ...chat,
                        messages: chat.messages.map(msg =>
                          msg.id === messageId ? { ...msg, content } : msg
                        ),
                      }
                    : chat
                ),
              },
            },
          }
        })

        if (updated) {
          scheduleAppStateSync()
        }
      },

      setAIPKChatLoading: (tabId, chatId, isLoading) => {
        let updated = false

        set((state) => {
          const currentState = state.aipkStates[tabId]
          if (!currentState) {
            console.warn(`AIPK state not found for tab ${tabId}`)
            return state
          }

          updated = true

          return {
            aipkStates: {
              ...state.aipkStates,
              [tabId]: {
                ...currentState,
                chats: currentState.chats.map(chat =>
                  chat.id === chatId ? { ...chat, isLoading } : chat
                ),
              },
            },
          }
        })

        if (updated) {
          scheduleAppStateSync()
        }
      },

      setFile2FileInputText: (tabId, inputText) => {
        set((state) => ({
          file2fileStates: {
            ...state.file2fileStates,
            [tabId]: {
              ...state.file2fileStates[tabId],
              inputText,
              error: null,
              success: false,
            },
          },
        }))

        scheduleAppStateSync()
      },

      setFile2FileConverting: (tabId, isConverting) => {
        set((state) => ({
          file2fileStates: {
            ...state.file2fileStates,
            [tabId]: {
              ...state.file2fileStates[tabId],
              isConverting,
            },
          },
        }))

        scheduleAppStateSync()
      },

      setFile2FileDownloading: (tabId, isDownloading) => {
        set((state) => ({
          file2fileStates: {
            ...state.file2fileStates,
            [tabId]: {
              ...state.file2fileStates[tabId],
              isDownloading,
            },
          },
        }))

        scheduleAppStateSync()
      },

      setFile2FileError: (tabId, error) => {
        set((state) => ({
          file2fileStates: {
            ...state.file2fileStates,
            [tabId]: {
              ...state.file2fileStates[tabId],
              error,
              success: false,
            },
          },
        }))

        scheduleAppStateSync()
      },

      setFile2FileSuccess: (tabId, success) => {
        set((state) => ({
          file2fileStates: {
            ...state.file2fileStates,
            [tabId]: {
              ...state.file2fileStates[tabId],
              success,
              error: null,
              lastConvertedAt: success ? Date.now() : undefined,
            },
          },
        }))

        scheduleAppStateSync()
      },

      // Sync functionality
      setSyncStatus: (syncStatus) => set({ syncStatus }),

      resetState: () => set({
        tabs: [],
        activeTab: null,
        stateVersion: 0,
        chatStates: {},
        optimizerStates: {},
        aipkStates: {},
        file2fileStates: {},
        syncStatus: 'idle',
        lastSyncAt: null,
      }),

      syncToServer: async (forceOverwrite = false) => {
        try {
          set({ syncStatus: 'syncing' })

          const currentState = get()
          const appStateData = {
            tabs: currentState.tabs,
            activeTab: currentState.activeTab,
            chatStates: currentState.chatStates,
            optimizerStates: currentState.optimizerStates,
            aipkStates: currentState.aipkStates,
          }

          const response = await fetch('/api/app-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              state: appStateData,
              clientVersion: currentState.stateVersion || 0,
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
            throw new Error(`App state sync failed: ${response.status} - ${result.message}`)
          }

          const serverVersion = typeof result.version === 'number'
            ? result.version
            : currentState.stateVersion
          const serverLastSync = result.lastSyncAt
            ? new Date(result.lastSyncAt).getTime()
            : Date.now()

          set({
            syncStatus: 'success',
            lastSyncAt: serverLastSync,
            stateVersion: serverVersion,
          })

          return result
        } catch (error) {
          console.error('App state sync error:', error)
          set({ syncStatus: 'error' })
          throw error
        }
      },

      loadFromServer: async () => {
        try {
          set({ syncStatus: 'syncing' })

          const response = await fetch('/api/app-state')
          if (!response.ok) {
            throw new Error(`Load app state failed: ${response.status}`)
          }

          const result = await response.json()

          const serverVersion = typeof result.version === 'number' ? result.version : 0
          const serverLastSync = result.lastSyncAt ? new Date(result.lastSyncAt).getTime() : Date.now()

          if (result.state) {
            set({
              ...result.state,
              syncStatus: 'success',
              lastSyncAt: serverLastSync,
              stateVersion: serverVersion,
            })
          } else {
            set({
              syncStatus: 'success',
              lastSyncAt: serverLastSync,
              stateVersion: serverVersion,
            })
          }

          return result
        } catch (error) {
          console.error('Load app state error:', error)
          set({ syncStatus: 'error' })
          throw error
        }
      },

    }),
    {
      name: 'synapse-storage',
      // 排除同步狀態不持久化，只保留應用狀態
      partialize: (state) => ({
        tabs: state.tabs,
        activeTab: state.activeTab,
        stateVersion: state.stateVersion,
        chatStates: state.chatStates,
        optimizerStates: state.optimizerStates,
        aipkStates: state.aipkStates,
        file2fileStates: state.file2fileStates,
        lastSyncAt: state.lastSyncAt,
        // 不持久化同步狀態
      }),
    }
  )
)
scheduleAppStateSync = createAutoSyncScheduler(
  async () => {
    await useAppStore.getState().syncToServer()
  },
  { taskName: 'app-state-sync' }
)
