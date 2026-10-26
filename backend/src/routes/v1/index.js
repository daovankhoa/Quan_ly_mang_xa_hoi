import express from 'express'
import { authRoute } from '~/routes/v1/authRoute'

const v1Router = express.Router()

v1Router.use('/auth', authRoute)

export default v1Router