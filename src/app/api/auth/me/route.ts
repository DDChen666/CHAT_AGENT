export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import { getTokenPayloadFromCookies } from '@/lib/auth'

export async function GET() {
  try {
    const payload = await getTokenPayloadFromCookies()
    if (!payload) {
      return Response.json({ user: null }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, isAdmin: true },
    })

    if (!user) {
      return Response.json({ user: null }, { status: 401 })
    }

    return Response.json({ user })
  } catch (error) {
    console.error('Me error:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
