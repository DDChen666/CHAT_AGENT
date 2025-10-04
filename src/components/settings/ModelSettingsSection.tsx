'use client'

import { Info, RefreshCw, X } from 'lucide-react'
import { CollapsibleSection } from './CollapsibleSection'
import type { Settings } from '@/store/settingsStore'
import type { ProviderName } from '@/lib/providers'
import { cn } from '@/lib/utils'

interface ModelSettingsSectionProps {
  modelSettings: Settings['modelSettings']
  setModelSettings: (settings: Partial<Settings['modelSettings']>) => void
  availableModels: string[]
  dynamicModels: Record<ProviderName, string[]>
  userModelPreferences: Settings['userModelPreferences']
  addPreferredModel: (provider: ProviderName, model: string) => void
  removePreferredModel: (provider: ProviderName, model: string) => void
  refreshModels: () => Promise<Record<ProviderName, string[]>>
  isRefreshing: boolean
}

export function ModelSettingsSection({
  modelSettings,
  setModelSettings,
  availableModels,
  dynamicModels,
  userModelPreferences,
  addPreferredModel,
  removePreferredModel,
  refreshModels,
  isRefreshing,
}: ModelSettingsSectionProps) {
  const provider = modelSettings.defaultProvider
  const providerModels = dynamicModels[provider] || []

  const togglePreferred = (model: string) => {
    const isPreferred = userModelPreferences[provider]?.includes(model)
    if (isPreferred) {
      removePreferredModel(provider, model)
    } else {
      addPreferredModel(provider, model)
    }
  }

  return (
    <CollapsibleSection
      title="Model Settings"
      icon={
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      }
      defaultExpanded
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="default-provider">
            Default Provider
          </label>
          <select
            id="default-provider"
            value={modelSettings.defaultProvider}
            onChange={(event) =>
              setModelSettings({ defaultProvider: event.target.value as ProviderName })
            }
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="gemini">Gemini</option>
            <option value="deepseek">DeepSeek</option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium" htmlFor="default-model">
                Default Model
              </label>
              <Info className="h-4 w-4 text-muted-foreground" aria-hidden title="Select your preferred models below. Removed models won't appear in dropdown menus." />
            </div>
            <button
              type="button"
              onClick={() => {
                refreshModels().catch((error) => {
                  console.warn('Manual model refresh failed:', error)
                })
              }}
              disabled={isRefreshing}
              className={cn(
                'rounded-md p-1 transition-colors',
                isRefreshing ? 'cursor-not-allowed opacity-50' : 'hover:bg-accent text-muted-foreground hover:text-foreground'
              )}
              title="Refresh available models"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} aria-hidden />
              <span className="sr-only">Refresh provider models</span>
            </button>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-muted-foreground" htmlFor="default-model">
              Current Default Model
            </label>
            <select
              id="default-model"
              value={modelSettings.defaultModel}
              onChange={(event) => setModelSettings({ defaultModel: event.target.value })}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {availableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs text-muted-foreground">
              Manage Available Models (click × to toggle availability)
            </label>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
              {providerModels.map((model) => {
                const isPreferred = userModelPreferences[provider]?.includes(model)
                return (
                  <div
                    key={model}
                    className="flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-accent/50"
                  >
                    <span
                      className={cn('flex-1 truncate', isPreferred ? 'text-foreground' : 'text-muted-foreground')}
                    >
                      {model}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePreferred(model)}
                      className={cn(
                        'ml-2 rounded p-1 transition-colors',
                        isPreferred
                          ? 'text-muted-foreground hover:bg-destructive hover:text-destructive-foreground'
                          : 'text-muted-foreground hover:bg-primary hover:text-primary-foreground'
                      )}
                      title={isPreferred ? 'Remove from available models' : 'Add to available models'}
                    >
                      <X className="h-3 w-3" aria-hidden />
                    </button>
                  </div>
                )
              })}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Only preferred models will appear in dropdown menus throughout the app.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="temperature">
            Temperature: {modelSettings.temperature.toFixed(2)}
          </label>
          <input
            id="temperature"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={modelSettings.temperature}
            onChange={(event) => setModelSettings({ temperature: Number(event.target.value) })}
            className="w-full"
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

