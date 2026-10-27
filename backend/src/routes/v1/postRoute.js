import express from 'express'
import { postController } from '~/controllers/postController'
import { commentController } from '~/controllers/commentController'
import { isAuthenticated } from '~/middlewares/authMiddleware'
import { uploadMultipleImages } from '~/middlewares/uploadMiddleware'
import { createPostLimiter, createCommentLimiter } from '~/middlewares/rateLimiter'
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

Router.get('/:postId/comments', commentController.getComments)
Router.post('/:postId/comments', createCommentLimiter, commentController.createComment)

Router.put('/:id/like', postController.likePost)
Router.delete('/:id/like', postController.unlikePost)
Router.delete('/:id', postController.deletePost)

export const postRoute = Router