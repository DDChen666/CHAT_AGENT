'use client'

import React from 'react'

type Props = {
  onClick?: () => void
  title?: string
  size?: number
}

export default function AvatarButton({ onClick, title = 'Account', size = 32 }: Props) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="inline-flex items-center justify-center rounded-full border border-border hover:bg-accent transition-all duration-200 btn-smooth"
      style={{ width: size, height: size }}
    >
      {/* Minimal person SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={Math.floor(size * 0.6)}
        height={Math.floor(size * 0.6)}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="8" r="3" />
        <path d="M4 20s2.5-4 8-4 8 4 8 4" />
      </svg>
    </button>
  )
}

