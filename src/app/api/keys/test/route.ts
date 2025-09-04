export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import { getTokenPayloadFromCookies } from '@/lib/auth'
import { Provider as DbProvider } from '@prisma/client'

async function testDeepSeek(apiKey: string) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: 'ping' }], max_tokens: 8, stream: false }),
  })
  if (!res.ok) throw new Error('DeepSeek HTTP ' + res.status)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Empty')
}

const GEMINI_TEST_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
]

async function tryGemini(key: string, model: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }], generationConfig: { maxOutputTokens: 8 } }),
  })
  if (!res.ok) throw new Error(String(res.status))
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty')
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const provider = (url.searchParams.get('provider') || '').toLowerCase()
  const payload = getTokenPayloadFromCookies()
  if (!payload) return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  if (!['gemini', 'deepseek'].includes(provider)) return Response.json({ success: false, message: 'Invalid provider' }, { status: 400 })

  const rec = await prisma.apiKey.findUnique({
    where: { userId_provider: { userId: payload.userId, provider: (provider === 'gemini' ? DbProvider.GEMINI : DbProvider.DEEPSEEK) } },
    select: { encryptedKey: true },
  })
  if (!rec) return Response.json({ success: false, message: 'No saved key' }, { status: 404 })

  const { decrypt } = await import('@/lib/crypto')
  let key = ''
  try { key = decrypt(rec.encryptedKey) } catch { return Response.json({ success: false, message: 'Decrypt failed' }, { status: 500 }) }

  try {
    if (provider === 'gemini') {
      let ok = false; let last = ''
      for (const m of GEMINI_TEST_CANDIDATES) {
        try { await tryGemini(key, m); ok = true; break } catch (e: unknown) { last = e instanceof Error ? e.message : String(e) }
      }
      if (!ok) throw new Error(last || 'Test failed')
    } else {
      await testDeepSeek(key)
    }
    return Response.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Test failed'
    return Response.json({ success: false, message: msg })
  }
}
