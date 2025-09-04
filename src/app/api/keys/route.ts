export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/crypto'
import { getTokenPayloadFromCookies } from '@/lib/auth'
import { Provider as DbProvider } from '@prisma/client'

type Provider = 'gemini' | 'deepseek'

function toEnum(p: Provider): DbProvider {
  return p === 'gemini' ? DbProvider.GEMINI : DbProvider.DEEPSEEK
}

export async function GET() {
  const payload = getTokenPayloadFromCookies()
  if (!payload) return Response.json({ message: 'Unauthorized' }, { status: 401 })

  const keys = await prisma.apiKey.findMany({ where: { userId: payload.userId } })
  const data = keys.map(k => {
    let hint: string | null = null
    try {
      const raw = decrypt(k.encryptedKey)
      hint = raw.slice(-4)
    } catch {}
    return { provider: k.provider.toLowerCase(), hasKey: true, hint }
  })
  return Response.json({ keys: data })
}

export async function POST(request: Request) {
  const payload = getTokenPayloadFromCookies()
  if (!payload) return Response.json({ message: 'Unauthorized' }, { status: 401 })

  const { provider, apiKey } = (await request.json()) as { provider?: Provider; apiKey?: string }
  if (!provider || !apiKey?.trim()) {
    return Response.json({ message: 'Invalid payload' }, { status: 400 })
  }
  const encryptedKey = encrypt(apiKey.trim())
  const saved = await prisma.apiKey.upsert({
    where: { userId_provider: { userId: payload.userId, provider: toEnum(provider) } },
    update: { encryptedKey },
    create: { userId: payload.userId, provider: toEnum(provider), encryptedKey },
    select: { provider: true, updatedAt: true },
  })
  return Response.json({ ok: true, provider: saved.provider.toLowerCase() })
}

export async function DELETE(request: Request) {
  const payload = getTokenPayloadFromCookies()
  if (!payload) return Response.json({ message: 'Unauthorized' }, { status: 401 })
  const { provider } = (await request.json()) as { provider?: Provider }
  if (!provider) return Response.json({ message: 'Invalid payload' }, { status: 400 })
  await prisma.apiKey.delete({ where: { userId_provider: { userId: payload.userId, provider: toEnum(provider) } } }).catch(() => null)
  return Response.json({ ok: true })
}
