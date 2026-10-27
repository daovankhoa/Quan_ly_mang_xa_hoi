import api from './api'

// Lấy một trang feed. cursor = _id của bài cuối cùng đã có (bỏ trống để lấy trang đầu)
export const getFeed = ({ cursor, limit = 10 } = {}) =>
  api.get('/posts', { params: { cursor, limit } }).then((res) => res.data)

export const createPost = ({ content, files = [] }, onUploadProgress) => {
  const formData = new FormData()
  formData.append('content', content)
  files.forEach((file) => formData.append('images', file))
  return api.post('/posts', formData, { onUploadProgress }).then((res) => res.data)
}

export const likePost = (id) => api.put(`/posts/${id}/like`).then((res) => res.data)

export const unlikePost = (id) => api.delete(`/posts/${id}/like`).then((res) => res.data)

export const deletePost = (id) => api.delete(`/posts/${id}`).then((res) => res.data)