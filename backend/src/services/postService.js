import mongoose from 'mongoose'
import ApiError from '~/utils/ApiError'
import PostModel, { MAX_POST_CONTENT, MAX_POST_IMAGES } from '~/models/Post.model'
import LikeModel from '~/models/Like.model'
import CommentModel from '~/models/Comment.model'
import { uploadImageBuffer, deleteImages } from '~/providers/cloudinaryProvider'
import { USER_ROLES } from '~/utils/constants'

const AUTHOR_FIELDS = 'username displayName avatar'
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 20


const toPostDTO = (post, likedSet) => ({
  _id: post._id,
  author: post.author,
  content: post.content,
  images: post.images || [],
  likesCount: post.likesCount,
  commentsCount: post.commentsCount || 0,
  likedByMe: likedSet.has(String(post._id)),
  createdAt: post.createdAt,
})

const createPost = async (user, { content }, files = []) => {
  const text = (content || '').trim()

  if (!text && files.length === 0) {
    throw new ApiError(422, 'Bài viết cần có nội dung hoặc ít nhất một ảnh')
  }
  if (text.length > MAX_POST_CONTENT) {
    throw new ApiError(422, `Nội dung không được vượt quá ${MAX_POST_CONTENT} ký tự`)
  }
  if (files.length > MAX_POST_IMAGES) {
    throw new ApiError(422, `Chỉ được đăng tối đa ${MAX_POST_IMAGES} ảnh mỗi bài`)
  }

  // Upload song song; nếu có ảnh lỗi thì dọn các ảnh đã lên để không bị mồ côi trên Cloudinary
  const settled = await Promise.allSettled(
    files.map((file) =>
      uploadImageBuffer(file.buffer, {
        folder: 'social/posts',
        transformation: [
          { width: 1600, height: 1600, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      })
    )
  )

  const uploaded = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value)
  if (uploaded.length !== files.length) {
    await deleteImages(uploaded.map((u) => u.public_id)).catch(() => {})
    throw new ApiError(502, 'Tải ảnh lên thất bại. Vui lòng thử lại.')
  }

  const post = await PostModel.create({
    author: user._id,
    content: text,
    images: uploaded.map((u) => ({
      url: u.secure_url,
      publicId: u.public_id,
      width: u.width,
      height: u.height,
    })),
  })

  const { _id, username, displayName, avatar } = user
  return toPostDTO({ ...post.toObject(), author: { _id, username, displayName, avatar } }, new Set())
}


const getFeed = async (userId, { cursor, limit }) => {
  const size = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT)

  const filter = {}
  if (cursor) {
    if (!mongoose.isValidObjectId(cursor)) throw new ApiError(400, 'Cursor không hợp lệ')
    filter._id = { $lt: cursor }
  }


  const rows = await PostModel.find(filter)
    .sort({ _id: -1 })
    .limit(size + 1)
    .populate('author', AUTHOR_FIELDS)
    .lean()

  const hasMore = rows.length > size
  const posts = hasMore ? rows.slice(0, size) : rows

  const likes = await LikeModel.find({ user: userId, post: { $in: posts.map((p) => p._id) } })
    .select('post')
    .lean()
  const likedSet = new Set(likes.map((l) => String(l.post)))

  return {
    posts: posts.map((p) => toPostDTO(p, likedSet)),
    hasMore,
    nextCursor: hasMore ? String(posts[posts.length - 1]._id) : null,
  }
}

const likePost = async (userId, postId) => {
  const exists = await PostModel.exists({ _id: postId })
  if (!exists) throw new ApiError(404, 'Bài viết không tồn tại')

  try {
    await LikeModel.create({ post: postId, user: userId })
    await PostModel.updateOne({ _id: postId }, { $inc: { likesCount: 1 } })
  } catch (err) {
    if (err.code !== 11000) throw err // 11000 = đã like rồi, bỏ qua
  }

  const post = await PostModel.findById(postId).select('likesCount').lean()
  return { likedByMe: true, likesCount: post.likesCount }
}

const unlikePost = async (userId, postId) => {
  const post = await PostModel.findById(postId).select('likesCount').lean()
  if (!post) throw new ApiError(404, 'Bài viết không tồn tại')

  const { deletedCount } = await LikeModel.deleteOne({ post: postId, user: userId })
  let likesCount = post.likesCount
  if (deletedCount > 0) {
    const updated = await PostModel.findOneAndUpdate(
      { _id: postId, likesCount: { $gt: 0 } },
      { $inc: { likesCount: -1 } },
      { new: true }
    ).select('likesCount').lean()
    likesCount = updated ? updated.likesCount : 0
  }
  return { likedByMe: false, likesCount }
}

const deletePost = async (user, postId) => {
  const post = await PostModel.findById(postId)
  if (!post) throw new ApiError(404, 'Bài viết không tồn tại')

  const isOwner = String(post.author) === String(user._id)
  if (!isOwner && user.role !== USER_ROLES.ADMIN) {
    throw new ApiError(403, 'Bạn không có quyền xoá bài viết này')
  }

  await Promise.all([
    post.deleteOne(),
    LikeModel.deleteMany({ post: post._id }),
    CommentModel.deleteMany({ post: post._id }),
  ])

  await deleteImages(post.images.map((i) => i.publicId)).catch(() => {})
}

export const postService = { createPost, getFeed, likePost, unlikePost, deletePost }