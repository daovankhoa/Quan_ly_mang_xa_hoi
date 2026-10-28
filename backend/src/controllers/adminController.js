import { adminService } from '~/services/adminService'
import { StatusCodes } from '~/utils/constants'

const getStats = async (_req, res) => {
  const stats = await adminService.getStats()
  res.status(StatusCodes.OK).json({ stats })
}

/* users */
const listUsers = async (req, res) => {
  res.status(StatusCodes.OK).json(await adminService.listUsers(req.query))
}

const getUser = async (req, res) => {
  const user = await adminService.getUser(req.params.id)
  res.status(StatusCodes.OK).json({ user })
}

const updateUser = async (req, res) => {
  const user = await adminService.updateUser(req.user, req.params.id, req.body)
  res.status(StatusCodes.OK).json({ message: 'Cập nhật người dùng thành công!', user })
}

const deleteUser = async (req, res) => {
  const result = await adminService.deleteUser(req.user, req.params.id)
  res.status(StatusCodes.OK).json({ message: 'Đã xoá người dùng', ...result })
}

/* posts */
const listPosts = async (req, res) => {
  res.status(StatusCodes.OK).json(await adminService.listPosts(req.query))
}

const deletePost = async (req, res) => {
  await adminService.deletePost(req.user, req.params.id)
  res.status(StatusCodes.OK).json({ message: 'Đã xoá bài viết' })
}

/* comments */
const listComments = async (req, res) => {
  res.status(StatusCodes.OK).json(await adminService.listComments(req.query))
}

const deleteComment = async (req, res) => {
  const { removed } = await adminService.deleteComment(req.user, req.params.id)
  res.status(StatusCodes.OK).json({ message: 'Đã xoá bình luận', removed })
}

/* tracks */
const listTracks = async (req, res) => {
  res.status(StatusCodes.OK).json(await adminService.listTracks(req.query))
}

const createTrack = async (req, res) => {
  const track = await adminService.createTrack(req.body)
  res.status(StatusCodes.CREATED).json({ message: 'Đã thêm bài nhạc', track })
}

const updateTrack = async (req, res) => {
  const track = await adminService.updateTrack(req.params.id, req.body)
  res.status(StatusCodes.OK).json({ message: 'Đã cập nhật bài nhạc', track })
}

const deleteTrack = async (req, res) => {
  await adminService.deleteTrack(req.params.id)
  res.status(StatusCodes.OK).json({ message: 'Đã xoá bài nhạc' })
}

export const adminController = {
  getStats,
  listUsers, getUser, updateUser, deleteUser,
  listPosts, deletePost,
  listComments, deleteComment,
  listTracks, createTrack, updateTrack, deleteTrack,
}