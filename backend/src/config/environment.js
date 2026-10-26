import 'dotenv/config'

const REQUIRED = ['MONGODB_URI', 'DATABASE_NAME', 'ACCESS_TOKEN_SECRET']
REQUIRED.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${key}`)
  }
})

export const env = {
  APP_HOST:   process.env.APP_HOST   || 'localhost',
  APP_PORT:   Number(process.env.APP_PORT) || 8017,
  BUILD_MODE: process.env.BUILD_MODE || 'dev',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  MONGODB_URI:   process.env.MONGODB_URI,
  DATABASE_NAME: process.env.DATABASE_NAME,

  ACCESS_TOKEN_SECRET:            process.env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN:        process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_DAYS:     Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 7,
  RESET_PASSWORD_EXPIRES_MINUTES: Number(process.env.RESET_PASSWORD_EXPIRES_MINUTES) || 15,
  COOKIE_SAME_SITE:               process.env.COOKIE_SAME_SITE || 'lax',

  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  MAIL_FROM: process.env.MAIL_FROM || '"Social Manager" <no-reply@example.com>',
}

export const isProduction = env.BUILD_MODE === 'production'
