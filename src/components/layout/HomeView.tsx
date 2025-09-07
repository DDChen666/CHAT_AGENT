'use client'

import { MessageSquare, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import AIPKIcon from '../ui/AIPKIcon'
import FileToFileIcon from '../ui/FileToFileIcon'

export default function HomeView() {
  const { createChatTab, createOptimizerTab, createAIPKTab, createFile2FileTab } = useAppStore()

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-4">Welcome to Synapse</h1>
        <p className="text-muted-foreground mb-8">
          An elegant AI conversation and prompt engineering tool with iOS-inspired design
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={createChatTab}
            className="flex flex-col items-center p-6 border border-border rounded-lg hover:border-primary transition-all duration-200 btn-smooth group"
          >
            <MessageSquare className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium text-foreground">New Chat</span>
            <span className="text-sm text-muted-foreground mt-1">Start a conversation</span>
          </button>

          <button
            onClick={createOptimizerTab}
            className="flex flex-col items-center p-6 border border-border rounded-lg hover:border-primary transition-all duration-200 btn-smooth group"
          >
            <Sparkles className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium text-foreground">Prompt Optimizer</span>
            <span className="text-sm text-muted-foreground mt-1">Improve your prompts</span>
          </button>

          <button
            onClick={createAIPKTab}
            className="flex flex-col items-center p-6 border border-border rounded-lg hover:border-primary transition-all duration-200 btn-smooth group"
          >
            <AIPKIcon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium text-foreground">AI PK</span>
            <span className="text-sm text-muted-foreground mt-1">Compare AI models</span>
          </button>

          <button
            onClick={createFile2FileTab}
            className="flex flex-col items-center p-6 border border-border rounded-lg hover:border-primary transition-all duration-200 btn-smooth group"
          >
            <FileToFileIcon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium text-foreground">File to File</span>
            <span className="text-sm text-muted-foreground mt-1">Convert Markdown to DOCX</span>
          </button>
        </div>

        <div className="mt-12 text-sm text-muted-foreground">
          <p>Press ⌘K to focus the input field</p>
          <p className="mt-1">Use ⌘⏎ to send messages</p>
          <p className="mt-2 text-primary font-medium">✨ 所有按鈕現在都有絲滑動畫效果！</p>
        </div>
      </div>
    </div>
  )
}