import { authService } from '~/services/authService'
import { StatusCodes } from '~/utils/constants'
import { env, isProduction } from '~/config/environment'

const REFRESH_COOKIE = 'refreshToken'

const baseCookieOptions = () => ({
  httpOnly: true,
  secure:   isProduction || env.COOKIE_SAME_SITE === 'none',
  sameSite: env.COOKIE_SAME_SITE,
  path:     '/api/v1/auth',
})

const setRefreshCookie = (res, token) =>
  res.cookie(REFRESH_COOKIE, token, {
    ...baseCookieOptions(),
    maxAge: env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  })

const clearRefreshCookie = (res) =>
  res.clearCookie(REFRESH_COOKIE, baseCookieOptions())

const register = async (req, res) => {
  const user = await authService.register(req.body)
  res.status(StatusCodes.CREATED).json({
    message: 'Đăng ký thành công! Vui lòng đăng nhập.',
    user,
  })
}

const login = async (req, res) => {
  const { accessToken, refreshToken, user } =
    await authService.login(req.body, req.get('user-agent'))

  setRefreshCookie(res, refreshToken)
  res.status(StatusCodes.OK).json({
    message: 'Đăng nhập thành công!',
    accessToken,
    user,
  })
}

const refreshToken = async (req, res) => {
  try {
    const result = await authService.refresh(
      req.cookies?.[REFRESH_COOKIE],
      req.get('user-agent')
    )
    setRefreshCookie(res, result.refreshToken)
    res.status(StatusCodes.OK).json({
      accessToken: result.accessToken,
      user:        result.user,
    })
  } catch (err) {
    clearRefreshCookie(res)
    throw err
  }
}

const logout = async (req, res) => {
  await authService.logout(req.cookies?.[REFRESH_COOKIE])
  clearRefreshCookie(res)
  res.status(StatusCodes.OK).json({ message: 'Đăng xuất thành công.' })
}

const logoutAll = async (req, res) => {
  await authService.logoutAll(req.user._id)
  clearRefreshCookie(res)
  res.status(StatusCodes.OK).json({ message: 'Đã đăng xuất khỏi tất cả thiết bị.' })
}

const forgotPassword = async (req, res) => {
  await authService.forgotPassword(req.body)
  res.status(StatusCodes.OK).json({
    message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.',
  })
}

const resetPassword = async (req, res) => {
  await authService.resetPassword(req.params.token, req.body)
  clearRefreshCookie(res)
  res.status(StatusCodes.OK).json({
    message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.',
  })
}

const getMe = async (req, res) => {
  res.status(StatusCodes.OK).json({ user: req.user })
}

export const authController = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  getMe,
}
