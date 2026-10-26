import { isProduction } from '~/config/environment'

const FIELD_LABELS = { email: 'Email', username: 'Tên người dùng' }

// eslint-disable-next-line no-unused-vars
export const errorHandlingMiddleware = (err, _req, res, _next) => {
  if (err.name === 'ValidationError' && err.errors) {
    const msgs = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({ statusCode: 400, message: msgs.join(', ') })
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0]
    const label = FIELD_LABELS[field] || 'Giá trị'
    return res.status(409).json({ statusCode: 409, message: `${label} đã tồn tại.` })
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ statusCode: 400, message: 'ID không hợp lệ.' })
  }

  const statusCode = err.statusCode || 500
  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', err)
  }

  const isKnownError = err.name === 'ApiError'
  const message = isKnownError || !isProduction
    ? err.message || 'Lỗi máy chủ nội bộ.'
    : 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.'

  res.status(statusCode).json({ statusCode, message })
}
