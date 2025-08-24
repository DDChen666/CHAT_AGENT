import { toast } from "sonner"

interface ApiError {
  message: string
  code: string
}

export class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = '/api'
  }

  async chatStream(
    params: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<Response> {
    return this.streamRequest('/chat', params, signal)
  }

  async optimizeStream(
    params: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<Response> {
    return this.streamRequest('/optimize', params, signal)
  }

  private async streamRequest(
    endpoint: string,
    body: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        stream: true,
      }),
      signal,
    })

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
      }))
      
      toast.error(error.message || 'Request failed')
      throw new Error(error.message)
    }

    return response
  }
}