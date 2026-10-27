import { commentService } from '~/services/commentService'
import { StatusCodes } from '~/utils/constants'

const getComments = async (req, res) => {
  const data = await commentService.getComments(req.params.postId, req.query)
  res.status(StatusCodes.OK).json(data)
}

const getReplies = async (req, res) => {
  const data = await commentService.getReplies(req.params.id, req.query)
  res.status(StatusCodes.OK).json(data)
}

const createComment = async (req, res) => {
  const comment = await commentService.createComment(req.user, req.params.postId, req.body)
  res.status(StatusCodes.CREATED).json({ comment })
}

const deleteComment = async (req, res) => {
  const { removed } = await commentService.deleteComment(req.user, req.params.id)
  res.status(StatusCodes.OK).json({ message: 'Đã xoá bình luận', removed })
}

export const commentController = { getComments, getReplies, createComment, deleteComment }