import jwt from 'jsonwebtoken'
import { env } from '~/config/environment'

export const generateAccessToken = (payload) =>
  jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
    algorithm: 'HS256',
  })

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.ACCESS_TOKEN_SECRET, { algorithms: ['HS256'] })
