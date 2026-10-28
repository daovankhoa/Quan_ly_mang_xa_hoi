import ApiError from '~/utils/ApiError'
import UserModel from '~/models/User.model'
import PostModel from '~/models/Post.model'
import CommentModel from '~/models/Comment.model'
import LikeModel from '~/models/Like.model'
import TrackModel from '~/models/Track.model'
import { USER_ROLES } from '~/utils/constants'
import { deleteImages } from '~/providers/cloudinaryProvider'
import { postService } from '~/services/postService'
import { commentService } from '~/services/commentService'

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 100
const DAY_MS = 24 * 60 * 60 * 1000
const TIMEZONE = 'Asia/Ho_Chi_Minh' // UTC+7, không có giờ mùa hè
const STATS_DAYS = 7

/* ----------------------------- helpers ----------------------------- */

const isObjectId = (v) => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v)

const assertObjectId = (id, message = 'ID không hợp lệ') => {
  if (!isObjectId(id)) throw new ApiError(400, message)
}

const parsePaging = ({ page, limit } = {}) => {
  const size = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT)
  const current = Math.max(parseInt(page, 10) || 1, 1)
  return { page: current, limit: size, skip: (current - 1) * size }
}

const buildPagination = ({ page, limit }, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
})

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const toSearchRegex = (q) => {
  const text = typeof q === 'string' ? q.trim().slice(0, 100) : ''
  return text ? new RegExp(escapeRegex(text), 'i') : null
}

const parseBool = (v) => (v === 'true' ? true : v === 'false' ? false : undefined)

// Luôn thêm _id để thứ tự ổn định khi nhiều bản ghi trùng giá trị sắp xếp
const parseSort = ({ sortBy, order }, allowed, fallback = 'createdAt') => {
  const field = allowed.includes(sortBy) ? sortBy : fallback
  const dir = order === 'asc' ? 1 : -1
  return field === '_id' ? { _id: dir } : { [field]: dir, _id: dir }
}

const countByField = async (Model, field, ids) => {
  if (!ids.length) return new Map()
  const rows = await Model.aggregate([
    { $match: { [field]: { $in: ids } } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ])
  return new Map(rows.map((r) => [String(r._id), r.count]))
}

const dayLabel = (date) => date.toLocaleDateString('sv-SE', { timeZone: TIMEZONE }) // YYYY-MM-DD

const dailySeries = async (Model, labels, since) => {
  const rows = await Model.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TIMEZONE } },
        count: { $sum: 1 },
      },
    },
  ])
  const map = new Map(rows.map((r) => [r._id, r.count]))
  return labels.map((date) => ({ date, count: map.get(date) || 0 }))
}

/* ------------------------------ stats ------------------------------ */

const getStats = async () => {
  const labels = Array.from({ length: STATS_DAYS }, (_, i) =>
    dayLabel(new Date(Date.now() - (STATS_DAYS - 1 - i) * DAY_MS))
  )
  const since = new Date(`${labels[0]}T00:00:00+07:00`)

  const [
    totalUsers, activeUsers, adminUsers,
    totalPosts, totalComments, totalLikes,
    totalTracks, activeTracks,
    newUsersByDay, newPostsByDay,
  ] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ isActive: true }),
    UserModel.countDocuments({ role: USER_ROLES.ADMIN }),
    PostModel.countDocuments(),
    CommentModel.countDocuments(),
    LikeModel.countDocuments(),
    TrackModel.countDocuments(),
    TrackModel.countDocuments({ isActive: true }),
    dailySeries(UserModel, labels, since),
    dailySeries(PostModel, labels, since),
  ])

  return {
    users:    { total: totalUsers, active: activeUsers, locked: totalUsers - activeUsers, admins: adminUsers },
    posts:    { total: totalPosts },
    comments: { total: totalComments },
    likes:    { total: totalLikes },
    tracks:   { total: totalTracks, active: activeTracks },
    last7Days: { newUsers: newUsersByDay, newPosts: newPostsByDay },
  }
}

/* ------------------------------ users ------------------------------ */

