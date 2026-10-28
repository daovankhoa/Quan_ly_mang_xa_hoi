import express from 'express'
import { authRoute } from '~/routes/v1/authRoute'
import { userRoute } from '~/routes/v1/userRoute'
import { postRoute } from '~/routes/v1/postRoute'
import { commentRoute } from '~/routes/v1/commentRoute'
import { adminRoute } from '~/routes/v1/adminRoute'

const v1Router = express.Router()

v1Router.use('/auth', authRoute)
v1Router.use('/users', userRoute)
v1Router.use('/posts', postRoute)
v1Router.use('/comments', commentRoute)
v1Router.use('/admin', adminRoute)

export default v1Router