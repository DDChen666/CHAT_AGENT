'use client'

import { X } from 'lucide-react'
import { SettingsFeedback } from '@/hooks/useSettingsModal'
import { cn } from '@/lib/utils'

interface FeedbackBannerProps {
  feedback: SettingsFeedback
  onDismiss: () => void
}

const variantStyles: Record<SettingsFeedback['type'], string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800',
  error: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
}

export function FeedbackBanner({ feedback, onDismiss }: FeedbackBannerProps) {
  return (
    <div
      role={feedback.type === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 text-sm shadow-sm',
        variantStyles[feedback.type]
      )}
    >
      <div className="flex-1">
        <p className="font-medium">{feedback.title}</p>
        {feedback.description && <p className="mt-1 leading-relaxed">{feedback.description}</p>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
        aria-label="Dismiss message"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}

