export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string }

export type ProviderName = 'gemini' | 'deepseek'

// Static fallback models (used when API calls fail)
export const FallbackModelOptions: Record<ProviderName, string[]> = {
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

// Dynamic model cache
interface ModelCache {
  models: Record<ProviderName, string[]>
  timestamp: number
  ttl: number // Time to live in milliseconds
}

let modelCache: ModelCache | null = null
const CACHE_TTL = 1000 * 60 * 30 // 30 minutes

// Get current model options (dynamic with fallback to static)
export function getModelOptions(): Record<ProviderName, string[]> {
  if (modelCache && Date.now() - modelCache.timestamp < modelCache.ttl) {
    return modelCache.models
  }
  return FallbackModelOptions
}

// Export for backward compatibility
export const ModelOptions = FallbackModelOptions

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

  // Map to Gemini contents with literal role types
  const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = messages.map((m): { role: 'user' | 'model'; parts: { text: string }[] } => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body: {
    contents: { role: 'user' | 'model'; parts: { text: string }[] }[]
    generationConfig?: { temperature?: number; maxOutputTokens?: number }
    safetySettings?: { category: string; threshold: string }[]
  } = { contents }
  if (typeof cfg.temperature === 'number' || typeof cfg.maxTokens === 'number') {
    body.generationConfig = {}
    if (typeof cfg.temperature === 'number') body.generationConfig.temperature = cfg.temperature
    if (typeof cfg.maxTokens === 'number') body.generationConfig.maxOutputTokens = cfg.maxTokens
  }

  body.safetySettings = [
    'HARM_CATEGORY_HARASSMENT',
    'HARM_CATEGORY_HATE_SPEECH',
    'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    'HARM_CATEGORY_DANGEROUS_CONTENT',
    'HARM_CATEGORY_CIVIC_INTEGRITY',
  ].map(category => ({ category, threshold: 'BLOCK_NONE' }))

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
  const textCandidate = Array.isArray(data.candidates)
    ? data.candidates
        .map((candidate: { content?: { parts?: { text?: string }[] }; finishReason?: string }) => {
          const parts = candidate.content?.parts || []
          return parts
            .map(part => (typeof part?.text === 'string' ? part.text : ''))
            .join('')
            .trim()
        })
        .find(Boolean)
    : undefined

  if (textCandidate) return textCandidate

  const blockReason = data.promptFeedback?.blockReason
  const finishReason = data.candidates?.[0]?.finishReason
  const safetyRatings =
    data.promptFeedback?.safetyRatings || data.candidates?.[0]?.safetyRatings

  const details: string[] = []
  if (blockReason) details.push(`blockReason: ${blockReason}`)
  if (finishReason) details.push(`finishReason: ${finishReason}`)
  if (Array.isArray(safetyRatings) && safetyRatings.length) {
    details.push(`safetyRatings: ${JSON.stringify(safetyRatings)}`)
  }

  const suffix = details.length ? ` (${details.join(', ')})` : ''
  throw new Error(`Gemini returned empty response${suffix}`)
}

async function callDeepSeek(model: string, messages: ChatMessage[], apiKey: string, cfg: GenConfig) {
  if (!apiKey) throw new Error('DeepSeek API key missing')

  const dsMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = messages.map(m => ({ role: m.role, content: m.content }))
  const body: { model: string; messages: typeof dsMessages; temperature?: number; max_tokens?: number; stream: false } = {
    model,
    messages: dsMessages,
    stream: false,
  }
  if (typeof cfg.temperature === 'number') body.temperature = cfg.temperature
  if (typeof cfg.maxTokens === 'number') body.max_tokens = cfg.maxTokens
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

// Dynamic model fetching functions
async function fetchGeminiModels(apiKey?: string): Promise<string[]> {
  if (!apiKey) {
    console.warn('No Gemini API key provided for dynamic model fetching, using fallback')
    return FallbackModelOptions.gemini
  }

  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
    })

    if (!res.ok) {
      console.warn(`Gemini models API failed with status ${res.status}, using fallback`)
      return FallbackModelOptions.gemini
    }

    const data = await res.json()
    const models = data.models || []

    // Filter for text generation models and extract model names
    const textModels = models
      .filter((model: { supportedGenerationMethods?: string[] }) => model.supportedGenerationMethods?.includes('generateContent'))
      .map((model: { name?: string }) => model.name?.replace('models/', '') || '')
      .filter((name: string) => name && name.startsWith('gemini-'))
      .sort()

    if (textModels.length === 0) {
      console.warn('No valid Gemini models found in API response, using fallback')
      return FallbackModelOptions.gemini
    }

    return textModels
  } catch (error) {
    console.warn('Failed to fetch Gemini models:', error)
    return FallbackModelOptions.gemini
  }
}

async function fetchDeepSeekModels(apiKey?: string): Promise<string[]> {
  if (!apiKey) {
    console.warn('No DeepSeek API key provided for dynamic model fetching, using fallback')
    return FallbackModelOptions.deepseek
  }

  try {
    const res = await fetch('https://api.deepseek.com/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!res.ok) {
      console.warn(`DeepSeek models API failed with status ${res.status}, using fallback`)
      return FallbackModelOptions.deepseek
    }

    const data = await res.json()
    const models = data.data || []

    // Extract model IDs from the response
    const modelIds = models
      .map((model: { id?: string }) => model.id || '')
      .filter((id: string) => id && id.startsWith('deepseek-'))
      .sort()

    if (modelIds.length === 0) {
      console.warn('No valid DeepSeek models found in API response, using fallback')
      return FallbackModelOptions.deepseek
    }

    return modelIds
  } catch (error) {
    console.warn('Failed to fetch DeepSeek models:', error)
    return FallbackModelOptions.deepseek
  }
}

// Main function to refresh dynamic models
export async function refreshDynamicModels(apiKeys?: { gemini?: string; deepseek?: string }): Promise<Record<ProviderName, string[]>> {
  try {
    const [geminiModels, deepseekModels] = await Promise.allSettled([
      fetchGeminiModels(apiKeys?.gemini),
      fetchDeepSeekModels(apiKeys?.deepseek),
    ])

    const models: Record<ProviderName, string[]> = {
      gemini: geminiModels.status === 'fulfilled' ? geminiModels.value : FallbackModelOptions.gemini,
      deepseek: deepseekModels.status === 'fulfilled' ? deepseekModels.value : FallbackModelOptions.deepseek,
    }

    // Update cache
    modelCache = {
      models,
      timestamp: Date.now(),
      ttl: CACHE_TTL,
    }

    console.log('Dynamic models refreshed successfully')
    return models
  } catch (error) {
    console.warn('Failed to refresh dynamic models, using fallback:', error)
    return FallbackModelOptions
  }
}
