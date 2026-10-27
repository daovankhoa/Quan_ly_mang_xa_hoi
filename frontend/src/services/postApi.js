import api from './api'

// Lấy một trang feed. cursor = _id của bài cuối cùng đã có (bỏ trống để lấy trang đầu)
export const getFeed = ({ cursor, limit = 10 } = {}) =>
  api.get('/posts', { params: { cursor, limit } }).then((res) => res.data)

export const createPost = ({ content, files = [], musicTrackId }, onUploadProgress) => {
  const formData = new FormData()
  formData.append('content', content)
  files.forEach((file) => formData.append('images', file))
  if (musicTrackId) formData.append('musicTrackId', musicTrackId)
  return api.post('/posts', formData, { onUploadProgress }).then((res) => res.data)
}

// Nhờ AI gợi ý nhạc từ ảnh + nội dung. Chưa lưu gì, chỉ trả về { tracks, analysis }.
// Gemini có thể mất vài giây nên cho timeout rộng hơn bình thường.
export const suggestMusic = ({ content = '', files = [] }) => {
  const formData = new FormData()
  if (content) formData.append('content', content)
  files.forEach((file) => formData.append('images', file))
  return api.post('/posts/suggest-music', formData, { timeout: 45 * 1000 }).then((res) => res.data)
}

export const likePost = (id) => api.put(`/posts/${id}/like`).then((res) => res.data)

export const unlikePost = (id) => api.delete(`/posts/${id}/like`).then((res) => res.data)

export const deletePost = (id) => api.delete(`/posts/${id}`).then((res) => res.data)