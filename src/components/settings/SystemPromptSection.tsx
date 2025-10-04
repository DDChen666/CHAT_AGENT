'use client'

import { CollapsibleSection } from './CollapsibleSection'
import type { Settings } from '@/store/settingsStore'
import { DEFAULT_SYSTEM_PROMPTS } from './defaultPrompts'

interface SystemPromptSectionProps {
  systemPrompts: Settings['systemPrompts']
  setSystemPrompt: (type: keyof Settings['systemPrompts'], prompt: string) => void
}

export function SystemPromptSection({ systemPrompts, setSystemPrompt }: SystemPromptSectionProps) {
  const groups: { key: keyof Settings['systemPrompts']; title: string; accent: string }[] = [
    { key: 'improver', title: 'Improver System Prompt', accent: 'border-blue-500/30' },
    { key: 'critic', title: 'Critic System Prompt', accent: 'border-purple-500/30' },
    { key: 'chat', title: 'Chat System Prompt', accent: 'border-green-500/30' },
  ]

  return (
    <CollapsibleSection
      title="System Prompts"
      icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 4c-2.21 0-4 1.79-4 4v2h8v-2c0-2.21-1.79-4-4-4z" /></svg>}
      defaultExpanded
    >
      <div className="space-y-4">
        {groups.map(({ key, title, accent }) => (
          <div key={key} className={`rounded-lg border-l-2 ${accent} bg-muted/30 p-4`}>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium" htmlFor={`${key}-prompt`}>
                {title}
              </label>
              <button
                type="button"
                onClick={() => setSystemPrompt(key, DEFAULT_SYSTEM_PROMPTS[key])}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Restore Default
              </button>
            </div>
            <textarea
              id={`${key}-prompt`}
              value={systemPrompts[key] || DEFAULT_SYSTEM_PROMPTS[key]}
              onChange={(event) => setSystemPrompt(key, event.target.value)}
              rows={key === 'chat' ? 3 : 6}
              className="w-full rounded-lg border border-border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        ))}
      </div>
    </CollapsibleSection>
  )
}

