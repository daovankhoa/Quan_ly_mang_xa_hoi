/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import { connectDB } from '~/config/mongodb'
import TrackModel from '~/models/Track.model'

const DATA_FILE = path.resolve(process.cwd(), 'src/data/tracks.json')

const run = async () => {
  const tracks = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  await connectDB()

  // Upsert theo (title + artist): chạy lại nhiều lần không bị trùng, sửa JSON rồi chạy lại là cập nhật
  for (const track of tracks) {
    await TrackModel.findOneAndUpdate(
      { title: track.title, artist: track.artist },
      { $set: track },
      { upsert: true, runValidators: true }
    )
    console.log(`✔ ${track.title}`)
  }

  console.log(`Xong: ${tracks.length} bài trong kho nhạc.`)
  await mongoose.disconnect()
}

run().catch(async (err) => {
  console.error('Seed thất bại:', err.message)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})