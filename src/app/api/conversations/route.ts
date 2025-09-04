export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import { getTokenPayloadFromCookies } from '@/lib/auth'

export async function GET() {
  try {
    const payload = await getTokenPayloadFromCookies()
    if (!payload) return Response.json({ message: 'Unauthorized' }, { status: 401 })

    const conversations = await prisma.conversation.findMany({
      where: { userId: payload.userId },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    })

    return Response.json({ conversations })
  } catch (error) {
    console.error('List conversations error:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = await getTokenPayloadFromCookies()
    if (!payload) return Response.json({ message: 'Unauthorized' }, { status: 401 })

    const body = (await request.json().catch(() => ({}))) as { title?: string }
    const title = body.title?.trim() || 'New Chat'

    const conversation = await prisma.conversation.create({
      data: { userId: payload.userId, title },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    })

    return Response.json({ conversation }, { status: 201 })
  } catch (error) {
    console.error('Create conversation error:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
