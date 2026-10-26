import ApiError from '~/utils/ApiError'
import { verifyAccessToken } from '~/providers/jwtProvider'
import UserModel from '~/models/User.model'
import { USER_ROLES } from '~/utils/constants'

export const isAuthenticated = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.')
    }

    const decoded = verifyAccessToken(authHeader.split(' ')[1])

    const user = await UserModel.findById(decoded.id)
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Tài khoản không tồn tại hoặc đã bị khóa.')
    }

    if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
      throw new ApiError(401, 'Mật khẩu đã thay đổi. Vui lòng đăng nhập lại.')
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Token không hợp lệ.'))
    }
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token đã hết hạn.'))
    }
    next(err)
  }
}

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Bạn không có quyền thực hiện hành động này.'))
  }
  next()
}

export const isAdmin = authorize(USER_ROLES.ADMIN)
