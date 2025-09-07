export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import { getTokenPayloadFromCookies } from '@/lib/auth'
import { encrypt, decrypt } from '@/lib/crypto'

// GET /api/app-state - 獲取用戶應用狀態
export async function GET() {
  try {
    const payload = await getTokenPayloadFromCookies()
    if (!payload) return Response.json({ message: 'Unauthorized' }, { status: 401 })

    const userAppState = await prisma.userAppState.findUnique({
      where: { userId: payload.userId },
      select: { data: true, version: true, lastSyncAt: true },
    })

    if (!userAppState) {
      return Response.json({ state: null, version: 0, lastSyncAt: null })
    }

    // 解密應用狀態資料
    const decryptedData = decrypt(userAppState.data as string)

    return Response.json({
      state: JSON.parse(decryptedData),
      version: userAppState.version,
      lastSyncAt: userAppState.lastSyncAt,
    })
  } catch (error) {
    console.error('Get app state error:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/app-state - 儲存用戶應用狀態
export async function POST(request: Request) {
  try {
    const payload = await getTokenPayloadFromCookies()
    if (!payload) return Response.json({ message: 'Unauthorized' }, { status: 401 })

    const { state, clientVersion = 0, forceOverwrite = false } = await request.json()

    if (!state) {
      return Response.json({ message: 'App state data is required' }, { status: 400 })
    }

    // 加密應用狀態資料
    const encryptedData = encrypt(JSON.stringify(state))

    // 檢查版本衝突
    const existingState = await prisma.userAppState.findUnique({
      where: { userId: payload.userId },
      select: { version: true, lastSyncAt: true },
    })

    if (existingState && !forceOverwrite) {
      const serverVersion = existingState.version || 0

      // 如果客戶端版本比服務器版本舊，發生衝突
      if (clientVersion < serverVersion) {
        return Response.json({
          conflict: true,
          message: 'App state conflict detected',
          serverVersion,
          clientVersion,
          lastSyncAt: existingState.lastSyncAt,
        }, { status: 409 })
      }
    }

    // 儲存或更新應用狀態
    const result = await prisma.userAppState.upsert({
      where: { userId: payload.userId },
      update: {
        data: encryptedData,
        version: (existingState?.version || 0) + 1,
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: payload.userId,
        data: encryptedData,
        version: 1,
        lastSyncAt: new Date(),
      },
      select: { version: true, lastSyncAt: true },
    })

    return Response.json({
      success: true,
      version: result.version,
      lastSyncAt: result.lastSyncAt,
      conflictResolved: forceOverwrite && existingState,
    })
  } catch (error) {
    console.error('Save app state error:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
