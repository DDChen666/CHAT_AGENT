export const runtime = 'nodejs'

import prisma from '@/lib/prisma'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1` as unknown
    return Response.json({ ok: true })
  } catch (error) {
    console.error('DB health check failed:', error)
    return Response.json({ ok: false, error: 'DB_ERROR' }, { status: 500 })
  }
}

