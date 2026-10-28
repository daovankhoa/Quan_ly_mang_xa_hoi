import UserModel from '~/models/User.model'
import ApiError from '~/utils/ApiError'
import { env } from '~/config/environment'
import { generateAccessToken } from '~/providers/jwtProvider'
import { sendResetPasswordEmail } from '~/providers/mailProvider'
import { generateRandomToken, hashToken } from '~/utils/tokenUtils'

const MAX_SESSIONS = 5
const DAY_MS = 24 * 60 * 60 * 1000

const createSession = async (user, userAgent = '') => {
  const refreshToken = generateRandomToken()

  await UserModel.updateOne(
    { _id: user._id },
    {
      $set: { lastLoginAt: new Date() },
      $push: {
        refreshTokens: {
          $each: [{
            tokenHash: hashToken(refreshToken),
            expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * DAY_MS),
            userAgent: String(userAgent).slice(0, 255),
            createdAt: new Date(),
          }],
          $slice: -MAX_SESSIONS,
        },
      },
    }
  )

  const accessToken = generateAccessToken({ id: user._id, role: user.role })
  return { accessToken, refreshToken }
}

const register = async ({ username, displayName, email, password }) => {
  const existing = await UserModel.findOne({ $or: [{ email }, { username }] })
    .select('email username')

  if (existing) {
    throw new ApiError(
      409,
      existing.email === email
        ? 'Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.'
        : 'Tên người dùng đã được sử dụng. Vui lòng chọn tên khác.'
    )
  }

  return UserModel.create({ username, displayName, email, password })
}

const login = async ({ email, password }, userAgent) => {
  // `email` có thể là email hoặc username
  const user = await UserModel.findOne({ $or: [{ email }, { username: email }] }).select('+password')
  const isMatch = user ? await user.comparePassword(password) : false

  if (!isMatch) throw new ApiError(401, 'Email hoặc mật khẩu không đúng.')

  if (!user.isActive) {
    throw new ApiError(403, 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.')
  }

  const tokens = await createSession(user, userAgent)
  return { ...tokens, user }
}

const refresh = async (rawToken, userAgent) => {
  if (!rawToken) {
    throw new ApiError(401, 'Phiên đăng nhập không tồn tại. Vui lòng đăng nhập lại.')
  }
  const tokenHash = hashToken(rawToken)

  const user = await UserModel.findOneAndUpdate(
    { 'refreshTokens.tokenHash': tokenHash },
    { $pull: { refreshTokens: { tokenHash } } }
  ).select('+refreshTokens')

  const session = user?.refreshTokens.find((t) => t.tokenHash === tokenHash)
  if (!user || !session || session.expiresAt < new Date()) {
    throw new ApiError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.')
  }

  const tokens = await createSession(user, userAgent)
  return { ...tokens, user }
}

const logout = async (rawToken) => {
  if (!rawToken) return
  const tokenHash = hashToken(rawToken)
  await UserModel.updateOne(
    { 'refreshTokens.tokenHash': tokenHash },
    { $pull: { refreshTokens: { tokenHash } } }
  )
}

const logoutAll = async (userId) => {
  await UserModel.updateOne({ _id: userId }, { $set: { refreshTokens: [] } })
}

const forgotPassword = async ({ email }) => {
  const user = await UserModel.findOne({ email, isActive: true })
  if (!user) return

  const rawToken = generateRandomToken()
  user.passwordResetToken = hashToken(rawToken)
  user.passwordResetExpires = new Date(
    Date.now() + env.RESET_PASSWORD_EXPIRES_MINUTES * 60 * 1000
  )
  await user.save({ validateBeforeSave: false })

  try {
    await sendResetPasswordEmail({
      to: user.email,
      displayName: user.displayName,
      resetUrl: `${env.CLIENT_URL}/reset-password/${rawToken}`,
      expiresInMinutes: env.RESET_PASSWORD_EXPIRES_MINUTES,
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[MAIL] Gửi email đặt lại mật khẩu thất bại:', err.message)
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })
  }
}

const resetPassword = async (rawToken, { password }) => {
  const user = await UserModel.findOne({
    passwordResetToken:   hashToken(rawToken),
    passwordResetExpires: { $gt: new Date() },
  })

  if (!user) {
    throw new ApiError(400, 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.')
  }

  user.password = password
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  user.refreshTokens = []
  await user.save()
}

export const authService = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
}