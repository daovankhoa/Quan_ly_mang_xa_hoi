/* eslint-disable no-console */
// Cách dùng (trong thư mục backend), KHÔNG cần cờ --caption:
//   npm run test:music-ai -- "C:\Users\ASUS\Pictures\anh.jpg" Chiều hoàng hôn ở biển
//
// - Mọi đường dẫn kết thúc bằng .jpg / .jpeg / .png / .webp được hiểu là ảnh (tối đa dùng 3 ảnh đầu).
// - Phần chữ còn lại được hiểu là chú thích của bài đăng (có thể bỏ trống).
// Quy trình: ảnh + chú thích -> Gemini phân tích -> khớp với kho nhạc -> in ra 3 bài gợi ý.
import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import { connectDB } from '~/config/mongodb'
import { analyzeMood } from '~/services/musicAiService'
import { suggestTracks } from '~/services/musicService'

const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

// PowerShell/npm trên Windows làm mất dấu ngoặc kép và tách chuỗi theo dấu cách,
// nên ghép lại rồi tự nhận diện đường dẫn ảnh thay vì tin vào từng đối số.
const parseArgs = () => {
  let rest = process.argv.slice(2).join(' ')
  const imagePaths = []

  // Đường dẫn tuyệt đối kiểu Windows (cho phép có dấu cách), vd: C:\Users\ASUS\My Pictures\a.jpg
  const winPaths = rest.match(/[A-Za-z]:\\.+?\.(?:jpe?g|png|webp)(?=\s|$)/gi) || []
  winPaths.forEach((p) => {
    imagePaths.push(p)
    rest = rest.replace(p, ' ')
  })

  // Đường dẫn tương đối/không có dấu cách, vd: .\anh.png
  rest = rest
    .split(/\s+/)
    .filter((token) => {
      if (/\.(?:jpe?g|png|webp)$/i.test(token)) {
        imagePaths.push(token)
        return false
      }
      return true
    })
    .join(' ')

  const caption = rest.replace(/--caption/g, '').trim()
  return { imagePaths, caption }
}

const run = async () => {
  const { imagePaths, caption } = parseArgs()

  if (imagePaths.length === 0 && !caption) {
    throw new Error('Hãy truyền ít nhất một ảnh (.jpg/.png/.webp) hoặc một câu chú thích.')
  }

  const files = imagePaths.map((p) => {
    if (!fs.existsSync(p)) throw new Error(`Không tìm thấy file ảnh: ${p}`)
    const mimetype = MIME_BY_EXT[path.extname(p).toLowerCase()]
    return { buffer: fs.readFileSync(p), mimetype }
  })

  console.log(`Ảnh: ${files.length} | Chú thích: ${caption ? `"${caption}"` : '(không có)'}`)

  // --- Bước 2: AI phân tích ---
  console.log('\n[1/2] Đang gửi cho Gemini...')
  const started = Date.now()
  const profile = await analyzeMood({ files, content: caption })
  console.log(`Hồ sơ nhạc (${((Date.now() - started) / 1000).toFixed(1)}s):`)
  console.log(JSON.stringify(profile, null, 2))

  // --- Bước 3: khớp với kho nhạc ---
  console.log('\n[2/2] Đang khớp với kho nhạc...')
  await connectDB()
  const tracks = await suggestTracks(profile)
  if (tracks.length === 0) {
    console.log('Kho nhạc trống. Hãy chạy: npm run seed:tracks')
  } else {
    console.log('Gợi ý:')
    tracks.forEach((t, i) => {
      console.log(
        `  ${i + 1}. ${t.title} — ${t.artist}  [mood: ${t.moods.join(', ')}] [genre: ${t.genres.join(', ')}] [energy: ${t.energy}]`
      )
    })
  }
  await mongoose.disconnect()
}

run().catch(async (err) => {
  console.error('Thất bại:', err.message)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})