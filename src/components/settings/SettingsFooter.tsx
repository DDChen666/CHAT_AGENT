'use client'

import { Cloud, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsFooterProps {
  onClose: () => void
  onSave: () => void
  onManualSync: () => void
  isSyncing: boolean
}

export function SettingsFooter({ onClose, onSave, onManualSync, isSyncing }: SettingsFooterProps) {
  return (
    <div className="flex items-center justify-between border-t border-border pt-4">
      <button
        type="button"
        onClick={onManualSync}
        disabled={isSyncing}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-border px-4 py-2 transition-colors',
          isSyncing ? 'cursor-not-allowed opacity-50' : 'hover:bg-accent'
        )}
      >
        <Cloud className={cn('h-4 w-4', isSyncing && 'animate-spin')} aria-hidden />
        {isSyncing ? 'Syncing…' : 'Sync Data'}
      </button>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 transition-colors hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Save className="h-4 w-4" aria-hidden />
          Save Settings
        </button>
      </div>
    </div>
  )
}

