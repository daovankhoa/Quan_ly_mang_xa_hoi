import { env } from '~/config/environment'

export const corsOptions = {
  origin: env.CLIENT_URL,
  optionsSuccessStatus: 200,
  credentials: true,
}