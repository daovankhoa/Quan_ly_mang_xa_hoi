import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { USER_ROLES } from '~/utils/constants'

const COLLECTION_NAME = 'users'

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Tên người dùng là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Tên người dùng phải có ít nhất 3 ký tự'],
      maxlength: [30, 'Tên người dùng không được vượt quá 30 ký tự'],
      match: [/^[a-z0-9_.]+$/, 'Tên người dùng chỉ gồm chữ thường, số, dấu _ và .'],
    },
    displayName: {
      type: String,
      required: [true, 'Tên hiển thị là bắt buộc'],
      trim: true,
      minlength: [2, 'Tên hiển thị phải có ít nhất 2 ký tự'],
      maxlength: [50, 'Tên hiển thị không được vượt quá 50 ký tự'],
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email không đúng định dạng'],
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      minlength: [8, 'Mật khẩu phải có ít nhất 8 ký tự'],
      select: false,
    },
    avatar: { type: String, default: '' },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },
    isActive: { type: Boolean, default: true },

    lastLoginAt:       { type: Date },
    passwordChangedAt: { type: Date },

    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },

    refreshTokens: { type: [refreshTokenSchema], select: false, default: [] },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)

userSchema.index({ 'refreshTokens.tokenHash': 1 })
userSchema.index({ passwordResetToken: 1 }, { sparse: true })

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000)
})

userSchema.methods.comparePassword = function (inputPassword) {
  return bcrypt.compare(inputPassword, this.password)
}

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v
    delete ret.password
    delete ret.refreshTokens
    delete ret.passwordResetToken
    delete ret.passwordResetExpires
    delete ret.passwordChangedAt
    return ret
  },
})

const UserModel = mongoose.model('User', userSchema)
export default UserModel
