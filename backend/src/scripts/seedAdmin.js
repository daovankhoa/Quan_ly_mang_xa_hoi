/* eslint-disable no-console */
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { connectDB } from '~/config/mongodb'
import UserModel from '~/models/User.model'
import { USER_ROLES } from '~/utils/constants'

// Có thể đổi bằng biến môi trường ADMIN_LOGIN / ADMIN_PASSWORD trong .env
const LOGIN = (process.env.ADMIN_LOGIN || 'Admin@123').trim().toLowerCase()
const PASSWORD = process.env.ADMIN_PASSWORD || '123456'

const run = async () => {
  await connectDB()

  // Dùng updateOne (không chạy validator của schema) vì tài khoản mặc định này
  // không đạt quy tắc đăng ký thường: email không có đuôi, mật khẩu < 8 ký tự.
  const hash = await bcrypt.hash(PASSWORD, 12)
  await UserModel.updateOne(
    { email: LOGIN },
    {
      $set: {
        role: USER_ROLES.ADMIN,
        isActive: true,
        password: hash,
        refreshTokens: [],
        passwordChangedAt: new Date(Date.now() - 1000),
      },
      $setOnInsert: {
        username: 'admin',
        displayName: 'Quản trị viên',
        email: LOGIN,
      },
    },
    { upsert: true }
  )

  console.log(`✔ Tài khoản Admin sẵn sàng: đăng nhập bằng "${LOGIN}" (hoặc username "admin")`)
  await mongoose.disconnect()
}

run().catch(async (err) => {
  console.error('Tạo Admin thất bại:', err.message)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})