export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string }

export type ProviderName = 'gemini' | 'deepseek'

export const ModelOptions: Record<ProviderName, string[]> = {
  gemini: [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-live-2.5-flash-preview',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-live-001',
  ],
  deepseek: [
    'deepseek-chat',
    'deepseek-reasoner',
  ],
}

type GenConfig = { temperature?: number; maxTokens?: number }

export async function callProvider(
  provider: ProviderName,
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  config: GenConfig = {}
): Promise<string> {
  if (provider === 'gemini') return callGemini(model, messages, apiKey, config)
  if (provider === 'deepseek') return callDeepSeek(model, messages, apiKey, config)
  throw new Error(`Unsupported provider: ${provider}`)
}

async function callGemini(model: string, messages: ChatMessage[], apiKey: string, cfg: GenConfig) {
  if (!apiKey) throw new Error('Gemini API key missing')

  // Map to Gemini contents
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body: any = { contents }
  if (cfg.temperature || cfg.maxTokens) {
    body.generationConfig = {
      ...(typeof cfg.temperature === 'number' ? { temperature: cfg.temperature } : {}),
      ...(typeof cfg.maxTokens === 'number' ? { maxOutputTokens: cfg.maxTokens } : {}),
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let msg = `Gemini HTTP ${res.status}`
    try { const j = await res.json(); msg = j.error?.message || msg } catch {}
    throw new Error(msg)
  }
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned empty response')
  return text
}

async function callDeepSeek(model: string, messages: ChatMessage[], apiKey: string, cfg: GenConfig) {
  if (!apiKey) throw new Error('DeepSeek API key missing')

  const dsMessages = messages.map(m => ({ role: m.role, content: m.content }))
  const body: any = {
    model,
    messages: dsMessages,
    ...(typeof cfg.temperature === 'number' ? { temperature: cfg.temperature } : {}),
    ...(typeof cfg.maxTokens === 'number' ? { max_tokens: cfg.maxTokens } : {}),
    stream: false,
  }
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let msg = `DeepSeek HTTP ${res.status}`
    try { const j = await res.json(); msg = j.error?.message || msg } catch {}
    throw new Error(msg)
  }
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning_content
  if (!text) throw new Error('DeepSeek returned empty response')
  return text
}

