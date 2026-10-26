import crypto from 'crypto'

export const generateRandomToken = (bytes = 32) =>
  crypto.randomBytes(bytes).toString('hex')

export const hashToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex')
