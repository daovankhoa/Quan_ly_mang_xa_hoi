import express from 'express'
import { authController } from '~/controllers/authController'
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from '~/validations/authValidation'
import { isAuthenticated } from '~/middlewares/authMiddleware'
import { authLimiter, forgotPasswordLimiter } from '~/middlewares/rateLimiter'

const Router = express.Router()

Router.post('/register', authLimiter, validateRegister, authController.register)
Router.post('/login', authLimiter, validateLogin, authController.login)
Router.post('/refresh-token', authController.refreshToken)
Router.post('/logout', authController.logout)
Router.post('/logout-all', isAuthenticated, authController.logoutAll)

Router.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, authController.forgotPassword)
Router.post('/reset-password/:token', authLimiter, validateResetPassword, authController.resetPassword)

Router.get('/me', isAuthenticated, authController.getMe)

export const authRoute = Router
