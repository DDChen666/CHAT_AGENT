export const runtime = 'nodejs'

import { getModelOptions } from '@/lib/providers'

export async function GET() {
  return Response.json({ providers: getModelOptions() })
}

