import mongoose from 'mongoose'

const COLLECTION_NAME = 'likes'

const likeSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: COLLECTION_NAME,
  }
)


likeSchema.index({ post: 1, user: 1 }, { unique: true })

likeSchema.index({ user: 1, post: 1 })

const LikeModel = mongoose.model('Like', likeSchema)
export default LikeModel