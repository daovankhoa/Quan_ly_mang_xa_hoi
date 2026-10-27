import rateLimit from 'express-rate-limit'
import ApiError from '~/utils/ApiError'

const createLimiter = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new ApiError(429, message)),
  })

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: 'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau 15 phút.',
})

export const forgotPasswordLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: 'Bạn yêu cầu đặt lại mật khẩu quá nhiều lần. Vui lòng thử lại sau 1 giờ.',
})

export const createPostLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  message: 'Bạn đăng bài quá nhanh. Vui lòng thử lại sau ít phút.',
})