import { GoogleGenAI } from '@google/genai'
import { env } from '~/config/environment'

let client = null

// Tạo client một lần rồi dùng lại. Trả về null nếu chưa cấu hình API key
// để server vẫn chạy bình thường khi chưa bật tính năng AI.
export const getGeminiClient = () => {
  if (!env.GEMINI_API_KEY) return null
  if (!client) {
    client = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY,
      httpOptions: { timeout: 30 * 1000 }, // 30 giây
    })
  }
  return client
}