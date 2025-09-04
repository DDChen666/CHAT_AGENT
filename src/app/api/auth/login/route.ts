export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import { signAuthToken, setAuthCookie } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string
      password?: string
    }

    if (!email || !password) {
      return Response.json({ message: 'Missing email or password' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return Response.json({ message: 'Invalid credentials' }, { status: 401 })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return Response.json({ message: 'Invalid credentials' }, { status: 401 })
    }

    const token = signAuthToken(user.id, user.isAdmin)
    await setAuthCookie(token)

    return Response.json({ user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin } })
  } catch (error) {
    console.error('Login error:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
