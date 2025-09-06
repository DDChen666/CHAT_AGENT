'use client'

import { Copy } from 'lucide-react'
import { ChatMessage } from '@/store/appStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MessageBubbleProps {
  message: ChatMessage
  showTokenUsage?: boolean
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast.success('Message copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy text: ', err)
      toast.error('Failed to copy message')
    }
  }

  return (
    <div className={cn(
      'flex gap-3 group',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'max-w-3/4 rounded-2xl px-4 py-3 relative',
        isUser
          ? 'bg-primary text-primary-foreground ml-16'
          : 'bg-muted text-foreground mr-16'
      )}>
        <div className="whitespace-pre-wrap">{message.content}</div>
        
        <button
          onClick={handleCopy}
          className={cn(
            'absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded',
            isUser
              ? 'right-2 hover:bg-primary-foreground/20'
              : 'left-2 hover:bg-muted-foreground/20'
          )}
          title="Copy message"
        >
          <Copy className="w-3 h-3" />
        </button>
        
        <div className={cn(
          'text-xs opacity-70 mt-2',
          isUser ? 'text-primary-foreground/80' : 'text-muted-foreground'
        )}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}