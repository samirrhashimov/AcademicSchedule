export const VALID_WEEK_MODES = ['upper-week', 'lower-week']
export const VALID_WEEK_SYSTEMS = ['single', 'double']
export const WEEK_STORAGE_KEY = 'academic-schedule-week-mode'

export const otherMode = (mode) => (mode === 'upper-week' ? 'lower-week' : 'upper-week')

export const getWeekNumber = (date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  return Math.ceil((((date - firstDayOfYear) / 86400000) + firstDayOfYear.getDay() + 1) / 7)
}

export const toDayKey = (date) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
)

export const parseDayKey = (key) => {
  const [year, month, day] = String(key).split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }
  const date = new Date(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  return date
}

export const mondayOfWeek = (date) => {
  const monday = new Date(date)
  const day = monday.getDay()
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day))
  monday.setHours(0, 0, 0, 0)
  return monday
}

export const addWeeks = (monday, count) => new Date(monday.getTime() + (count * 7 * 86400000))

export const weeksBetween = (fromMonday, toMonday) => (
  Math.round((toMonday - fromMonday) / 604800000)
)

// Baza qayda: anchor həftədən uzaqlığın cütlüyünə görə növbələşmə.
export const baseModeForWeek = (anchorMonday, anchorMode, targetMonday) => {
  const elapsed = weeksBetween(anchorMonday, targetMonday)
  return ((elapsed % 2) + 2) % 2 === 0 ? anchorMode : otherMode(anchorMode)
}

// İstisna (əl ilə təyin) varsa o qazanır, yoxdursa baza qayda işləyir.
export const resolveWeekType = (weekState, targetMonday) => {
  const key = toDayKey(targetMonday)
  const override = weekState?.overrides?.[key]
  if (VALID_WEEK_MODES.includes(override)) {
    return { mode: override, isOverride: true }
  }
  return {
    mode: baseModeForWeek(
      parseDayKey(weekState.anchorWeekStart) || mondayOfWeek(new Date()),
      VALID_WEEK_MODES.includes(weekState.anchorMode) ? weekState.anchorMode : 'upper-week',
      targetMonday,
    ),
    isOverride: false,
  }
}

export const defaultWeekState = (anchorMonday, anchorMode) => ({
  anchorWeekStart: toDayKey(anchorMonday),
  anchorMode: VALID_WEEK_MODES.includes(anchorMode) ? anchorMode : 'upper-week',
  overrides: {},
  system: 'double',
})

export const loadWeekState = (fallbackMonday) => {
  const fallbackMode = getWeekNumber(fallbackMonday) % 2 === 0 ? 'upper-week' : 'lower-week'
  try {
    const saved = localStorage.getItem(WEEK_STORAGE_KEY)
    return normalizeWeekState(saved ? JSON.parse(saved) : null, fallbackMonday, fallbackMode)
  } catch (error) {
    console.error('Həftə rejimi localStorage-dan oxunmadı:', error)
    return defaultWeekState(fallbackMonday, fallbackMode)
  }
}

export const saveWeekState = (weekState) => {
  localStorage.setItem(WEEK_STORAGE_KEY, JSON.stringify(weekState))
}

// Köhnə {weekStart, mode} formatından miqrasiya; yararsız məlumatda baza dəyər.
export const normalizeWeekState = (raw, fallbackMonday, fallbackMode) => {
  const fallback = defaultWeekState(fallbackMonday, fallbackMode)
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return fallback
  }
  if (typeof raw.anchorWeekStart === 'string' && parseDayKey(raw.anchorWeekStart)) {
    const overrides = {}
    if (raw.overrides && typeof raw.overrides === 'object' && !Array.isArray(raw.overrides)) {
      for (const [key, value] of Object.entries(raw.overrides)) {
        if (parseDayKey(key) && VALID_WEEK_MODES.includes(value)) {
          overrides[key] = value
        }
      }
    }
    return {
      anchorWeekStart: raw.anchorWeekStart,
      anchorMode: VALID_WEEK_MODES.includes(raw.anchorMode) ? raw.anchorMode : fallback.anchorMode,
      overrides,
      system: VALID_WEEK_SYSTEMS.includes(raw.system) ? raw.system : 'double',
    }
  }
  if (typeof raw.weekStart === 'string' && parseDayKey(raw.weekStart)
    && VALID_WEEK_MODES.includes(raw.mode)) {
    return {
      anchorWeekStart: toDayKey(parseDayKey(raw.weekStart)),
      anchorMode: raw.mode,
      overrides: {},
      system: VALID_WEEK_SYSTEMS.includes(raw.system) ? raw.system : 'double',
    }
  }
  if (VALID_WEEK_MODES.includes(raw.mode)) {
    return { ...fallback, anchorMode: raw.mode }
  }
  return fallback
}

// mode null-dursa istisna silinir (avtoya qayıdış).
export const withWeekOverride = (weekState, targetMonday, mode) => {
  const key = toDayKey(targetMonday)
  const overrides = { ...(weekState.overrides || {}) }
  if (mode === null || mode === undefined) {
    delete overrides[key]
  } else if (VALID_WEEK_MODES.includes(mode)) {
    overrides[key] = mode
  }
  return { ...weekState, overrides }
}

// Həmişəlik: növbələşmə bu həftədən yeni sıra ilə davam edir (anchor köçür).
// Həmin həftənin istisnası artıq lazımsız olur, başqa həftələrinki qalır.
export const reanchorWeekState = (weekState, targetMonday, mode) => {
  if (!VALID_WEEK_MODES.includes(mode)) {
    return weekState
  }
  const key = toDayKey(targetMonday)
  const overrides = { ...(weekState.overrides || {}) }
  delete overrides[key]
  return { ...weekState, anchorWeekStart: key, anchorMode: mode, overrides }
}
