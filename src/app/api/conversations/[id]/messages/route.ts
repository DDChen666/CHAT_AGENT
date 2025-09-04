export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import { getTokenPayloadFromCookies } from '@/lib/auth'

type Params = { params: { id: string } }

const roles = ['USER', 'ASSISTANT', 'SYSTEM'] as const
type Role = typeof roles[number]

export async function POST(request: Request, { params }: Params) {
  try {
    const payload = getTokenPayloadFromCookies()
    if (!payload) return Response.json({ message: 'Unauthorized' }, { status: 401 })

    const { id } = params
    const { role, content } = (await request.json()) as { role?: string; content?: string }

    if (!role || !roles.includes(role.toUpperCase() as Role) || !content?.trim()) {
      return Response.json({ message: 'Invalid payload' }, { status: 400 })
    }

    const conv = await prisma.conversation.findFirst({ where: { id, userId: payload.userId }, select: { id: true } })
    if (!conv) return Response.json({ message: 'Not found' }, { status: 404 })

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        role: role.toUpperCase() as Role,
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

