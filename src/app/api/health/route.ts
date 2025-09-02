import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // 检查环境变量
    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY
    const hasGeminiKey = !!geminiKey && geminiKey.length > 0

    // 基本健康检查
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      services: {
        gemini: hasGeminiKey ? 'configured' : 'not_configured',
      },
    }

    // 如果没有API密钥，返回警告状态
    if (!hasGeminiKey) {
      health.status = 'warning'
      health.services.gemini = 'missing_api_key'
    }

    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 200, // 仍然返回200，但状态为warning
    })

  } catch (error) {
    console.error('Health check error:', error)

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    }, { status: 500 })
  }
}

// 支持HEAD请求（用于简单的健康检查）
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
