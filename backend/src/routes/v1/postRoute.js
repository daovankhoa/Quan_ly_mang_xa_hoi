import express from 'express'
import { postController } from '~/controllers/postController'
import { isAuthenticated } from '~/middlewares/authMiddleware'
import { uploadMultipleImages } from '~/middlewares/uploadMiddleware'
import { createPostLimiter } from '~/middlewares/rateLimiter'
import { MAX_POST_IMAGES } from '~/models/Post.model'

const Router = express.Router()

Router.use(isAuthenticated)

Router.get('/', postController.getFeed)
Router.post(
  '/',
  createPostLimiter,
  uploadMultipleImages('images', MAX_POST_IMAGES),
  postController.createPost
)

Router.put('/:id/like', postController.likePost)
Router.delete('/:id/like', postController.unlikePost)
Router.delete('/:id', postController.deletePost)

export const postRoute = Router