import mongoose from 'mongoose'
import { env } from '~/config/environment'

export const connectDB = async () => {
  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.DATABASE_NAME,
  })
  // eslint-disable-next-line no-console
  console.log(`Connected to MongoDB: ${env.DATABASE_NAME}`)
}