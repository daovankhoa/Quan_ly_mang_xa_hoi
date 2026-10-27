import mongoose from 'mongoose'

const COLLECTION_NAME = 'tracks'

// Từ vựng đóng: AI (bước 2) CHỈ được chọn trong các giá trị này.
// Muốn thêm mood/genre mới thì thêm vào đây rồi gắn cho các bài nhạc tương ứng.
export const MUSIC_MOODS = [
  'happy',        // vui vẻ, tươi sáng
  'calm',         // bình yên, thư giãn
  'romantic',     // lãng mạn
  'energetic',    // sôi động, nhiều năng lượng
  'nostalgic',    // hoài niệm
  'melancholic',  // man mác, buồn nhẹ
  'epic',         // hùng vĩ, hoành tráng
  'playful',      // tinh nghịch, dễ thương
  'dreamy',       // mơ màng
  'mysterious',   // bí ẩn
]

export const MUSIC_GENRES = [
  'lofi', 'acoustic', 'pop', 'cinematic', 'electronic',
  'jazz', 'classical', 'ambient', 'hiphop', 'rock',
]

const trackSchema = new mongoose.Schema(
  {
    title:  { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },

    audioUrl: { type: String, required: true },   // link file mp3 (Cloudinary hoặc nguồn khác)
    publicId: { type: String, default: '' },      // public_id trên Cloudinary (để xoá về sau)
    duration: { type: Number, min: 0 },           // giây

    moods:  { type: [{ type: String, enum: MUSIC_MOODS }],  default: [] },
    genres: { type: [{ type: String, enum: MUSIC_GENRES }], default: [] },
    energy: { type: Number, min: 1, max: 5, default: 3 }, // 1 = rất nhẹ, 5 = rất mạnh

    // Thông tin bản quyền: bắt buộc phải rõ ràng vì nhạc sẽ phát công khai cho người dùng khác
    license:   { type: String, default: '' },     // vd: 'CC0', 'Pixabay License', 'CC BY 4.0'
    sourceUrl: { type: String, default: '' },     // trang gốc của bài nhạc
    attribution: { type: String, default: '' },   // dòng ghi nguồn nếu giấy phép yêu cầu

    isActive: { type: Boolean, default: true },   // tắt bài mà không cần xoá
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)

trackSchema.index({ title: 1, artist: 1 }, { unique: true })
trackSchema.index({ isActive: 1, moods: 1 })

trackSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v
    return ret
  },
})

const TrackModel = mongoose.model('Track', trackSchema)
export default TrackModel