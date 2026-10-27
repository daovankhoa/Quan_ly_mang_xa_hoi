import multer from 'multer'
import ApiError from '~/utils/ApiError'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) =>
    ALLOWED_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(new ApiError(422, 'Chỉ chấp nhận ảnh JPG, PNG hoặc WebP')),
})

export const uploadSingleImage = (fieldName) => (req, res, next) =>
  upload.single(fieldName)(req, res, (err) => {
    if (!err) return next()
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(422, 'Ảnh không được vượt quá 5MB'))
    }
    next(err)
  })

export const uploadMultipleImages = (fieldName, maxCount) => (req, res, next) =>
  upload.array(fieldName, maxCount)(req, res, (err) => {
    if (!err) return next()
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(422, 'Mỗi ảnh không được vượt quá 5MB'))
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new ApiError(422, `Chỉ được đăng tối đa ${maxCount} ảnh mỗi bài`))
    }
    next(err)
  })