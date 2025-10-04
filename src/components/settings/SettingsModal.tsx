'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { APIKeySection } from './APIKeySection'
import { ModelSettingsSection } from './ModelSettingsSection'
import { SystemPromptSection } from './SystemPromptSection'
import { FeatureToggleSection } from './FeatureToggleSection'
import { SettingsFooter } from './SettingsFooter'
import { FeedbackBanner } from './FeedbackBanner'
import { SettingsStatusHeader } from './SettingsStatusHeader'
import { useSettingsModal } from '@/hooks/useSettingsModal'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
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
  } = useSettingsModal(open)

  const handleSave = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-[95vw] max-w-[720px] flex-col !grid-cols-none !gap-0 overflow-hidden">
        <div className="flex-shrink-0 space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">Settings</DialogTitle>
          </DialogHeader>

          {feedback ? <FeedbackBanner feedback={feedback} onDismiss={dismissFeedback} /> : null}

          <SettingsStatusHeader connectionStatus={connectionStatus} />
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-1 py-3">
          <APIKeySection
            apiKeys={apiKeys}
            connectionStatus={connectionStatus}
            onChangeKey={setApiKey}
            onTestConnection={testProviderConnection}
            isTesting={isTestingConnection}
          />

          <ModelSettingsSection
            modelSettings={modelSettings}
            setModelSettings={setModelSettings}
            availableModels={availableModels}
            dynamicModels={dynamicModels}
            userModelPreferences={userModelPreferences}
            addPreferredModel={addPreferredModel}
            removePreferredModel={removePreferredModel}
            refreshModels={refreshModels}
            isRefreshing={isRefreshingModels}
          />

          <SystemPromptSection systemPrompts={systemPrompts} setSystemPrompt={setSystemPrompt} />

          <FeatureToggleSection features={features} setFeature={setFeature} />

          <SettingsFooter
            onClose={() => onOpenChange(false)}
            onSave={handleSave}
            onManualSync={handleManualSync}
            isSyncing={isSyncing}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

