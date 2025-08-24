'use client'

import { cn } from '@/lib/utils'

interface ThinkingAnimationProps {
  className?: string
}

export default function ThinkingAnimation({ className }: ThinkingAnimationProps) {
  return (
    <div className={cn("flex items-center space-x-1 text-muted-foreground", className)}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm">思考中...</span>
    </div>
  )
}