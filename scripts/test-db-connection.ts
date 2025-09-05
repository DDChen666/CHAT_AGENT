#!/usr/bin/env tsx

/**
 * 資料庫連接測試腳本
 * 用於驗證本地開發環境的資料庫連接是否正常
 */

import { PrismaClient } from '@prisma/client'

async function testDatabaseConnection() {
  console.log('🔍 測試資料庫連接...')

  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  })

  try {
    // 測試基本連接
    await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ 資料庫連接成功')

    // 測試各個表的訪問權限
    const tables = ['User', 'Conversation', 'Message', 'ApiKey']

    for (const table of tables) {
      try {
        await prisma.$queryRaw`SELECT COUNT(*) as count FROM "${table}"`
        console.log(`✅ ${table} 表訪問正常`)
      } catch (error) {
        console.log(`⚠️  ${table} 表訪問異常:`, error instanceof Error ? error.message : String(error))
      }
    }

    console.log('🎉 資料庫測試完成')
    process.exit(0)

  } catch (error) {
    console.error('❌ 資料庫連接失敗:', error)
    console.error('\n🔧 請檢查:')
    console.error('1. .env 檔案是否存在')
    console.error('2. DATABASE_URL 環境變數是否正確設定')
    console.error('3. 資料庫服務是否運行')
    console.error('4. 網路連接是否正常')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabaseConnection()
