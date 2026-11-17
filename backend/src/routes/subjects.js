import { Router } from 'express'
import { requireAuth } from '../lib/auth.js'
import { Subject } from '../models/Subject.js'

const router = Router()

router.use(requireAuth)

const stripIds = (input) => {
  if (!input || typeof input !== 'object') {
    return {}
  }
  const { id, _id, userId, ...rest } = input
  return rest
}

const sendValidationError = (res, error) => {
  if (error?.name === 'ValidationError') {
    return res.status(400).json({ error: 'Məlumat yanlışdır.' })
  }
  throw error
}

router.get('/', async (req, res, next) => {
  try {
    const subjects = await Subject.find({ userId: req.userId }).sort({ createdAt: 1 })
    res.json(subjects)
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const created = await Subject.create({
      ...stripIds(req.body),
      _id: req.body?.id,
      userId: req.userId,
    })
    res.status(201).json(created)
  } catch (error) {
    try {
      sendValidationError(res, error)
    } catch (fatal) {
      next(fatal)
    }
  }
})

router.post('/import', async (req, res, next) => {
  try {
    const list = Array.isArray(req.body?.subjects) ? req.body.subjects : []
    if (list.length === 0) {
      return res.status(400).json({ error: 'İdxal üçün fənn yoxdur.' })
    }
    const docs = list
      .filter((subject) => subject && typeof subject === 'object' && subject.id)
      .map((subject) => ({ ...stripIds(subject), _id: String(subject.id), userId: req.userId }))
    if (docs.length === 0) {
      return res.status(400).json({ error: 'İdxal üçün yararlı fənn yoxdur.' })
    }
    await Subject.bulkWrite(
      docs.map((doc) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: doc },
          upsert: true,
        },
      })),
      { ordered: false },
    )
    const created = await Subject.find({ _id: { $in: docs.map((doc) => doc._id) } })
    res.status(201).json(created)
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const updated = await Subject.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      stripIds(req.body),
      { new: true, runValidators: true },
    )
    if (!updated) {
      return res.status(404).json({ error: 'Fənn tapılmadı.' })
    }
    res.json(updated)
  } catch (error) {
    try {
      sendValidationError(res, error)
    } catch (fatal) {
      next(fatal)
    }
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const removed = await Subject.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    })
    if (!removed) {
      return res.status(404).json({ error: 'Fənn tapılmadı.' })
    }
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

export default router
