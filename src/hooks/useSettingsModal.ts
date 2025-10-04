'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSettingsStore } from '@/store/settingsStore'
import { getModelOptions, refreshDynamicModels, type ProviderName } from '@/lib/providers'
import { manualSync } from '@/lib/syncManager'

export type SettingsFeedbackType = 'success' | 'error' | 'warning'

export interface SettingsFeedback {
  type: SettingsFeedbackType
  title: string
  description?: string
}

type DynamicModels = Record<ProviderName, string[]>

const providerLabels: Record<ProviderName, string> = {
  gemini: 'Gemini AI Studio',
  deepseek: 'DeepSeek',
}

export function useSettingsModal(isOpen: boolean) {
  const {
    apiKeys,
    modelSettings,
    systemPrompts,
    features,
    connectionStatus,
    userModelPreferences,
    setApiKey,
    setModelSettings,
    setSystemPrompt,
    setFeature,
    testConnections,
    addPreferredModel,
    removePreferredModel,
    setConnectionStatus,
  } = useSettingsStore()

  const [dynamicModels, setDynamicModels] = useState<DynamicModels>(() => getModelOptions())
  const [isRefreshingModels, setIsRefreshingModels] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState<ProviderName | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [feedback, setFeedback] = useState<SettingsFeedback | null>(null)

  const dismissFeedback = useCallback(() => setFeedback(null), [])

  const filterModelsByPreference = useCallback(
    (provider: ProviderName, availableModels: string[]) => {
      const preferredModels = userModelPreferences[provider] || []
      if (preferredModels.length === 0) return availableModels
      return availableModels.filter((model) => preferredModels.includes(model))
    },
    [userModelPreferences]
  )

  const availableModels = useMemo(() => {
    const modelsForProvider = dynamicModels[modelSettings.defaultProvider] || []
    return filterModelsByPreference(modelSettings.defaultProvider, modelsForProvider)
  }, [dynamicModels, modelSettings.defaultProvider, filterModelsByPreference])

  const ensurePreferenceDefaults = useCallback(
    (provider: ProviderName, models: string[]) => {
      const currentPreferences = userModelPreferences[provider]
      if (currentPreferences.length === 0 && models.length > 0) {
        models.forEach((model) => addPreferredModel(provider, model))
      }
    },
    [addPreferredModel, userModelPreferences]
  )

  const refreshModels = useCallback(async () => {
    setIsRefreshingModels(true)
    try {
      const updated = await refreshDynamicModels({
        gemini: apiKeys.gemini,
        deepseek: apiKeys.deepseek,
      })
      setDynamicModels(updated)
      ensurePreferenceDefaults(modelSettings.defaultProvider, updated[modelSettings.defaultProvider] || [])
      setFeedback({
        type: 'success',
        title: 'Model list updated',
        description: 'Latest provider models were fetched successfully.',
      })
      return updated
    } catch (error) {
      console.warn('Failed to refresh models:', error)
      setFeedback({
        type: 'warning',
        title: 'Unable to refresh provider models',
        description: 'Using cached or fallback models until the network issue is resolved.',
      })
      return dynamicModels
    } finally {
      setIsRefreshingModels(false)
    }
  }, [apiKeys.deepseek, apiKeys.gemini, dynamicModels, ensurePreferenceDefaults, modelSettings.defaultProvider])

  const testProviderConnection = useCallback(
    async (provider: ProviderName) => {
      const apiKey = apiKeys[provider]
      if (!apiKey) return

      setIsTestingConnection(provider)
      try {
        const response = await fetch('/api/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, apiKey }),
        })

        const result = await response.json()

        if (result.success) {
          setConnectionStatus(provider, true)
          setFeedback({
            type: 'success',
            title: `${providerLabels[provider]} connection verified`,
            description: result.message,
          })

          const saveResponse = await fetch('/api/keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, apiKey }),
          })

          if (!saveResponse.ok && saveResponse.status !== 401) {
            setFeedback({
              type: 'warning',
              title: 'Key verification succeeded but saving failed',
              description: 'Please try again after confirming your session is still active.',
            })
          }

          await testConnections()
        } else {
          setConnectionStatus(provider, false)
          setFeedback({
            type: 'error',
            title: `${providerLabels[provider]} connection failed`,
            description: result.message,
          })
        }
      } catch (error) {
        console.error('Connection test failed:', error)
        setConnectionStatus(provider, false)
        setFeedback({
          type: 'error',
          title: `${providerLabels[provider]} connection failed`,
          description: 'Network error occurred while attempting to reach the provider.',
        })
      } finally {
        setIsTestingConnection(null)
      }
    },
    [apiKeys, setConnectionStatus, testConnections]
  )

  const handleManualSync = useCallback(async () => {
    setIsSyncing(true)
    try {
      const result = await manualSync()
      if (result.settingsConflict || result.appStateConflict) {
        setFeedback({
          type: 'warning',
          title: 'Sync completed with conflicts',
          description: 'Please review your latest data to ensure everything looks correct.',
        })
      } else {
        setFeedback({
          type: 'success',
          title: 'Sync completed',
          description: 'Your settings are now in sync with the server.',
        })
      }
    } catch (error) {
      console.error('Manual sync failed:', error)
      setFeedback({
        type: 'error',
        title: 'Sync failed',
        description: 'Check your network connection or sign in again before retrying.',
      })
    } finally {
      setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return

    refreshModels().catch((error) => {
      console.error('Initial model refresh failed:', error)
    })

    testConnections().catch((error) => {
      console.error('Initial connection test failed:', error)
    })
  }, [isOpen, refreshModels, testConnections])

  useEffect(() => {
    if (!availableModels.includes(modelSettings.defaultModel) && availableModels.length > 0) {
      setModelSettings({ defaultModel: availableModels[0] })
    }
  }, [availableModels, modelSettings.defaultModel, setModelSettings])

  useEffect(() => {
    if (!isOpen) return
    const provider = modelSettings.defaultProvider
    const models = dynamicModels[provider] || []
    ensurePreferenceDefaults(provider, models)
  }, [dynamicModels, ensurePreferenceDefaults, isOpen, modelSettings.defaultProvider])

  return {
    apiKeys,
    modelSettings,
    systemPrompts,
    features,
    connectionStatus,
    userModelPreferences,
    setApiKey,
    setModelSettings,
    setSystemPrompt,
    setFeature,
    addPreferredModel,
    removePreferredModel,
    availableModels,
    dynamicModels,
    isRefreshingModels,
    isTestingConnection,
    isSyncing,
    feedback,
    dismissFeedback,
    refreshModels,
    testProviderConnection,
    handleManualSync,
  }
}

