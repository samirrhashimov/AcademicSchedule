import { Router } from 'express'
import { requireAuth } from '../lib/auth.js'
import { Subject } from '../models/Subject.js'
import { Template } from '../models/Template.js'

const router = Router()

router.use(requireAuth)

// Oxşar simvollar çıxarılıb (0/O, 1/I/L) — kod əl ilə yazılanda çaşqınlıq olmasın.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

const generateCode = (length = 6) => (
  Array.from(
    { length },
    () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)],
  ).join('')
)

const sanitizeLesson = (lesson) => ({
  day: String(lesson?.day || ''),
  startTime: String(lesson?.startTime || ''),
  endTime: String(lesson?.endTime || ''),
})

const sanitizeSubject = (subject) => ({
  name: String(subject?.name || ''),
  lectureCount: Number(subject?.lectureCount) || 0,
  seminarCount: Number(subject?.seminarCount) || 0,
  frequency: subject?.frequency,
  schedule: Array.isArray(subject?.schedule) ? subject.schedule.map(sanitizeLesson) : [],
  teacher: String(subject?.teacher || ''),
  room: String(subject?.room || ''),
  sequenceOffset: Number(subject?.sequenceOffset) || 0,
  overrides: subject?.overrides && typeof subject.overrides === 'object' ? subject.overrides : {},
})

router.post('/', async (req, res, next) => {
  try {
    const list = Array.isArray(req.body?.subjects) ? req.body.subjects : []
    if (list.length === 0) {
      return res.status(400).json({ error: 'Şablon üçün fənn yoxdur.' })
    }
    const cleaned = list.map(sanitizeSubject)
    for (const doc of cleaned) {
      try {
        await new Subject(doc).validate()
      } catch {
        return res.status(400).json({ error: 'Fənn məlumatı yanlışdır.' })
      }
    }
    const name = String(req.body?.name || '').trim().slice(0, 80) || 'Paylaşılan cədvəl'
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const template = await Template.create({
          code: generateCode(),
          name,
          subjects: cleaned,
          createdBy: req.userId,
        })
        return res.status(201).json({ code: template.code, name: template.name })
      } catch (error) {
        if (error?.code !== 11000) {
          throw error
        }
      }
    }
    return res.status(500).json({ error: 'Kod yaradıla bilmədi, yenidən cəhd et.' })
  } catch (error) {
    next(error)
  }
})

router.get('/:code', async (req, res, next) => {
  try {
    const code = String(req.params.code || '').trim().toUpperCase()
    if (!code) {
      return res.status(400).json({ error: 'Kod yaz.' })
    }
    const template = await Template.findOne({ code }).lean()
    if (!template) {
      return res.status(404).json({ error: 'Şablon tapılmadı.' })
    }
    res.json({ code: template.code, name: template.name, subjects: template.subjects || [] })
  } catch (error) {
    next(error)
  }
})

export default router
