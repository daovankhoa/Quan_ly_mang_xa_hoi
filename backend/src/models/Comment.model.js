import mongoose from 'mongoose'

const COLLECTION_NAME = 'comments'

export const MAX_COMMENT_CONTENT = 1000

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },


    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },


    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    content: {
      type: String,
      required: [true, 'Nội dung bình luận là bắt buộc'],
      trim: true,
      maxlength: [MAX_COMMENT_CONTENT, `Bình luận không được vượt quá ${MAX_COMMENT_CONTENT} ký tự`],
    },

    // Chỉ dùng cho bình luận gốc
    repliesCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)


commentSchema.index({ post: 1, parent: 1, _id: -1 })
commentSchema.index({ parent: 1, _id: 1 })

commentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v
    return ret
  },
})

const CommentModel = mongoose.model('Comment', commentSchema)
export default CommentModel