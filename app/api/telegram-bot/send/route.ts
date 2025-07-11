import { type NextRequest, NextResponse } from "next/server"

const TELEGRAM_BOT_TOKEN = "8057847116:AAEOUXELJqQNmh0lQDAl2HgPGKQ_e1x1dkA"
const BOT_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chat_id, text, parse_mode = "Markdown", reply_markup } = body

    if (!chat_id || !text) {
      return NextResponse.json({ error: "chat_id and text are required" }, { status: 400 })
    }

    const payload: any = {
      chat_id,
      text,
      parse_mode,
    }

    if (reply_markup) {
      payload.reply_markup = reply_markup
    }

    const response = await fetch(`${BOT_API_URL}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Telegram API error:", errorData)
      return NextResponse.json({ error: "Failed to send message", details: errorData }, { status: 500 })
    }

    const result = await response.json()
    console.log(`📤 Message sent to ${chat_id}`)

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Telegram Bot Send API",
    bot_token: TELEGRAM_BOT_TOKEN.slice(0, 10) + "...",
    status: "active",
  })
}
