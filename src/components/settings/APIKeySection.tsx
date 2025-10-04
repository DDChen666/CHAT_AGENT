'use client'

import { TestTube } from 'lucide-react'
import { CollapsibleSection } from './CollapsibleSection'
import type { Settings } from '@/store/settingsStore'
import type { ProviderName } from '@/lib/providers'
import { cn } from '@/lib/utils'

interface APIKeySectionProps {
  apiKeys: Settings['apiKeys']
  connectionStatus: Settings['connectionStatus']
  onChangeKey: (provider: keyof Settings['apiKeys'], value: string) => void
  onTestConnection: (provider: ProviderName) => Promise<void>
  isTesting: ProviderName | null
}

const providerConfig: Record<ProviderName, { label: string; placeholder: string; helper?: string }> = {
  gemini: {
    label: 'Gemini AI Studio API Key',
    placeholder: 'Enter your Gemini AI Studio API key',
  },
  deepseek: {
    label: 'DeepSeek API Key',
    placeholder: 'Enter your DeepSeek API key',
  },
}

export function APIKeySection({ apiKeys, connectionStatus, onChangeKey, onTestConnection, isTesting }: APIKeySectionProps) {
  return (
    <CollapsibleSection
      title="API Keys"
      icon={
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H7l5-4-5-4h4l2.257-2.257A6 6 0 0119 9z" />
        </svg>
      }
      defaultExpanded
    >
      <div className="space-y-4">
        {(Object.keys(providerConfig) as ProviderName[]).map((provider) => {
          const meta = providerConfig[provider]
          const value = apiKeys[provider]
          const isCurrentlyTesting = isTesting === provider
          const statusClass = connectionStatus[provider] ? 'bg-green-500' : 'bg-red-500'

          return (
            <div key={provider} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium" htmlFor={`${provider}-api-key`}>
                  {meta.label}
                </label>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={cn('inline-block h-2.5 w-2.5 rounded-full', statusClass)} aria-hidden />
                  {connectionStatus[provider] ? 'Connected' : 'Not connected'}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  id={`${provider}-api-key`}
                  type="password"
                  value={value}
                  onChange={(event) => onChangeKey(provider, event.target.value)}
                  placeholder={meta.placeholder}
                  className="flex-1 rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => onTestConnection(provider)}
                  disabled={!value || isCurrentlyTesting}
                  className={cn(
                    'inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 transition-colors',
                    value && !isCurrentlyTesting ? 'hover:bg-accent' : 'cursor-not-allowed opacity-50'
                  )}
                  aria-live="polite"
                >
                  <TestTube className={cn('h-4 w-4', isCurrentlyTesting && 'animate-spin')} aria-hidden />
                  <span className="sr-only">Test {provider} connection</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </CollapsibleSection>
  )
}

