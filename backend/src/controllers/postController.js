import { postService } from '~/services/postService'
import { StatusCodes } from '~/utils/constants'

const createPost = async (req, res) => {
  const post = await postService.createPost(req.user, req.body, req.files)
  res.status(StatusCodes.CREATED).json({ message: 'Đăng bài thành công!', post })
}

const getFeed = async (req, res) => {
  const data = await postService.getFeed(req.user._id, req.query)
  res.status(StatusCodes.OK).json(data)
}

const likePost = async (req, res) => {
  const data = await postService.likePost(req.user._id, req.params.id)
  res.status(StatusCodes.OK).json(data)
}

const unlikePost = async (req, res) => {
  const data = await postService.unlikePost(req.user._id, req.params.id)
  res.status(StatusCodes.OK).json(data)
}

const deletePost = async (req, res) => {
  await postService.deletePost(req.user, req.params.id)
  res.status(StatusCodes.OK).json({ message: 'Đã xoá bài viết' })
}

export const postController = { createPost, getFeed, likePost, unlikePost, deletePost }