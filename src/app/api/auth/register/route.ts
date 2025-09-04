export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import { signAuthToken, setAuthCookie } from '@/lib/auth'
import bcrypt from 'bcryptjs'

function isValidEmail(email: string) {
  return /.+@.+\..+/.test(email)
}

export async function POST(request: Request) {
  try {
    const { email, password, name } = (await request.json()) as {
      email?: string
      password?: string
      name?: string
    }

    if (!email || !password) {
      return Response.json({ message: 'Missing email or password' }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return Response.json({ message: 'Invalid email' }, { status: 400 })
    }
    if (password.length < 8) {
      return Response.json({ message: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return Response.json({ message: 'Email already registered' }, { status: 409 })
    }

    const userCount = await prisma.user.count()
    const isAdmin = userCount === 0 // first user becomes admin

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, name: name || null, passwordHash, isAdmin },
      select: { id: true, email: true, name: true, isAdmin: true },
    })

    const token = signAuthToken(user.id, user.isAdmin)
    setAuthCookie(token)

    return Response.json({ user })
  } catch (error) {
    console.error('Register error:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

