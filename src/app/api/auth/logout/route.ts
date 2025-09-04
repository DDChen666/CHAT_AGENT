export const runtime = 'nodejs'

import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
  try {
    clearAuthCookie()
    return Response.json({ ok: true })
  } catch (error) {
    console.error('Logout error:', error)
    return Response.json({ ok: false }, { status: 500 })
  }
}

