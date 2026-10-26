import 'express-async-errors'
import http from 'http'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { env, isProduction } from '~/config/environment'
import { connectDB } from '~/config/mongodb'
import { corsOptions } from '~/config/cors'
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware'
import v1Router from '~/routes/v1/index'

const START_SERVER = async () => {
  await connectDB()

  const app = express()

  if (isProduction) app.set('trust proxy', 1)

  app.use(helmet())
  app.use(cors(corsOptions))
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())

  app.use('/api/v1', v1Router)
  app.get('/health', (_req, res) => res.json({ status: 'OK' }))

  app.use(errorHandlingMiddleware)

  const httpServer = http.createServer(app)

  httpServer.listen(env.APP_PORT, env.APP_HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running at http://${env.APP_HOST}:${env.APP_PORT}`)
  })
}

START_SERVER()
