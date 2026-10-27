import api from './api'

export const updateAvatar = (file) => {
  const formData = new FormData()
  formData.append('avatar', file)
  return api.put('/users/me/avatar', formData).then((res) => res.data)
}