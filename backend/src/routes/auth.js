import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { rateLimit } from 'express-rate-limit'
import { User } from '../models/User.js'
import { Subject } from '../models/Subject.js'
import { WeekState } from '../models/WeekState.js'
import { Template } from '../models/Template.js'
import { requireAuth, signToken } from '../lib/auth.js'
import { sendResetEmail } from '../lib/mail.js'

const router = Router()

const publicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
})

const tooMany = (message) => (req, res) => {
  res.status(429).json({ error: message })
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  handler: tooMany('Çox cəhd etdin, bir az sonra yenidən yoxla.'),
})

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  handler: tooMany('Çox cəhd etdin, bir az sonra yenidən yoxla.'),
})

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

const frontendBase = () => String(process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim()

router.post('/register', authLimiter, async (req, res, next) => {
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

router.post('/login', authLimiter, async (req, res, next) => {
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

// Cavab həmişə eynidir — e-poçtun qeydiyyatda olub-olmadığı bilinməsin.
router.post('/forgot-password', forgotLimiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const done = () => res.json({ ok: true })
    if (!email) {
      return done()
    }
    const user = await User.findOne({ email })
    if (!user) {
      return done()
    }
    const token = crypto.randomBytes(32).toString('hex')
    user.resetTokenHash = hashToken(token)
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000)
    await user.save()
    try {
      await sendResetEmail(email, `${frontendBase()}/reset-password/${token}`)
    } catch (error) {
      user.resetTokenHash = null
      user.resetTokenExpires = null
      await user.save()
      return res.status(500).json({ error: error.message || 'E-poçt göndərilmədi.' })
    }
    return done()
  } catch (error) {
    next(error)
  }
})

router.post('/reset-password', forgotLimiter, async (req, res, next) => {
  try {
    const token = String(req.body?.token || '')
    const password = String(req.body?.password || '')
    if (!token || password.length < 6) {
      return res.status(400).json({ error: 'Link yanlışdır və ya şifrə qısadır (min 6 simvol).' })
    }
    const user = await User.findOne({
      resetTokenHash: hashToken(token),
      resetTokenExpires: { $gt: new Date() },
    })
    if (!user) {
      return res.status(400).json({ error: 'Link yanlışdır və ya vaxtı keçib.' })
    }
    user.passwordHash = await bcrypt.hash(password, 10)
    user.resetTokenHash = null
    user.resetTokenExpires = null
    await user.save()
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

router.put('/password', authLimiter, requireAuth, async (req, res, next) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '')
    const newPassword = String(req.body?.newPassword || '')
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Yeni şifrə ən azı 6 simvol olmalıdır.' })
    }
    const user = await User.findById(req.userId)
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ error: 'Cari şifrə səhvdir.' })
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10)
    await user.save()
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

const MIN_LEAD = 5
const MAX_LEAD = 1440

const cleanLead = (value) => {
  const lead = Number(value)
  return Number.isInteger(lead) && lead >= MIN_LEAD && lead <= MAX_LEAD ? lead : null
}

router.get('/notify-lead', authLimiter, requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).lean()
    res.json({ notifyLead: cleanLead(user?.notifyLead) ?? 30 })
  } catch (error) {
    next(error)
  }
})

router.put('/notify-lead', authLimiter, requireAuth, async (req, res, next) => {
  try {
    const lead = cleanLead(req.body?.lead)
    if (lead === null) {
      return res.status(400).json({ error: 'Vaxt 5 dəqiqə ilə 24 saat arasında olmalıdır.' })
    }
    await User.updateOne({ _id: req.userId }, { notifyLead: lead })
    res.json({ notifyLead: lead })
  } catch (error) {
    next(error)
  }
})

router.delete('/me', authLimiter, requireAuth, async (req, res, next) => {
  try {
    const password = String(req.body?.password || '')
    const user = await User.findById(req.userId)
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Şifrə səhvdir.' })
    }
    await Subject.deleteMany({ userId: req.userId })
    await WeekState.deleteMany({ userId: req.userId })
    await Template.deleteMany({ createdBy: req.userId })
    await User.deleteOne({ _id: req.userId })
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
