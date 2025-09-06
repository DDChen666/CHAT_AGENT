#!/usr/bin/env tsx

/**
 * 資料庫連接測試腳本
 * 用於驗證本地開發環境的資料庫連接是否正常
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// 載入環境變數
function loadEnvFile() {
  const envPath = join(process.cwd(), '.env.local')
  if (existsSync(envPath)) {
    try {
      const envContent = readFileSync(envPath, 'utf8')
      const lines = envContent.split('\n')

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=')
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '') // 移除引號
            process.env[key.trim()] = value.trim()
          }
        }
      }
      console.log('✅ 已載入 .env.local 檔案')
    } catch (error) {
      console.warn('⚠️  無法載入 .env.local 檔案:', error)
    }
  } else {
    console.warn('⚠️  .env.local 檔案不存在')
  }
}

// 載入環境變數
loadEnvFile()

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
        // 使用模板标签函数的正确方式
        const query = `SELECT COUNT(*) as count FROM "${table}"`
        await prisma.$queryRawUnsafe(query)
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
