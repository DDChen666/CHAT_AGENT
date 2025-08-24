'use client'

import { useState } from 'react'
import { MessageSquare, Settings, Sparkles, Plus } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/lib/utils'
import SettingsModal from '../settings/SettingsModal'

export default function Sidebar() {
  const { tabs, activeTab, setActiveTab, closeTab, createChatTab, createOptimizerTab } = useAppStore()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleNewChat = () => {
    createChatTab()
  }

  const handleNewOptimizer = () => {
    createOptimizerTab()
  }

  return (
    <div className="w-64 bg-sidebar border-r border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Synapse</h1>
          <div className="flex gap-2">
            <button
              onClick={handleNewChat}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              title="New Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={handleNewOptimizer}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              title="New Optimizer"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors group',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.type === 'chat' ? (
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="flex-1 truncate text-sm">{tab.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive rounded transition-all"
              >
                <Plus className="w-3 h-3 rotate-45" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <button 
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-3 w-full p-2 hover:bg-accent rounded-md transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
        </button>
        
        <SettingsModal 
          open={settingsOpen} 
          onOpenChange={setSettingsOpen} 
        />
      </div>
    </div>
  )
}