const listUsers = async (query = {}) => {
  const paging = parsePaging(query)
  const filter = {}

  const regex = toSearchRegex(query.search)
  if (regex) filter.$or = [{ username: regex }, { displayName: regex }, { email: regex }]

  if (typeof query.role === 'string' && Object.values(USER_ROLES).includes(query.role)) {
    filter.role = query.role
  }
  const isActive = parseBool(query.isActive)
  if (isActive !== undefined) filter.isActive = isActive

  const sort = parseSort(query, ['createdAt', 'lastLoginAt', 'username', 'displayName'])

  const [rows, total] = await Promise.all([
    UserModel.find(filter).sort(sort).skip(paging.skip).limit(paging.limit),
    UserModel.countDocuments(filter),
  ])

  const ids = rows.map((u) => u._id)
  const [postsMap, commentsMap] = await Promise.all([
    countByField(PostModel, 'author', ids),
    countByField(CommentModel, 'author', ids),
  ])

  return {
    users: rows.map((u) => ({
      ...u.toJSON(),
      lastLoginAt: u.lastLoginAt || null,
      postsCount: postsMap.get(String(u._id)) || 0,
      commentsCount: commentsMap.get(String(u._id)) || 0,
    })),
    pagination: buildPagination(paging, total),
  }
}

const getUser = async (id) => {
  assertObjectId(id)
  const user = await UserModel.findById(id)
  if (!user) throw new ApiError(404, 'Người dùng không tồn tại')

  const [postsCount, commentsCount, likesGiven] = await Promise.all([
    PostModel.countDocuments({ author: user._id }),
    CommentModel.countDocuments({ author: user._id }),
    LikeModel.countDocuments({ user: user._id }),
  ])
  return { ...user.toJSON(), lastLoginAt: user.lastLoginAt || null, postsCount, commentsCount, likesGiven }
}

const updateUser = async (admin, id, { role, isActive, displayName }) => {
  assertObjectId(id)

  const isSelf = String(admin._id) === id.toLowerCase()
  if (isSelf && ((role !== undefined && role !== USER_ROLES.ADMIN) || isActive === false)) {
    throw new ApiError(400, 'Bạn không thể tự hạ quyền hoặc tự khóa chính mình')
  }

  const $set = {}
  if (role !== undefined) $set.role = role
  if (isActive !== undefined) $set.isActive = isActive
  if (displayName !== undefined) $set.displayName = displayName
  // Khóa tài khoản thì thu hồi luôn mọi phiên đăng nhập (refresh token)
  if (isActive === false) $set.refreshTokens = []

  const user = await UserModel.findByIdAndUpdate(id, { $set }, { new: true, runValidators: true })
  if (!user) throw new ApiError(404, 'Người dùng không tồn tại')
  return user
}

// Xoá người dùng kèm toàn bộ dữ liệu của họ (bài viết, bình luận, lượt thích, ảnh đại diện).
// Chạy tuần tự, dùng lại logic xoá bài/bình luận để các bộ đếm luôn đúng.
const deleteUser = async (admin, id) => {
  assertObjectId(id)
  if (String(admin._id) === id.toLowerCase()) {
    throw new ApiError(400, 'Bạn không thể tự xoá chính mình')
  }

  const user = await UserModel.findById(id).select('role')
  if (!user) throw new ApiError(404, 'Người dùng không tồn tại')
  if (user.role === USER_ROLES.ADMIN) {
    throw new ApiError(400, 'Hãy hạ quyền quản trị viên này xuống người dùng trước khi xoá')
  }

  // 1. Bài viết của họ (kéo theo like/bình luận/ảnh trên các bài đó)
  const posts = await PostModel.find({ author: user._id }).select('_id').lean()
  for (const post of posts) {
    await postService.deletePost(admin, post._id)
  }

  // 2. Lượt thích họ đã thả ở bài người khác -> trừ lại bộ đếm
  const likes = await LikeModel.find({ user: user._id }).select('post').lean()
  if (likes.length) {
    await PostModel.updateMany(
      { _id: { $in: likes.map((l) => l.post) }, likesCount: { $gt: 0 } },
      { $inc: { likesCount: -1 } }
    )
    await LikeModel.deleteMany({ user: user._id })
  }

  // 3. Bình luận họ viết ở bài người khác (bình luận gốc bị xoá thì phần trả lời cũng mất)
  const comments = await CommentModel.find({ author: user._id }).select('_id').lean()
  for (const comment of comments) {
    try {
      await commentService.deleteComment(admin, comment._id)
    } catch (err) {
      if (err.statusCode !== 404) throw err // 404: đã bị xoá cùng bình luận gốc
    }
  }

  // 4. Ảnh đại diện + tài khoản
  await deleteImages([`social/avatars/${user._id}`]).catch(() => {})
  await user.deleteOne()

  return { deletedPosts: posts.length, deletedComments: comments.length, deletedLikes: likes.length }
}

