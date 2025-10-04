'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  title: string
  icon: ReactNode
  defaultExpanded?: boolean
  children: ReactNode
}

export function CollapsibleSection({ title, icon, defaultExpanded = false, children }: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 text-primary" aria-hidden>
            {icon}
          </div>
          <h4 className="text-sm font-semibold text-left">{title}</h4>
        </div>
        <div className="flex-shrink-0 transition-transform duration-200">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden />
          )}
        </div>
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="p-4 bg-background">{children}</div>
      </div>
    </div>
  )
}

