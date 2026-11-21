// frontend/src/lib/weeks.js-in server portu (brauzersiz hissə).
// Dəyişəndə hər iki faylı sinxron saxla.
export const VALID_WEEK_MODES = ['upper-week', 'lower-week']

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
