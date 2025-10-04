'use client'

import { useEffect, ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'

interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { initialize } = useAuthStore()

  useEffect(() => {
    // 只在客户端初始化认证状态
    if (typeof window !== 'undefined') {
      initialize()
    }
  }, [initialize])

  return <>{children}</>
}
