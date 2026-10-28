import Joi from 'joi'
import { validate } from '~/validations/authValidation'
import { MUSIC_MOODS, MUSIC_GENRES } from '~/models/Track.model'
import { USER_ROLES } from '~/utils/constants'

const httpUri = () => Joi.string().trim().uri({ scheme: ['http', 'https'] })

const updateUserSchema = Joi.object({
  role:        Joi.string().valid(...Object.values(USER_ROLES)).label('Vai trò'),
  isActive:    Joi.boolean().label('Trạng thái tài khoản'),
  displayName: Joi.string().trim().min(2).max(50).label('Tên hiển thị'),
}).min(1)

const trackFields = {
  title:       Joi.string().trim().max(200).label('Tên bài hát'),
  artist:      Joi.string().trim().max(200).label('Nghệ sĩ'),
  audioUrl:    httpUri().label('Link nhạc'),
  publicId:    Joi.string().trim().allow('').max(300).label('Public ID'),
  duration:    Joi.number().min(0).label('Thời lượng'),
  moods:       Joi.array().items(Joi.string().valid(...MUSIC_MOODS)).unique().label('Tâm trạng'),
  genres:      Joi.array().items(Joi.string().valid(...MUSIC_GENRES)).unique().label('Thể loại'),
  energy:      Joi.number().integer().min(1).max(5).label('Độ mạnh'),
  license:     Joi.string().trim().allow('').max(100).label('Giấy phép'),
  sourceUrl:   httpUri().allow('').label('Link nguồn'),
  attribution: Joi.string().trim().allow('').max(300).label('Ghi nguồn'),
  isActive:    Joi.boolean().label('Trạng thái'),
}

const createTrackSchema = Joi.object({
  ...trackFields,
  title:    trackFields.title.required(),
  artist:   trackFields.artist.required(),
  audioUrl: trackFields.audioUrl.required(),
})

const updateTrackSchema = Joi.object(trackFields).min(1)

export const validateUpdateUser = validate(updateUserSchema)
export const validateCreateTrack = validate(createTrackSchema)
export const validateUpdateTrack = validate(updateTrackSchema)