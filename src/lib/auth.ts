import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export const AUTH_COOKIE_NAME = 'auth_token'

export interface TokenPayload {
  userId: string
  isAdmin: boolean
}

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET not configured')
  }
  return secret
}

export function signAuthToken(userId: string, isAdmin: boolean) {
  return jwt.sign({ userId, isAdmin } as TokenPayload, getSecret(), {
    expiresIn: '7d',
  })
}

export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getSecret()) as TokenPayload
  } catch {
    return null
  }
}

export function getTokenPayloadFromCookies(): TokenPayload | null {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value
  if (!token) return null
  return verifyAuthToken(token)
}

export function setAuthCookie(token: string) {
  cookies().set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export function clearAuthCookie() {
  cookies().set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

