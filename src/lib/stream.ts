export async function* streamReader(
  response: Response
): AsyncGenerator<string, void, unknown> {
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  
  if (!reader) return

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value, { stream: true })
      yield chunk
    }
  } finally {
    reader.releaseLock()
  }
}

export function parseSSEChunk(chunk: string): unknown {
  const lines = chunk.split('\n')
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        return JSON.parse(line.slice(6))
      } catch {
        return null
      }
    }
  }
  return null
}