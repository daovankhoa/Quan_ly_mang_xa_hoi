import mongoose from 'mongoose'
import ApiError from '~/utils/ApiError'
import PostModel from '~/models/Post.model'
import CommentModel, { MAX_COMMENT_CONTENT } from '~/models/Comment.model'
import { USER_ROLES } from '~/utils/constants'

const USER_FIELDS = 'username displayName avatar'
const COMMENTS_LIMIT = 10
const REPLIES_LIMIT = 5
const MAX_LIMIT = 20

const assertObjectId = (id, message = 'ID không hợp lệ') => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, message)
}

const parseLimit = (limit, fallback) =>
  Math.min(Math.max(parseInt(limit, 10) || fallback, 1), MAX_LIMIT)

const toCommentDTO = (c) => ({
  _id: c._id,
  post: c.post,
  parent: c.parent || null,
  author: c.author,
  replyTo: c.replyTo || null,
  content: c.content,
  repliesCount: c.repliesCount || 0,
  createdAt: c.createdAt,
})

const populateUsers = (query) =>
  query.populate('author', USER_FIELDS).populate('replyTo', USER_FIELDS)


const getComments = async (postId, { cursor, limit }) => {
  assertObjectId(postId)
  const size = parseLimit(limit, COMMENTS_LIMIT)

  const exists = await PostModel.exists({ _id: postId })
  if (!exists) throw new ApiError(404, 'Bài viết không tồn tại')

  const filter = { post: postId, parent: null }
  if (cursor) {
    assertObjectId(cursor, 'Cursor không hợp lệ')
    filter._id = { $lt: cursor }
  }

  const rows = await populateUsers(
    CommentModel.find(filter).sort({ _id: -1 }).limit(size + 1)
  ).lean()

  const hasMore = rows.length > size
  const comments = hasMore ? rows.slice(0, size) : rows

  return {
    comments: comments.map(toCommentDTO),
    hasMore,
    nextCursor: hasMore ? String(comments[comments.length - 1]._id) : null,
  }
}


const getReplies = async (commentId, { cursor, limit }) => {
  assertObjectId(commentId)
  const size = parseLimit(limit, REPLIES_LIMIT)

  const exists = await CommentModel.exists({ _id: commentId })
  if (!exists) throw new ApiError(404, 'Bình luận không tồn tại')

  const filter = { parent: commentId }
  if (cursor) {
    assertObjectId(cursor, 'Cursor không hợp lệ')
    filter._id = { $gt: cursor }
  }

  const rows = await populateUsers(
    CommentModel.find(filter).sort({ _id: 1 }).limit(size + 1)
  ).lean()

  const hasMore = rows.length > size
  const replies = hasMore ? rows.slice(0, size) : rows

  return {
    replies: replies.map(toCommentDTO),
    hasMore,
    nextCursor: hasMore ? String(replies[replies.length - 1]._id) : null,
  }
}


const createComment = async (user, postId, { content, parentId }) => {
  assertObjectId(postId)

  const text = (typeof content === 'string' ? content : '').trim()
  if (!text) throw new ApiError(422, 'Nội dung bình luận không được để trống')
  if (text.length > MAX_COMMENT_CONTENT) {
    throw new ApiError(422, `Bình luận không được vượt quá ${MAX_COMMENT_CONTENT} ký tự`)
  }

  const postExists = await PostModel.exists({ _id: postId })
  if (!postExists) throw new ApiError(404, 'Bài viết không tồn tại')

  let parent = null
  let replyTo = null

  if (parentId) {
    assertObjectId(parentId)
    const target = await CommentModel.findOne({ _id: parentId, post: postId }).select('author parent')
    if (!target) throw new ApiError(404, 'Bình luận cần trả lời không tồn tại')

    if (target.parent) {

      parent = target.parent
      replyTo = target.author
    } else {
      parent = target._id
    }
  }

  const comment = await CommentModel.create({
    post: postId,
    author: user._id,
    parent,
    replyTo,
    content: text,
  })

  await Promise.all([
    PostModel.updateOne({ _id: postId }, { $inc: { commentsCount: 1 } }),
    parent ? CommentModel.updateOne({ _id: parent }, { $inc: { repliesCount: 1 } }) : null,
  ])

  const saved = await populateUsers(CommentModel.findById(comment._id)).lean()
  return toCommentDTO(saved)
}


const deleteComment = async (user, commentId) => {
  assertObjectId(commentId)

  const comment = await CommentModel.findById(commentId)
  if (!comment) throw new ApiError(404, 'Bình luận không tồn tại')

  const post = await PostModel.findById(comment.post).select('author').lean()

  const isCommentOwner = String(comment.author) === String(user._id)
  const isPostOwner = !!post && String(post.author) === String(user._id)
  const isAdmin = user.role === USER_ROLES.ADMIN
  if (!isCommentOwner && !isPostOwner && !isAdmin) {
    throw new ApiError(403, 'Bạn không có quyền xoá bình luận này')
  }

  let removed = 1
  if (!comment.parent) {

    const { deletedCount } = await CommentModel.deleteMany({ parent: comment._id })
    removed += deletedCount
  } else {
    await CommentModel.updateOne(
      { _id: comment.parent, repliesCount: { $gt: 0 } },
      { $inc: { repliesCount: -1 } }
    )
  }

  await comment.deleteOne()

  if (post) {

    await PostModel.updateOne({ _id: comment.post }, [
      { $set: { commentsCount: { $max: [0, { $subtract: [{ $ifNull: ['$commentsCount', 0] }, removed] }] } } },
    ])
  }

  return { removed }
}

export const commentService = { getComments, getReplies, createComment, deleteComment }