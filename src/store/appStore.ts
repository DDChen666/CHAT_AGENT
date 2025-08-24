import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateId } from '@/lib/utils'

export interface Tab {
  id: string
  type: 'chat' | 'optimizer'
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

interface AppState {
  // Tabs management
  tabs: Tab[]
  activeTab: string | null
  
  // Actions
  setActiveTab: (tabId: string) => void
  createChatTab: () => void
  createOptimizerTab: () => void
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
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTab: null,
      chatStates: {},
      optimizerStates: {},

      setActiveTab: (tabId) => set({ activeTab: tabId }),

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

          return {
            tabs: newTabs,
            activeTab: newActiveTab,
            chatStates: newChatStates,
            optimizerStates: newOptimizerStates,
          }
        })
      },

      updateTabTitle: (tabId, title) => {
        set((state) => ({
          tabs: state.tabs.map(tab =>
            tab.id === tabId ? { ...tab, title, updatedAt: Date.now() } : tab
          ),
        }))
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
      },
    }),
    {
      name: 'synapse-storage',
      partialize: (state) => ({
        tabs: state.tabs,
        activeTab: state.activeTab,
        chatStates: state.chatStates,
        optimizerStates: state.optimizerStates,
      }),
    }
  )
)