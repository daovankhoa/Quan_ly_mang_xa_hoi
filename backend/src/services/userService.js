import ApiError from '~/utils/ApiError'
import UserModel from '~/models/User.model'
import { uploadImageBuffer } from '~/providers/cloudinaryProvider'

const updateAvatar = async (userId, file) => {
  if (!file) throw new ApiError(422, 'Vui lòng chọn ảnh')

  const result = await uploadImageBuffer(file.buffer, {
    folder: 'social/avatars',
    public_id: String(userId), // mỗi người 1 ảnh, upload lại sẽ ghi đè
    overwrite: true,
    invalidate: true,
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  })

  return UserModel.findByIdAndUpdate(
    userId,
    { avatar: result.secure_url },
    { new: true }
  )
}

export const userService = { updateAvatar }