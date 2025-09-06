'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'smooth' | 'ripple' | 'press' | 'pulse'
  className?: string
  disabled?: boolean
}

export default function AnimatedButton({
  children,
  onClick,
  variant = 'smooth',
  className,
  disabled = false
}: AnimatedButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = () => {
    if (disabled) return

    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)

    if (onClick) {
      onClick()
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'smooth':
        return 'btn-smooth'
      case 'ripple':
        return 'btn-ripple'
      case 'press':
        return isAnimating ? 'animate-button-press' : ''
      case 'pulse':
        return 'animate-pulse'
      default:
        return 'btn-smooth'
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        getVariantClasses(),
        className
      )}
    >
      {children}
    </button>
  )
}

// 預設導出各種動畫按鈕
export const SmoothButton = (props: Omit<AnimatedButtonProps, 'variant'>) => (
  <AnimatedButton {...props} variant="smooth" />
)

export const RippleButton = (props: Omit<AnimatedButtonProps, 'variant'>) => (
  <AnimatedButton {...props} variant="ripple" />
)

export const PressButton = (props: Omit<AnimatedButtonProps, 'variant'>) => (
  <AnimatedButton {...props} variant="press" />
)

export const PulseButton = (props: Omit<AnimatedButtonProps, 'variant'>) => (
  <AnimatedButton {...props} variant="pulse" />
)
