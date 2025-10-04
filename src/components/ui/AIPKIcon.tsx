import React from 'react'

interface AIPKIconProps {
  className?: string
  size?: number
}

export default function AIPKIcon({ className = "", size = 24 }: AIPKIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 左侧机器人 */}
      <circle cx="6" cy="8" r="2" fill="currentColor" opacity="0.8"/>
      <rect x="4" y="10" width="4" height="6" rx="1" fill="currentColor" opacity="0.6"/>
      <circle cx="5" cy="12" r="0.5" fill="currentColor"/>
      <circle cx="7" cy="12" r="0.5" fill="currentColor"/>
      <rect x="5.5" y="14" width="1" height="2" fill="currentColor"/>

      {/* 右侧机器人 */}
      <circle cx="18" cy="8" r="2" fill="currentColor" opacity="0.8"/>
      <rect x="16" y="10" width="4" height="6" rx="1" fill="currentColor" opacity="0.6"/>
      <circle cx="17" cy="12" r="0.5" fill="currentColor"/>
      <circle cx="19" cy="12" r="0.5" fill="currentColor"/>
      <rect x="17.5" y="14" width="1" height="2" fill="currentColor"/>

      {/* PK闪电符号 */}
      <path
        d="M12 4L14 8H16L13.5 11L15 15L12 12.5L9 15L10.5 11L8 8H10L12 4Z"
        fill="currentColor"
        className="animate-pulse"
      />

      {/* 对话气泡连接线 */}
      <path
        d="M8 6L10 8"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      <path
        d="M16 6L14 8"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
    </svg>
  )
}
