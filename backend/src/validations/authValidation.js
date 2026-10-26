import Joi from 'joi'
import ApiError from '~/utils/ApiError'

const MESSAGES = {
  'any.required': '{#label} là bắt buộc',
  'string.base':  '{#label} phải là chuỗi ký tự',
  'string.empty': '{#label} không được để trống',
  'string.min':   '{#label} phải có ít nhất {#limit} ký tự',
  'string.max':   '{#label} không được vượt quá {#limit} ký tự',
  'string.email': '{#label} không đúng định dạng',
}

const emailRule = Joi.string().trim().lowercase().email().required().label('Email')

const passwordRule = Joi.string()
  .min(8).max(72)
  .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  .required()
  .label('Mật khẩu')
  .messages({ 'string.pattern.base': 'Mật khẩu phải chứa cả chữ và số' })

const confirmPasswordRule = Joi.any()
  .valid(Joi.ref('password'))
  .required()
  .label('Xác nhận mật khẩu')
  .messages({ 'any.only': 'Mật khẩu xác nhận không khớp' })

const registerSchema = Joi.object({
  username: Joi.string().trim().lowercase().min(3).max(30)
    .pattern(/^[a-z0-9_.]+$/).required().label('Tên người dùng')
    .messages({ 'string.pattern.base': 'Tên người dùng chỉ gồm chữ, số, dấu _ và .' }),
  displayName:     Joi.string().trim().min(2).max(50).required().label('Tên hiển thị'),
  email:           emailRule,
  password:        passwordRule,
  confirmPassword: confirmPasswordRule,
})

const loginSchema = Joi.object({
  email:    emailRule,
  password: Joi.string().required().label('Mật khẩu'),
})

const forgotPasswordSchema = Joi.object({
  email: emailRule,
})

const resetPasswordSchema = Joi.object({
  password:        passwordRule,
  confirmPassword: confirmPasswordRule,
})

const validate = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly:   false,
    stripUnknown: true,
    errors:       { wrap: { label: false } },
    messages:     MESSAGES,
  })
  if (error) {
    return next(new ApiError(422, error.details.map((d) => d.message).join(', ')))
  }
  req.body = value
  next()
}

export const validateRegister       = validate(registerSchema)
export const validateLogin          = validate(loginSchema)
export const validateForgotPassword = validate(forgotPasswordSchema)
export const validateResetPassword  = validate(resetPasswordSchema)
