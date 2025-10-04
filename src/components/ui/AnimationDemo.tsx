'use client'

import React, { useState } from 'react'
import AnimatedButton, { SmoothButton, RippleButton, PressButton, PulseButton } from './AnimatedButton'

export default function AnimationDemo() {
  const [message, setMessage] = useState('')

  const handleButtonClick = (buttonType: string) => {
    setMessage(`點擊了 ${buttonType} 按鈕！`)
    setTimeout(() => setMessage(''), 2000)
  }

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">動畫效果演示</h1>

        {/* 消息提示 */}
        {message && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg animate-slide-in-left">
            <p className="text-primary font-medium">{message}</p>
          </div>
        )}

        {/* 當前應用的動畫測試 */}
        <div className="mb-8 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
            ✅ 動畫系統已應用到應用程式中
          </h3>
          <p className="text-green-700 dark:text-green-300 text-sm">
            所有按鈕現在都有絲滑的動畫效果！請返回主應用程式測試各個按鈕的動畫。
          </p>
        </div>

        {/* 動畫按鈕展示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* 基礎動畫按鈕 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">基礎動畫按鈕</h2>

            <div className="space-y-3">
              <SmoothButton
                onClick={() => handleButtonClick('絲滑按鈕')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
              >
                絲滑按鈕 (Smooth)
              </SmoothButton>

              <RippleButton
                onClick={() => handleButtonClick('漣漪按鈕')}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 w-full"
              >
                漣漪按鈕 (Ripple)
              </RippleButton>

              <PressButton
                onClick={() => handleButtonClick('壓縮按鈕')}
                className="bg-accent text-accent-foreground hover:bg-accent/80 w-full"
              >
                壓縮按鈕 (Press)
              </PressButton>

              <PulseButton
                onClick={() => handleButtonClick('脈衝按鈕')}
                className="bg-muted text-muted-foreground hover:bg-muted/80 w-full"
              >
                脈衝按鈕 (Pulse)
              </PulseButton>
            </div>
          </div>

          {/* 動畫效果說明 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">動畫效果說明</h2>

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="p-3 bg-muted/50 rounded-lg">
                <h3 className="font-medium text-foreground mb-2">絲滑按鈕 (Smooth)</h3>
                <p>懸停時輕微上移，點擊時平滑過渡，帶有陰影效果</p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <h3 className="font-medium text-foreground mb-2">漣漪按鈕 (Ripple)</h3>
                <p>點擊時產生水波紋擴散效果，視覺回饋強烈</p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <h3 className="font-medium text-foreground mb-2">壓縮按鈕 (Press)</h3>
                <p>點擊時快速縮放，模擬物理按壓感</p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <h3 className="font-medium text-foreground mb-2">脈衝按鈕 (Pulse)</h3>
                <p>持續的透明度變化，用於吸引注意</p>
              </div>
            </div>
          </div>
        </div>

        {/* 其他動畫效果 */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-foreground mb-6">其他動畫效果</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-card border border-border rounded-lg animate-fade-in">
              <h3 className="font-medium text-foreground mb-2">淡入動畫</h3>
              <p className="text-sm text-muted-foreground">元素出現時的平滑淡入效果</p>
            </div>

            <div className="p-6 bg-card border border-border rounded-lg animate-slide-in-left">
              <h3 className="font-medium text-foreground mb-2">左側滑入</h3>
              <p className="text-sm text-muted-foreground">從左側滑入的動畫效果</p>
            </div>

            <div className="p-6 bg-card border border-border rounded-lg animate-slide-in-right">
              <h3 className="font-medium text-foreground mb-2">右側滑入</h3>
              <p className="text-sm text-muted-foreground">從右側滑入的動畫效果</p>
            </div>
          </div>
        </div>

        {/* 使用說明 */}
        <div className="mt-12 p-6 bg-muted/30 border border-border rounded-lg">
          <h2 className="text-xl font-semibold text-foreground mb-4">如何使用</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>CSS 類別：</strong> 直接在 HTML 中使用對應的動畫類別</p>
            <p><strong>React 組件：</strong> 使用 AnimatedButton 組件及其變體</p>
            <p><strong>自定義動畫：</strong> 在 globals.css 中添加新的 keyframes 和動畫類別</p>
          </div>
        </div>
      </div>
    </div>
  )
}
