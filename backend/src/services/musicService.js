import TrackModel from '~/models/Track.model'

const DEFAULT_LIMIT = 3
const MAX_CANDIDATES = 500          // kho nhạc nhỏ nên đọc hết rồi chấm điểm trong bộ nhớ
const MOOD_WEIGHTS = [3, 2, 1]      // mood AI xếp đầu quan trọng hơn: 3 điểm, 2 điểm, 1 điểm
const GENRE_WEIGHT = 1              // mỗi thể loại trùng được 1 điểm
const MAX_ENERGY_POINTS = 2         // cùng độ mạnh +2, lệch 1 bậc +1, lệch từ 2 bậc trở lên +0
const TIE_BREAK_JITTER = 0.5        // xáo nhẹ các bài bằng điểm để không lúc nào cũng ra đúng 3 bài đó

/**
 * Chấm điểm một bài nhạc so với hồ sơ do AI đề xuất. Điểm càng cao càng hợp.
 * @param {{ moods?: string[], genres?: string[], energy?: number }} track
 * @param {{ moods?: string[], genres?: string[], energy?: number }} profile
 */
export const scoreTrack = (track, { moods = [], genres = [], energy = 3 }) => {
  const trackMoods = track.moods || []
  const trackGenres = track.genres || []

  let score = 0
  moods.forEach((mood, index) => {
    if (trackMoods.includes(mood)) score += MOOD_WEIGHTS[index] ?? 1
  })
  genres.forEach((genre) => {
    if (trackGenres.includes(genre)) score += GENRE_WEIGHT
  })
  score += Math.max(MAX_ENERGY_POINTS - Math.abs((track.energy ?? 3) - energy), 0)
  return score
}

// Chỉ trả về những trường frontend cần, không lộ trường nội bộ
const toTrackDTO = (track) => ({
  _id: track._id,
  title: track.title,
  artist: track.artist,
  audioUrl: track.audioUrl,
  duration: track.duration,
  moods: track.moods || [],
  genres: track.genres || [],
  energy: track.energy,
  attribution: track.attribution || '',
})

/**
 * Gợi ý các bài nhạc hợp nhất với hồ sơ AI.
 * @returns {Promise<Array>} tối đa `limit` bài, xếp từ hợp nhất xuống
 */
export const suggestTracks = async (profile, limit = DEFAULT_LIMIT) => {
  const tracks = await TrackModel.find({ isActive: true }).limit(MAX_CANDIDATES).lean()

  return tracks
    .map((track) => ({
      track,
      score: scoreTrack(track, profile) + Math.random() * TIE_BREAK_JITTER,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ track }) => toTrackDTO(track))
}

export const musicService = { suggestTracks, scoreTrack }