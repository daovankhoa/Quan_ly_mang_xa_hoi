import api from './api'


export const getComments = (postId, { cursor, limit = 10 } = {}) =>
  api.get(`/posts/${postId}/comments`, { params: { cursor, limit } }).then((res) => res.data)


export const getReplies = (commentId, { cursor, limit = 5 } = {}) =>
  api.get(`/comments/${commentId}/replies`, { params: { cursor, limit } }).then((res) => res.data)


export const createComment = (postId, { content, parentId }) =>
  api.post(`/posts/${postId}/comments`, { content, parentId }).then((res) => res.data)

export const deleteComment = (id) => api.delete(`/comments/${id}`).then((res) => res.data)