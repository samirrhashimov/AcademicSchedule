import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { connectDb } from './db.js'
import authRouter from './routes/auth.js'
import subjectsRouter from './routes/subjects.js'
import weekStateRouter from './routes/weekState.js'

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET təyin edilməyib (backend/.env faylına bax).')
  process.exit(1)
}

const app = express()
const PORT = process.env.PORT || 5000
const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((origin) => origin.trim())

app.use(cors({ origin: origins }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})
app.use('/api/auth', authRouter)
app.use('/api/subjects', subjectsRouter)
app.use('/api/week-state', weekStateRouter)

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  console.error(error)
  res.status(500).json({ error: 'Server xətası.' })
})

connectDb()
  .then((dbName) => {
    app.listen(PORT, () => {
      console.log(`API ${PORT} portunda işləyir, DB: ${dbName}`)
    })
  })
  .catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })
