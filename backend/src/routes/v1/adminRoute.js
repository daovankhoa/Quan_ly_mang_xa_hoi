import express from 'express'
import { adminController } from '~/controllers/adminController'
import { isAuthenticated, isAdmin } from '~/middlewares/authMiddleware'
import {
  validateUpdateUser,
  validateCreateTrack,
  validateUpdateTrack,
} from '~/validations/adminValidation'

const Router = express.Router()

// Toàn bộ /api/v1/admin/* chỉ dành cho tài khoản có role = admin
Router.use(isAuthenticated, isAdmin)

Router.get('/stats', adminController.getStats)

Router.get('/users', adminController.listUsers)
Router.get('/users/:id', adminController.getUser)
Router.patch('/users/:id', validateUpdateUser, adminController.updateUser)
Router.delete('/users/:id', adminController.deleteUser)

Router.get('/posts', adminController.listPosts)
Router.delete('/posts/:id', adminController.deletePost)

Router.get('/comments', adminController.listComments)
Router.delete('/comments/:id', adminController.deleteComment)

Router.get('/tracks', adminController.listTracks)
Router.post('/tracks', validateCreateTrack, adminController.createTrack)
Router.put('/tracks/:id', validateUpdateTrack, adminController.updateTrack)
Router.delete('/tracks/:id', adminController.deleteTrack)

export const adminRoute = Router