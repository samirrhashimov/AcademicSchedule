import { normalizeSubject } from './subjects.js'
import {
  getWeekNumber,
  mondayOfWeek,
  normalizeWeekState,
  toDayKey,
} from './weeks.js'

// Backup formatı, versiya 1. Gələcək import bu formatı olduğu kimi oxuyacaq:
// { app, version, exportedAt, subjects, weekState }
export const BACKUP_VERSION = 1
export const BACKUP_APP = 'academic-schedule'

export const buildBackup = (subjects, weekState) => ({
  app: BACKUP_APP,
  version: BACKUP_VERSION,
  exportedAt: new Date().toISOString(),
  subjects: (subjects || []).map((subject) => normalizeSubject(subject)),
  weekState: normalizeWeekState(
    weekState,
    mondayOfWeek(new Date()),
    getWeekNumber(new Date()) % 2 === 0 ? 'upper-week' : 'lower-week',
  ),
})

export const parseBackup = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Backup faylı yanlış formatdadır.')
  }
  if (raw.app !== BACKUP_APP) {
    throw new Error('Bu backup faylı başqa tətbiq üçündür.')
  }
  if (raw.version !== BACKUP_VERSION) {
    throw new Error('Backup versiyası dəstəklənmir.')
  }
  if (!Array.isArray(raw.subjects)) {
    throw new Error('Backup-da fənn siyahısı yoxdur.')
  }
  return {
    subjects: raw.subjects.map((subject) => normalizeSubject(subject)),
    weekState: normalizeWeekState(
      raw.weekState,
      mondayOfWeek(new Date()),
      getWeekNumber(new Date()) % 2 === 0 ? 'upper-week' : 'lower-week',
    ),
  }
}

export const backupFileName = (date = new Date()) => `${BACKUP_APP}-${toDayKey(date)}.json`

export const downloadBackup = (backup) => {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = backupFileName()
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
