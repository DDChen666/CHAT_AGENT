export const runtime = 'nodejs'

/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/lib/prisma'
import { getTokenPayloadFromCookies } from '@/lib/auth'

export async function GET(_req: Request, context: any) {
  try {
    const payload = getTokenPayloadFromCookies()
    if (!payload) return Response.json({ message: 'Unauthorized' }, { status: 401 })

    const { id } = (context?.params || {}) as { id: string }

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: payload.userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          select: { id: true, role: true, content: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) return Response.json({ message: 'Not found' }, { status: 404 })

    return Response.json({ conversation })
  } catch (error) {
    console.error('Get conversation error:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, context: any) {
  try {
    const payload = getTokenPayloadFromCookies()
    if (!payload) return Response.json({ message: 'Unauthorized' }, { status: 401 })

    const { id } = (context?.params || {}) as { id: string }

    const conv = await prisma.conversation.findFirst({ where: { id, userId: payload.userId }, select: { id: true } })
    if (!conv) return Response.json({ message: 'Not found' }, { status: 404 })

    await prisma.conversation.delete({ where: { id } })
    return Response.json({ ok: true })
  } catch (error) {
    console.error('Delete conversation error:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
