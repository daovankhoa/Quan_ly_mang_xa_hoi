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

    // Số liệu được lưu sẵn để load feed không phải đếm lại mỗi lần
    likesCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)

// Phân trang feed theo _id giảm dần, và lấy bài theo tác giả (trang cá nhân sau này)
postSchema.index({ author: 1, _id: -1 })

postSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v
    return ret
  },
})

const PostModel = mongoose.model('Post', postSchema)
export default PostModel