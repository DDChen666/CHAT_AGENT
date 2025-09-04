export const runtime = 'nodejs'

/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/lib/prisma'
import { getTokenPayloadFromCookies } from '@/lib/auth'
import { MessageRole } from '@prisma/client'


const roles = ['USER', 'ASSISTANT', 'SYSTEM'] as const

export async function POST(request: Request, context: any) {
  try {
    const payload = await getTokenPayloadFromCookies()
    if (!payload) return Response.json({ message: 'Unauthorized' }, { status: 401 })

    const { id } = (context?.params || {}) as { id: string }
    const { role, content } = (await request.json()) as { role?: string; content?: string }

    if (!role || !roles.includes(role.toUpperCase() as typeof roles[number]) || !content?.trim()) {
      return Response.json({ message: 'Invalid payload' }, { status: 400 })
    }

    const conv = await prisma.conversation.findFirst({ where: { id, userId: payload.userId }, select: { id: true } })
    if (!conv) return Response.json({ message: 'Not found' }, { status: 404 })

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        role: role.toUpperCase() as MessageRole,
        content: content.trim(),
      },
      select: { id: true, role: true, content: true, createdAt: true },
    })

    await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } })

    return Response.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Create message error:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
