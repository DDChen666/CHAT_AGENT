'use client'

import Sidebar from './Sidebar'
import { useAppStore } from '@/store/appStore'
import ChatInterface from '../core/ChatInterface'
import OptimizerInterface from '../core/OptimizerInterface'
import HomeView from './HomeView'
import { useState } from 'react'
import AvatarButton from '@/components/ui/AvatarButton'
import SettingsModal from '@/components/settings/SettingsModal'
import AuthModal from '@/components/auth/AuthModal'
import { Settings as SettingsIcon } from 'lucide-react'

export default function AppLayout() {
  const { tabs, activeTab } = useAppStore()
  const activeTabData = tabs.find(tab => tab.id === activeTab)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        {/* Top bar with right-aligned avatar */}
        <div className="h-12 flex items-center justify-end px-4 gap-2 border-b border-border">
          <button
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-accent border border-border transition-all duration-200 btn-smooth"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
          <AvatarButton onClick={() => setAuthOpen(true)} title="Account" />
        </div>
        {!activeTabData ? (
          <HomeView />
        ) : activeTabData.type === 'chat' ? (
          <ChatInterface tabId={activeTabData.id} />
        ) : (
          <OptimizerInterface tabId={activeTabData.id} />
        )}
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </main>
    </div>
  )
}
