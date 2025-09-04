import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, apiKey } = body

    if (!apiKey) {
      return Response.json(
        { success: false, message: 'API key is required' },
        { status: 400 }
      )
    }

    switch (provider) {
      case 'gemini':
        return await testGeminiConnection(apiKey)
      case 'deepseek':
        return await testDeepSeekConnection(apiKey)
      default:
        return Response.json(
          { success: false, message: `Unsupported provider: ${provider}` },
          { status: 400 }
        )
    }
  } catch (error: unknown) {
    console.error('API test error:', error)
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

const GEMINI_TEST_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
]

async function tryGemini(apiKey: string, model: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hello'
          }]
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 16 }
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (text) {
      return { ok: true, response: text.slice(0, 50) + '...' }
    } else {
      throw new Error('Gemini API returned empty response')
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { ok: false, message: msg }
  }
}

async function testGeminiConnection(apiKey: string, model?: string) {
  const candidates = model ? [model] : GEMINI_TEST_CANDIDATES
  let lastErr = ''
  for (const m of candidates) {
    const r = await tryGemini(apiKey, m)
    if (r.ok) {
      return Response.json({ success: true, message: `Gemini API connection successful (${m})`, response: r.response, model: m })
    }
    lastErr = r.message
  }
  return Response.json({ success: false, message: `Gemini API connection failed: ${lastErr}` })
}

async function testDeepSeekConnection(apiKey: string) {
  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello' }
        ],
        temperature: 0.2,
        stream: false,
        max_tokens: 16,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || `HTTP ${res.status}`)
    }
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content
    return Response.json({ success: true, message: 'DeepSeek API connection successful', response: (text || '').slice(0, 50) + '...' })
  } catch (error: unknown) {
    console.error('DeepSeek test error:', error)
    return Response.json({
      success: false,
      message: `DeepSeek API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
}
