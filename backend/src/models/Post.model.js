import mongoose from 'mongoose'

const COLLECTION_NAME = 'posts'

export const MAX_POST_IMAGES = 10
export const MAX_POST_CONTENT = 2000

const imageSchema = new mongoose.Schema(
  {
    url:      { type: String, required: true },
    publicId: { type: String, required: true },
    width:    { type: Number },
    height:   { type: Number },
  },
  { _id: false }
)
const musicSchema = new mongoose.Schema(
  {
    track:    { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
    title:    { type: String, required: true },
    artist:   { type: String, required: true },
    audioUrl: { type: String, required: true },
  },
  { _id: false }
)

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
      maxlength: [MAX_POST_CONTENT, `Nội dung không được vượt quá ${MAX_POST_CONTENT} ký tự`],
    },
    images: { type: [imageSchema], default: [] },
    music: { type: musicSchema, default: null },

    // Số liệu được lưu sẵn để load feed không phải đếm lại mỗi lần
    likesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 }, // gồm cả bình luận gốc lẫn trả lời
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)


postSchema.index({ author: 1, _id: -1 })

postSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v
    return ret
  },
})

const PostModel = mongoose.model('Post', postSchema)
export default PostModel