'use client'

import { CollapsibleSection } from './CollapsibleSection'
import type { Settings } from '@/store/settingsStore'

interface FeatureToggleSectionProps {
  features: Settings['features']
  setFeature: (feature: keyof Settings['features'], enabled: boolean) => void
}

export function FeatureToggleSection({ features, setFeature }: FeatureToggleSectionProps) {
  const toggles: { key: keyof Settings['features']; title: string; description: string }[] = [
    {
      key: 'showTokenUsage',
      title: 'Show Token Usage',
      description: 'Display token counts in chat interface',
    },
    {
      key: 'enableGeminiCache',
      title: 'Enable Gemini Cache',
      description: 'Use caching to reduce API costs (Gemini only)',
    },
  ]

  return (
    <CollapsibleSection
      title="Features"
      icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" /></svg>}
      defaultExpanded
    >
      <div className="space-y-4">
        {toggles.map(({ key, title, description }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <label className="relative inline-flex items-center">
              <input
                type="checkbox"
                checked={features[key]}
                onChange={(event) => setFeature(key, event.target.checked)}
                className="peer sr-only"
              />
              <span className="pointer-events-none h-6 w-11 rounded-full bg-gray-200 transition peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 peer-checked:bg-primary" />
              <span className="pointer-events-none absolute left-[2px] top-[2px] h-5 w-5 rounded-full border border-gray-300 bg-white transition peer-checked:translate-x-full peer-checked:border-white" />
              <span className="sr-only">Toggle {title}</span>
            </label>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  )
}

