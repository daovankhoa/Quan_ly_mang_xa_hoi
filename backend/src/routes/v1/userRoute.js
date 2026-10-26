import express from 'express'
import { userController } from '~/controllers/userController'
import { isAuthenticated } from '~/middlewares/authMiddleware'
import { uploadSingleImage } from '~/middlewares/uploadMiddleware'

const Router = express.Router()

Router.put(
  '/me/avatar',
  isAuthenticated,
  uploadSingleImage('avatar'),
  userController.updateAvatar
)

export const userRoute = Router