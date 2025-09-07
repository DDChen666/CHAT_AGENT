'use client'

import { useCallback } from 'react'
import { Download, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { marked } from 'marked'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { saveAs } from 'file-saver'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'

interface FileToFileInterfaceProps {
  tabId: string
}

export default function FileToFileInterface({ tabId }: FileToFileInterfaceProps) {
  const {
    file2fileStates,
    setFile2FileInputText,
    setFile2FileConverting,
    setFile2FileDownloading,
    setFile2FileError,
    setFile2FileSuccess,
  } = useAppStore()

  const state = file2fileStates[tabId] || {
    inputText: '',
    isConverting: false,
    isDownloading: false,
    error: null,
    success: false,
  }

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFile2FileInputText(tabId, e.target.value)
    setFile2FileError(tabId, null)
    setFile2FileSuccess(tabId, false)
  }, [tabId, setFile2FileInputText, setFile2FileError, setFile2FileSuccess])

  const convertMarkdownToHtml = useCallback(async (markdown: string): Promise<string> => {
    // 配置 marked 選項
    marked.setOptions({
      breaks: true,
      gfm: true,
    })

    return await marked(markdown)
  }, [])

  const convertToDocx = useCallback(async (htmlContent: string) => {
    try {
      // 簡單的Markdown到DOCX轉換
      const sections = []

      // 將HTML按行分割並轉換為DOCX段落
      const lines = htmlContent.split('\n').filter(line => line.trim())

      for (const line of lines) {
        const cleanLine = line.replace(/<[^>]*>/g, '').trim()

        if (!cleanLine) continue

        // 根據行內容判斷樣式
        let paragraph

        if (cleanLine.startsWith('# ')) {
          // 一級標題
          paragraph = new Paragraph({
            children: [new TextRun({ text: cleanLine.substring(2), bold: true, size: 32 })],
            spacing: { after: 300 },
          })
        } else if (cleanLine.startsWith('## ')) {
          // 二級標題
          paragraph = new Paragraph({
            children: [new TextRun({ text: cleanLine.substring(3), bold: true, size: 28 })],
            spacing: { after: 250 },
          })
        } else if (cleanLine.startsWith('### ')) {
          // 三級標題
          paragraph = new Paragraph({
            children: [new TextRun({ text: cleanLine.substring(4), bold: true, size: 24 })],
            spacing: { after: 200 },
          })
        } else if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
          // 清單項目
          paragraph = new Paragraph({
            children: [new TextRun({ text: `• ${cleanLine.substring(2)}` })],
            indent: { left: 720 },
            spacing: { after: 120 },
          })
        } else {
          // 普通段落
          paragraph = new Paragraph({
            children: [new TextRun({ text: cleanLine })],
            spacing: { after: 120 },
          })
        }

        sections.push(paragraph)
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: sections,
        }],
      })

      const buffer = await Packer.toBuffer(doc)
      const uint8Array = new Uint8Array(buffer)
      return new Blob([uint8Array], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
    } catch (error) {
      console.error('DOCX conversion error:', error)
      throw new Error('轉換為 DOCX 時發生錯誤')
    }
  }, [])

  const handleConvert = useCallback(async () => {
    if (!state.inputText.trim()) {
      setFile2FileError(tabId, '請輸入要轉換的文字內容')
      return
    }

    setFile2FileConverting(tabId, true)
    setFile2FileError(tabId, null)
    setFile2FileSuccess(tabId, false)

    try {
      // 轉換 Markdown 為 HTML
      const htmlContent = await convertMarkdownToHtml(state.inputText)

      // 轉換 HTML 為 DOCX
      const docxBlob = await convertToDocx(htmlContent)

      setFile2FileConverting(tabId, false)
      setFile2FileSuccess(tabId, true)

      // 自動觸發下載
      saveAs(docxBlob, `converted_document_${new Date().getTime()}.docx`)

      setFile2FileDownloading(tabId, true)

      // 3秒後重置下載狀態
      setTimeout(() => {
        setFile2FileDownloading(tabId, false)
      }, 3000)

    } catch (error) {
      console.error('Conversion error:', error)
      setFile2FileConverting(tabId, false)
      setFile2FileError(tabId, error instanceof Error ? error.message : '轉換過程中發生未知錯誤')
    }
  }, [tabId, state.inputText, convertMarkdownToHtml, convertToDocx, setFile2FileConverting, setFile2FileError, setFile2FileSuccess, setFile2FileDownloading])

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-border">
        <FileText className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-semibold">File to File Converter</h1>
        <span className="text-sm text-muted-foreground">Markdown → DOCX</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Input Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              輸入文字內容 (支援 Markdown 格式)
            </label>
            <textarea
              value={state.inputText}
              onChange={handleInputChange}
              placeholder="# 標題

這是一個範例文件。

## 子標題

- 項目 1
- 項目 2
- 項目 3

**粗體文字** 和 *斜體文字*

\`\`\`javascript
console.log('Hello World!')
\`\`\`"
              className={cn(
                "w-full h-64 p-4 border border-border rounded-lg",
                "bg-background text-foreground",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "resize-none font-mono text-sm",
                "transition-all duration-200"
              )}
            />
            <p className="text-xs text-muted-foreground">
              支援完整的 Markdown 語法，包括標題、清單、代碼塊、表格等
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleConvert}
              disabled={state.isConverting || !state.inputText.trim()}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-lg font-medium",
                "transition-all duration-200 btn-smooth",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                state.isConverting
                  ? "bg-primary/80 text-primary-foreground"
                  : state.inputText.trim()
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {state.isConverting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  轉換中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  轉換並下載 DOCX
                </>
              )}
            </button>

            {state.success && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">轉換成功！</span>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {state.error && (
            <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">轉換失敗</p>
                <p className="text-sm text-destructive/80 mt-1">{state.error}</p>
              </div>
            </div>
          )}

          {state.isDownloading && (
            <div className="flex items-center gap-2 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <Download className="w-4 h-4 text-primary animate-bounce" />
              <span className="text-sm text-primary">正在下載文件...</span>
            </div>
          )}

          {/* Preview Section */}
          {state.inputText && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                預覽 (HTML 渲染結果)
              </label>
              <div className="border border-border rounded-lg p-4 bg-muted/30">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: convertMarkdownToHtml(state.inputText)
                  }}
                />
              </div>
            </div>
          )}

          {/* Usage Tips */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">使用提示</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <h4 className="font-medium text-foreground mb-2">支援的格式</h4>
                <ul className="space-y-1">
                  <li>• 標題 (# ## ###)</li>
                  <li>• 清單 (- * 數字)</li>
                  <li>• 粗體/斜體 (**text*)</li>
                  <li>• 代碼塊 (```)</li>
                  <li>• 鏈接 [text](url)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">輸出特性</h4>
                <ul className="space-y-1">
                  <li>• 保留格式樣式</li>
                  <li>• 支援中文字體</li>
                  <li>• 自動編號和間距</li>
                  <li>• 表格支援</li>
                  <li>• 響應式設計</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