/* ------------------------------ posts ------------------------------ */

const listPosts = async (query = {}) => {
  const paging = parsePaging(query)
  const filter = {}

  const regex = toSearchRegex(query.search)
  if (regex) filter.content = regex

  if (query.author !== undefined) {
    assertObjectId(query.author, 'ID tác giả không hợp lệ')
    filter.author = query.author
  }

  const sort = parseSort(query, ['createdAt', 'likesCount', 'commentsCount'])

  const [rows, total] = await Promise.all([
    PostModel.find(filter)
      .sort(sort)
      .skip(paging.skip)
      .limit(paging.limit)
      .populate('author', 'username displayName avatar email isActive')
      .lean(),
    PostModel.countDocuments(filter),
  ])

  return {
    posts: rows.map((post) => ({ ...post, __v: undefined, commentsCount: post.commentsCount || 0 })),
    pagination: buildPagination(paging, total),
  }
}

const deletePost = async (admin, id) => {
  assertObjectId(id)
  await postService.deletePost(admin, id)
}

/* ----------------------------- comments ---------------------------- */

const listComments = async (query = {}) => {
  const paging = parsePaging(query)
  const filter = {}

  const regex = toSearchRegex(query.search)
  if (regex) filter.content = regex

  if (query.post !== undefined) {
    assertObjectId(query.post, 'ID bài viết không hợp lệ')
    filter.post = query.post
  }
  if (query.author !== undefined) {
    assertObjectId(query.author, 'ID tác giả không hợp lệ')
    filter.author = query.author
  }

  const sort = parseSort(query, ['createdAt'])

  const [rows, total] = await Promise.all([
    CommentModel.find(filter)
      .sort(sort)
      .skip(paging.skip)
      .limit(paging.limit)
      .populate('author', 'username displayName avatar')
      .populate('post', 'content')
      .lean(),
    CommentModel.countDocuments(filter),
  ])

  return {
    comments: rows.map(({ post, ...c }) => ({
      ...c,
      __v: undefined,
      post: post ? { _id: post._id, content: (post.content || '').slice(0, 100) } : null,
    })),
    pagination: buildPagination(paging, total),
  }
}

const deleteComment = async (admin, id) => commentService.deleteComment(admin, id)

/* ------------------------------ tracks ----------------------------- */

const listTracks = async (query = {}) => {
  const paging = parsePaging(query)
  const filter = {}

  const regex = toSearchRegex(query.search)
  if (regex) filter.$or = [{ title: regex }, { artist: regex }]

  const isActive = parseBool(query.isActive)
  if (isActive !== undefined) filter.isActive = isActive
  if (typeof query.mood === 'string') filter.moods = query.mood
  if (typeof query.genre === 'string') filter.genres = query.genre

  const sort = parseSort(query, ['createdAt', 'title', 'artist', 'energy'])

  const [tracks, total] = await Promise.all([
    TrackModel.find(filter).sort(sort).skip(paging.skip).limit(paging.limit),
    TrackModel.countDocuments(filter),
  ])
  return { tracks, pagination: buildPagination(paging, total) }
}

const createTrack = (data) => TrackModel.create(data)

const updateTrack = async (id, data) => {
  assertObjectId(id)
  const track = await TrackModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
  if (!track) throw new ApiError(404, 'Bài nhạc không tồn tại')
  return track
}

const deleteTrack = async (id) => {
  assertObjectId(id)
  const track = await TrackModel.findByIdAndDelete(id)
  if (!track) throw new ApiError(404, 'Bài nhạc không tồn tại')
}

export const adminService = {
  getStats,
  listUsers, getUser, updateUser, deleteUser,
  listPosts, deletePost,
  listComments, deleteComment,
  listTracks, createTrack, updateTrack, deleteTrack,
}