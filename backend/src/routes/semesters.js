import { Router } from 'express'
import mongoose from 'mongoose'
import { requireAuth } from '../lib/auth.js'
import { Semester } from '../models/Semester.js'
import { Subject } from '../models/Subject.js'
import { WeekState } from '../models/WeekState.js'

const router = Router()

router.use(requireAuth)

const toDayKey = (date) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
)

const validId = (id) => mongoose.Types.ObjectId.isValid(id)

router.get('/', async (req, res, next) => {
  try {
    const list = await Semester.find({ userId: req.userId }).sort({ archivedAt: -1 }).lean()
    res.json(list.map((item) => ({
      id: String(item._id),
      name: item.name,
      subjectCount: Array.isArray(item.subjects) ? item.subjects.length : 0,
      archivedAt: item.archivedAt,
    })))
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(404).json({ error: 'Semestr tapılmadı.' })
    }
    const item = await Semester.findOne({ _id: req.params.id, userId: req.userId }).lean()
    if (!item) {
      return res.status(404).json({ error: 'Semestr tapılmadı.' })
    }
    res.json({
      id: String(item._id),
      name: item.name,
      subjects: Array.isArray(item.subjects) ? item.subjects : [],
      archivedAt: item.archivedAt,
    })
  } catch (error) {
    next(error)
  }
})

// Cari cədvəl + həftə rejimi arxivlənir, istifadəçi təmiz başlayır.
router.post('/archive', async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim().slice(0, 80)
    if (!name) {
      return res.status(400).json({ error: 'Semestr adı yaz.' })
    }
    const [subjects, states] = await Promise.all([
      Subject.find({ userId: req.userId }).lean(),
      WeekState.find({ userId: req.userId }).lean(),
    ])
    if (subjects.length === 0) {
      return res.status(400).json({ error: 'Arxivləmək üçün fənn yoxdur.' })
    }
    const semester = await Semester.create({
      userId: req.userId,
      name,
      subjects,
      weekState: states[0] || null,
    })
    await Subject.deleteMany({ userId: req.userId })
    await WeekState.deleteMany({ userId: req.userId })
    res.status(201).json({
      id: String(semester._id),
      name: semester.name,
      subjectCount: subjects.length,
      archivedAt: semester.archivedAt,
    })
  } catch (error) {
    next(error)
  }
})

// Bərpa cari cədvəli əvəzləyir — itməsin deyə əvvəlcə avtomatik arxivlənir.
router.post('/:id/restore', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(404).json({ error: 'Semestr tapılmadı.' })
    }
    const semester = await Semester.findOne({ _id: req.params.id, userId: req.userId }).lean()
    if (!semester) {
      return res.status(404).json({ error: 'Semestr tapılmadı.' })
    }
    const [current, states] = await Promise.all([
      Subject.find({ userId: req.userId }).lean(),
      WeekState.find({ userId: req.userId }).lean(),
    ])
    if (current.length > 0) {
      await Semester.create({
        userId: req.userId,
        name: `Bərpa öncəsi ${toDayKey(new Date())}`,
        subjects: current,
        weekState: states[0] || null,
      })
    }
    await Subject.deleteMany({ userId: req.userId })
    const archived = Array.isArray(semester.subjects) ? semester.subjects : []
    if (archived.length > 0) {
      await Subject.insertMany(archived.map((subject) => {
        const { __v, ...doc } = subject
        return { ...doc, userId: req.userId }
      }))
    }
    await WeekState.deleteMany({ userId: req.userId })
    if (semester.weekState) {
      const { _id, __v, ...rest } = semester.weekState
      await WeekState.create({ ...rest, userId: req.userId })
    }
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(404).json({ error: 'Semestr tapılmadı.' })
    }
    const item = await Semester.findOneAndDelete({ _id: req.params.id, userId: req.userId })
    if (!item) {
      return res.status(404).json({ error: 'Semestr tapılmadı.' })
    }
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
