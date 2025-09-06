'use client'

import { useState } from 'react'
import { MessageSquare, Settings, Sparkles, Plus, ChevronLeft } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/lib/utils'
import SettingsModal from '../settings/SettingsModal'
import Image from 'next/image'

export default function Sidebar() {
  const { tabs, activeTab, setActiveTab, closeTab, createChatTab, createOptimizerTab } = useAppStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleNewChat = () => {
    createChatTab()
  }

  const handleNewOptimizer = () => {
    createOptimizerTab()
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  if (isCollapsed) {
    return (
      <div className="w-16 bg-sidebar border-r border-border h-full flex flex-col">
        {/* Collapsed Header */}
        <div className="p-3 border-b border-border">
          <button
            onClick={toggleSidebar}
            className="w-full flex justify-center p-2 hover:bg-accent rounded-md transition-all duration-200 btn-smooth"
            title="Expand Sidebar"
          >
            <Image
              src="/logo.png"
              alt="Synapse Logo"
              width={32}
              height={32}
              className="rounded"
            />
          </button>
        </div>

        {/* Collapsed Actions */}
        <div className="p-3 space-y-2">
          <button
            onClick={handleNewChat}
            className="w-full flex justify-center p-2 hover:bg-accent rounded-md transition-all duration-200 btn-smooth"
            title="New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={handleNewOptimizer}
            className="w-full flex justify-center p-2 hover:bg-accent rounded-md transition-all duration-200 btn-smooth"
            title="New Optimizer"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-sidebar border-r border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <Image
            src="/logo.png"
            alt="Synapse Logo"
            width={32}
            height={32}
            className="rounded"
          />
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-accent rounded-md transition-all duration-200 btn-smooth"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Actions - Chat and Prompt Optimizer */}
      <div className="p-2 space-y-1">
        <button
          onClick={handleNewChat}
          className="flex items-center gap-3 w-full p-3 hover:bg-accent rounded-md transition-all duration-200 btn-smooth"
          title="New Chat"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">新聊天</span>
        </button>
        <button
          onClick={handleNewOptimizer}
          className="flex items-center gap-3 w-full p-3 hover:bg-accent rounded-md transition-all duration-200 btn-smooth"
          title="New Optimizer"
        >
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">Prompt Optimizer</span>
        </button>

        {/* Separator */}
        <div className="border-t border-border my-2"></div>
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
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive rounded transition-all duration-200 btn-smooth"
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
          className="flex items-center gap-3 w-full p-2 hover:bg-accent rounded-md transition-all duration-200 btn-smooth"
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