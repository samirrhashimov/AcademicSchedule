import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { User } from '../models/User.js'
import { signToken } from '../lib/auth.js'

const router = Router()

const publicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
})

router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim()
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')
    if (!name || !email || password.length < 6) {
      return res.status(400).json({ error: 'Ad, e-poçt və ən azı 6 simvolluq şifrə lazımdır.' })
    }
    const exists = await User.findOne({ email })
    if (exists) {
      return res.status(409).json({ error: 'Bu e-poçt artıq qeydiyyatdadır.' })
    }
    const passwordHash = await bcrypt.hash(password, 10)
    const user = new User({ name, email, passwordHash })
    const token = signToken(user._id)
    await user.save()
    res.status(201).json({ token, user: publicUser(user) })
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'Bu e-poçt artıq qeydiyyatdadır.' })
    }
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ error: 'Məlumat yanlışdır.' })
    }
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')
    if (!email || !password) {
      return res.status(400).json({ error: 'E-poçt və şifrə yaz.' })
    }
    const user = await User.findOne({ email })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'E-poçt və ya şifrə səhvdir.' })
    }
    res.json({ token: signToken(user._id), user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

export default router
