import { userService } from '~/services/userService'
import { StatusCodes } from '~/utils/constants'

const updateAvatar = async (req, res) => {
  const user = await userService.updateAvatar(req.user._id, req.file)
  res.status(StatusCodes.OK).json({
    message: 'Cập nhật ảnh đại diện thành công!',
    user,
  })
}

export const userController = { updateAvatar }