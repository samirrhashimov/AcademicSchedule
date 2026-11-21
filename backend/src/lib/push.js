import { User } from '../models/User.js'
import { Subject } from '../models/Subject.js'
import { WeekState } from '../models/WeekState.js'
import { getWeekNumber, mondayOfWeek, resolveWeekType, toDayKey } from './weeks.js'
import { getSequenceIndex, resolveLessonType } from './lessons.js'

// frontend/src/components/Dashboard.jsx-dakı days ilə eyni sıra (bazar ertəsi birinci).
const DAYS = [
  'Bazar ertəsi',
  'Çərşənbə axşamı',
  'Çərşənbə',
  'Cümə axşamı',
  'Cümə',
  'Şənbə',
  'Bazar',
]

const TYPE_LABELS = { lecture: 'Mühazirə', seminar: 'Seminar' }

const toMinutes = (time) => {
  const [hour, minute] = String(time).split(':').map(Number)
  return hour * 60 + (minute || 0)
}

const isConfigured = () => Boolean(process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_API_KEY)

// Ehtiyat dəyər (hesabında rəqəm olmayan köhnə istifadəçilər üçün).
const DEFAULT_LEAD = 10

// Gün dəyişəndə sıfırlanır. Server restart olsa təkrar göndərmə ola bilər.
const sent = { date: '', keys: new Set() }

const sendPush = async (userId, heading, content) => {
  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID,
      include_aliases: { external_id: [String(userId)] },
      target_channel: 'push',
      headings: { en: heading },
      contents: { en: content },
    }),
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`OneSignal ${response.status}: ${text.slice(0, 200)}`)
  }
}

export const checkDueLessons = async (now = new Date()) => {
  if (!isConfigured()) {
    return { checked: 0, pushed: 0 }
  }
  const dateKey = toDayKey(now)
  if (sent.date !== dateKey) {
    sent.date = dateKey
    sent.keys.clear()
  }
  const monday = mondayOfWeek(now)
  const weekNumber = getWeekNumber(monday)
  const dayName = DAYS[(now.getDay() + 6) % 7]
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const users = await User.find({}, { _id: 1, notifyLead: 1 }).lean()
  let pushed = 0
  for (const user of users) {
    try {
      const userId = String(user._id)
      const userLead = [5, 10, 15, 30].includes(Number(user.notifyLead)) ? Number(user.notifyLead) : DEFAULT_LEAD
      const [subjects, states] = await Promise.all([
        Subject.find({ userId }).lean(),
        WeekState.find({ userId }).lean(),
      ])
      const weekState = states[0] || null
      if (!weekState) {
        continue
      }
      const mode = resolveWeekType(weekState, monday).mode
      for (const subject of subjects) {
        const frequency = weekState.system === 'single' ? 'every-week' : subject.frequency
        if (frequency !== 'every-week' && frequency !== mode) {
          continue
        }
        const effective = { ...subject, frequency }
        subject.schedule.forEach((lesson, lessonIndex) => {
          if (lesson.day !== dayName) {
            return
          }
          const sequenceIndex = getSequenceIndex(effective, lessonIndex, weekNumber)
          const key = `${dateKey}-${userId}-${subject._id}-${sequenceIndex}`
          if (sent.keys.has(key)) {
            return
          }
          const diff = toMinutes(lesson.startTime) - nowMinutes
          if (diff < 0 || diff > userLead) {
            return
          }
          sent.keys.add(key)
          sendPush(
            userId,
            subject.name,
            `${lesson.startTime} • ${TYPE_LABELS[resolveLessonType(effective, sequenceIndex)]}`,
          ).then(() => {
            pushed += 1
            console.log(`Push göndərildi: ${subject.name} (${lesson.startTime})`)
          }).catch((error) => {
            sent.keys.delete(key)
            console.error(`Push göndərilmədi (${subject.name}):`, error.message || error)
          })
        })
      }
    } catch (error) {
      console.error('Push yoxlaması (istifadəçi):', error.message || error)
    }
  }
  return { checked: users.length, pushed }
}

export const startPushScheduler = () => {
  if (!isConfigured()) {
    console.log('OneSignal sazlanmayıb, push planlayıcı işləmir.')
    return
  }
  console.log('Push planlayıcı işləyir (hər dəqiqə).')
  setInterval(() => {
    checkDueLessons().catch((error) => {
      console.error('Push yoxlaması:', error.message || error)
    })
  }, 60 * 1000)
}
