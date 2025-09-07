import React from 'react'

interface FileToFileIconProps {
  className?: string
  size?: number
}

export default function FileToFileIcon({ className = "", size = 24 }: FileToFileIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 左側文檔 (來源) */}
      <rect
        x="4"
        y="4"
        width="8"
        height="10"
        rx="1"
        fill="currentColor"
        opacity="0.8"
      />
      {/* 文檔內容線條 */}
      <line x1="6" y1="7" x2="10" y2="7" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
      <line x1="6" y1="9" x2="10" y2="9" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
      <line x1="6" y1="11" x2="8" y2="11" stroke="currentColor" strokeWidth="1" opacity="0.6"/>

      {/* 右側文檔 (目標) */}
      <rect
        x="12"
        y="6"
        width="8"
        height="10"
        rx="1"
        fill="currentColor"
        opacity="0.8"
      />
      {/* DOCX 內容線條 */}
      <line x1="14" y1="9" x2="18" y2="9" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
      <line x1="14" y1="11" x2="18" y2="11" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
      <line x1="14" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1" opacity="0.6"/>

      {/* 轉換箭頭 */}
      <path
        d="M10.5 9L11.5 8V10L10.5 9Z"
        fill="currentColor"
        className="animate-pulse"
      />
      <path
        d="M11 9L12 9"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.7"
      />

      {/* 下載箭頭 */}
      <path
        d="M16 16L18 18L14 18L16 16Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M16 14L16 16"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.7"
      />
    </svg>
  )
}
