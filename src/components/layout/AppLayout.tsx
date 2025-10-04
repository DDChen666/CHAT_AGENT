'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { Menu, Settings as SettingsIcon } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAppStore } from '@/store/appStore'
import ChatInterface from '../core/ChatInterface'
import OptimizerInterface from '../core/OptimizerInterface'
import AIPKInterface from '../core/AIPKInterface'
import FileToFileInterface from '../core/FileToFileInterface'
import HomeView from './HomeView'
import AvatarButton from '@/components/ui/AvatarButton'
import { useAuthStore } from '@/store/authStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const SettingsModal = dynamic(() => import('@/components/settings/SettingsModal'), {
  ssr: false,
  loading: () => (
    <div className="p-6 text-sm">Loading settings…</div>
  ),
})

const AuthModal = dynamic(() => import('@/components/auth/AuthModal'), {
  ssr: false,
})

export default function AppLayout() {
  const { tabs, activeTab } = useAppStore()
  const activeTabData = tabs.find(tab => tab.id === activeTab)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { user } = useAuthStore()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  useEffect(() => {
    if (isDesktop) {
      setIsSidebarOpen(false)
    }
  }, [isDesktop])

  const mainContent = useMemo(() => {
    if (!activeTabData) return <HomeView />
    switch (activeTabData.type) {
      case 'chat':
        return <ChatInterface tabId={activeTabData.id} />
      case 'optimizer':
        return <OptimizerInterface tabId={activeTabData.id} />
      case 'aipk':
        return <AIPKInterface tabId={activeTabData.id} />
      case 'file2file':
        return <FileToFileInterface tabId={activeTabData.id} />
      default:
        return <HomeView />
    }
  }, [activeTabData])

  return (
    <div className="bg-background lg:flex lg:min-h-screen">
      {isDesktop ? (
        <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
      ) : (
        <>
          {isSidebarOpen ? (
            <div className="fixed inset-0 z-40 flex">
              <button
                type="button"
                className="absolute inset-0 bg-black/40"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close navigation"
              />
              <div className="relative z-10 h-full">
                <Sidebar
                  onOpenSettings={() => setSettingsOpen(true)}
                  variant="mobile"
                  onCloseMobile={() => setIsSidebarOpen(false)}
                />
              </div>
            </div>
          ) : null}
        </>
      )}

      <main className="flex min-h-screen flex-1 flex-col">
        <div className="flex h-12 items-center justify-between gap-2 border-b border-border px-4">
          <div className="flex items-center gap-2">
            {!isDesktop && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-accent"
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border transition-all duration-200 hover:bg-accent"
              title="Settings"
              aria-label="Open settings"
            >
              <SettingsIcon className="h-4 w-4" />
            </button>
            <AvatarButton
              onClick={() => setAuthOpen(true)}
              title={user ? `Logged in as ${user.email}` : 'Account'}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">{mainContent}</div>

        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </main>
    </div>
  )
}
