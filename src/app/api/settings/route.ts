export const runtime = 'nodejs'

import prisma from '@/lib/prisma'
import { getTokenPayloadFromCookies } from '@/lib/auth'
import { encrypt, decrypt } from '@/lib/crypto'

// GET /api/settings - 獲取用戶設定
export async function GET() {
  try {
    const payload = await getTokenPayloadFromCookies()
    if (!payload) return Response.json({ message: 'Unauthorized' }, { status: 401 })

    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: payload.userId },
      select: { data: true, version: true, lastSyncAt: true },
    })

    if (!userSettings) {
      return Response.json({
        settings: null,
        version: 0,
        lastSyncAt: null,
        syncInfo: { isNewUser: true }
      })
    }

    // 解密設定資料
    const decryptedData = decrypt(userSettings.data as string)

    return Response.json({
      settings: JSON.parse(decryptedData),
      version: userSettings.version,
      lastSyncAt: userSettings.lastSyncAt,
      syncInfo: { isNewUser: false }
    })
  } catch (error) {
    console.error('Get settings error:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/settings - 儲存用戶設定
export async function POST(request: Request) {
  try {
    const payload = await getTokenPayloadFromCookies()
    if (!payload) return Response.json({ message: 'Unauthorized' }, { status: 401 })

    const { settings, clientVersion = 0, forceOverwrite = false } = await request.json()

    if (!settings) {
      return Response.json({ message: 'Settings data is required' }, { status: 400 })
    }

    // 加密設定資料
    const encryptedData = encrypt(JSON.stringify(settings))

    // 檢查版本衝突
    const existingSettings = await prisma.userSettings.findUnique({
      where: { userId: payload.userId },
      select: { version: true, lastSyncAt: true },
    })

    if (existingSettings && !forceOverwrite) {
      const serverVersion = existingSettings.version || 0

      // 如果客戶端版本比服務器版本舊，發生衝突
      if (clientVersion < serverVersion) {
        return Response.json({
          conflict: true,
          message: 'Settings conflict detected',
          serverVersion,
          clientVersion,
          lastSyncAt: existingSettings.lastSyncAt,
        }, { status: 409 })
      }
    }

    // 儲存或更新設定
    const result = await prisma.userSettings.upsert({
      where: { userId: payload.userId },
      update: {
        data: encryptedData,
        version: (existingSettings?.version || 0) + 1,
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
      conflictResolved: forceOverwrite && existingSettings,
    })
  } catch (error) {
    console.error('Save settings error:', error)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
