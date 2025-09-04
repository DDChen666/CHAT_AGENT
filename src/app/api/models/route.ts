export const runtime = 'nodejs'

import { ModelOptions } from '@/lib/providers'

export async function GET() {
  return Response.json({ providers: ModelOptions })
}

