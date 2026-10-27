import express from 'express'
import { commentController } from '~/controllers/commentController'
import { isAuthenticated } from '~/middlewares/authMiddleware'

const Router = express.Router()

Router.use(isAuthenticated)

Router.get('/:id/replies', commentController.getReplies)
Router.delete('/:id', commentController.deleteComment)

export const commentRoute = Router