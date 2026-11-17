import { Router } from 'express'
import { requireAuth } from '../lib/auth.js'
import { WeekState } from '../models/WeekState.js'

const router = Router()

router.use(requireAuth)

const sanitize = (input) => {
  const value = input && typeof input === 'object' ? input : {}
  return {
    anchorWeekStart: typeof value.anchorWeekStart === 'string' ? value.anchorWeekStart : '',
    anchorMode: value.anchorMode,
    overrides: value.overrides && typeof value.overrides === 'object' ? value.overrides : {},
    system: value.system,
  }
}

router.get('/', async (req, res, next) => {
  try {
    const state = await WeekState.findOne({
      key: 'default',
      ...({ $or: [{ userId: req.userId }, { userId: { $exists: false } }] }),
    })
    if (!state) {
      return res.status(404).json({ error: 'not-found' })
    }
    res.json(state)
  } catch (error) {
    next(error)
  }
})

router.put('/', async (req, res, next) => {
  try {
    // Köhnə sahibsiz sənəd varsa, onu mənimsə (miqrasiya itkisiz keçir).
    let state = await WeekState.findOneAndUpdate(
      { key: 'default', userId: req.userId },
      { $set: sanitize(req.body) },
      { new: true, runValidators: true },
    )
    if (!state) {
      state = await WeekState.findOneAndUpdate(
        { key: 'default', userId: { $exists: false } },
        { $set: { ...sanitize(req.body), userId: req.userId } },
        { new: true, runValidators: true },
      )
    }
    if (!state) {
      state = await WeekState.create({
        key: 'default',
        userId: req.userId,
        ...sanitize(req.body),
      })
    }
    res.json(state)
  } catch (error) {
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ error: 'Məlumat yanlışdır.' })
    }
    next(error)
  }
})

export default router
