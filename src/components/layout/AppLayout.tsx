'use client'

import Sidebar from './Sidebar'
import { useAppStore } from '@/store/appStore'
import ChatInterface from '../core/ChatInterface'
import OptimizerInterface from '../core/OptimizerInterface'
import HomeView from './HomeView'

export default function AppLayout() {
  const { tabs, activeTab } = useAppStore()
  const activeTabData = tabs.find(tab => tab.id === activeTab)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        {!activeTabData ? (
          <HomeView />
        ) : activeTabData.type === 'chat' ? (
          <ChatInterface tabId={activeTabData.id} />
        ) : (
          <OptimizerInterface tabId={activeTabData.id} />
        )}
      </main>
    </div>
  )
}