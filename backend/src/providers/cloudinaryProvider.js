import { v2 as cloudinary } from 'cloudinary'
import { env } from '~/config/environment'

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key:    env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

export const uploadImageBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', ...options },
      (error, result) => (error ? reject(error) : resolve(result))
    )
    stream.end(buffer)
  })

export const deleteImages = async (publicIds = []) => {
  if (!publicIds.length) return
  await cloudinary.api.delete_resources(publicIds, { resource_type: 'image', invalidate: true })
}