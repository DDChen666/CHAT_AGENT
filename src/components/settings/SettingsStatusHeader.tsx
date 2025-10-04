'use client'

import type { Settings } from '@/store/settingsStore'

interface SettingsStatusHeaderProps {
  connectionStatus: Settings['connectionStatus']
}

const providerLabels: Record<'gemini' | 'deepseek', string> = {
  gemini: 'Gemini AI Studio',
  deepseek: 'DeepSeek',
}

export function SettingsStatusHeader({ connectionStatus }: SettingsStatusHeaderProps) {
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-border pb-3 text-sm sm:grid-cols-2">
      {(['gemini', 'deepseek'] as const).map((provider) => (
        <div key={provider} className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${connectionStatus[provider] ? 'bg-green-500' : 'bg-red-500'}`}
            aria-hidden
          />
          <span className="font-medium">{providerLabels[provider]}</span>
          <span className="text-xs text-muted-foreground">
            {connectionStatus[provider] ? 'Connected' : 'Not connected'}
            {connectionStatus.lastTested ? (
              <span className="ml-1">
                ({new Date(connectionStatus.lastTested).toLocaleTimeString()})
              </span>
            ) : null}
          </span>
        </div>
      ))}
    </div>
  )
}

