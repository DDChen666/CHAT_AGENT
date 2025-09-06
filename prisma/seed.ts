#!/usr/bin/env tsx

/**
 * 資料庫種子資料腳本
 * 用於在開發環境中填充測試資料
 */

import { PrismaClient, Provider } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 開始填充測試資料...')

  // 建立測試用戶
  const hashedPassword = await bcrypt.hash('testpassword123', 10)

  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: '測試用戶',
      passwordHash: hashedPassword,
      isAdmin: false,
    },
  })

  console.log('✅ 測試用戶建立完成:', testUser.email)

  // 建立測試對話
  const conversation = await prisma.conversation.upsert({
    where: { id: 'test-conversation-1' },
    update: {},
    create: {
      id: 'test-conversation-1',
      userId: testUser.id,
      title: '測試對話',
    },
  })

  console.log('✅ 測試對話建立完成:', conversation.title)

  // 建立測試訊息
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: '你好，這是一個測試訊息',
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: '你好！這是測試回應訊息。',
      },
    }),
  ])

  console.log('✅ 測試訊息建立完成:', messages.length, '條訊息')

  // 建立測試 API 金鑰
  const apiKeys = await Promise.all([
    prisma.apiKey.create({
      data: {
        userId: testUser.id,
        provider: Provider.GEMINI,
        encryptedKey: 'encrypted_test_gemini_key',
      },
    }),
    prisma.apiKey.create({
      data: {
        userId: testUser.id,
        provider: Provider.DEEPSEEK,
        encryptedKey: 'encrypted_test_deepseek_key',
      },
    }),
  ])

  console.log('✅ 測試 API 金鑰建立完成:', apiKeys.length, '組金鑰')

  console.log('🎉 測試資料填充完成！')
  console.log('\n📊 資料統計:')
  console.log(`- 用戶: 1`)
  console.log(`- 對話: 1`)
  console.log(`- 訊息: ${messages.length}`)
  console.log(`- API 金鑰: ${apiKeys.length}`)
}

main()
  .catch((e) => {
    console.error('❌ 種子資料填充失敗:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
