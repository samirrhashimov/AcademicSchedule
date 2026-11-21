import { User } from '../models/User.js'
import { Subject } from '../models/Subject.js'
import { WeekState } from '../models/WeekState.js'
import { PushLog } from '../models/PushLog.js'
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

// Ehtiyat dəyər (rəqəmi saxlanmamış köhnə hesablar üçün).
const DEFAULT_LEAD = 30

const isConfigured = () => Boolean(process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_API_KEY)

// Bu gün + sabah: 24 saatlıq lead sabahki dərsləri də tutur.
// Hər günün öz həftə konteksti var (bazar→bazar ertəsi həftəni dəyişir).
export const dayContexts = (now) => [0, 1].map((offset) => {
  const date = new Date(now)
  date.setDate(now.getDate() + offset)
  const monday = mondayOfWeek(date)
  return {
    date,
    dateKey: toDayKey(date),
    dayName: DAYS[(date.getDay() + 6) % 7],
    monday,
    weekNumber: getWeekNumber(monday),
  }
})

export const minutesUntilLesson = (dayDate, startTime, now) => {
  const midnight = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate())
  const [hour, minute] = String(startTime).split(':').map(Number)
  return (midnight.getTime() / 60000 + hour * 60 + (minute || 0)) - (now.getTime() / 60000)
}

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
  const data = await response.json().catch(() => ({}))
  return Number(data?.recipients) || 0
}

export const checkDueLessons = async (now = new Date()) => {
  if (!isConfigured()) {
    return { checked: 0, pushed: 0 }
  }
  const contexts = dayContexts(now)
  const users = await User.find({}, { _id: 1, notifyLead: 1 }).lean()
  let pushed = 0
  for (const user of users) {
    try {
      const userId = String(user._id)
      const stored = Number(user.notifyLead)
      const userLead = Number.isInteger(stored) && stored >= 5 && stored <= 1440 ? stored : DEFAULT_LEAD
      const [subjects, states] = await Promise.all([
        Subject.find({ userId }).lean(),
        WeekState.find({ userId }).lean(),
      ])
      const weekState = states[0] || null
      if (!weekState) {
        continue
      }
      for (const context of contexts) {
        const mode = resolveWeekType(weekState, context.monday).mode
        for (const subject of subjects) {
          const frequency = weekState.system === 'single' ? 'every-week' : subject.frequency
          if (frequency !== 'every-week' && frequency !== mode) {
            continue
          }
          const effective = { ...subject, frequency }
          for (const [lessonIndex, lesson] of subject.schedule.entries()) {
            if (lesson.day !== context.dayName) {
              continue
            }
            const sequenceIndex = getSequenceIndex(effective, lessonIndex, context.weekNumber)
            const key = `${context.dateKey}-${userId}-${subject._id}-${sequenceIndex}`
            const diff = minutesUntilLesson(context.date, lesson.startTime, now)
            if (diff < 0 || diff > userLead) {
              continue
            }
            try {
              await PushLog.create({ key })
            } catch (error) {
              if (error?.code === 11000) {
                continue // artıq göndərilib
              }
              throw error
            }
            try {
              const recipients = await sendPush(
                userId,
                subject.name,
                `${lesson.startTime} • ${TYPE_LABELS[resolveLessonType(effective, sequenceIndex)]}`,
              )
              pushed += 1
              console.log(`Push göndərildi: ${subject.name} (${lesson.startTime}), alıcı: ${recipients}`)
              if (recipients === 0) {
                console.warn(`Push alıcısız qaldı (${subject.name}) — brauzer abunəliyi və ya hesab bağlantısı yoxdur.`)
              }
            } catch (error) {
              await PushLog.deleteOne({ key }).catch(() => {})
              console.error(`Push göndərilmədi (${subject.name}):`, error.message || error)
            }
          }
        }
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
