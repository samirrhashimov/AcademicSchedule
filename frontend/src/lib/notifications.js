const ENABLED_KEY = 'academic-schedule-notifications'
const LEAD_KEY = 'academic-schedule-notify-lead'

export const LEAD_OPTIONS = [5, 10, 15, 30]

export const notificationsEnabled = () => {
  try {
    return localStorage.getItem(ENABLED_KEY) === '1'
  } catch {
    return false
  }
}

export const setNotificationsEnabled = (on) => {
  try {
    localStorage.setItem(ENABLED_KEY, on ? '1' : '0')
  } catch {
    // yaddaş əlçatan deyilsə sessiya ilə qalır
  }
}

export const getLeadMinutes = () => {
  try {
    const value = Number(localStorage.getItem(LEAD_KEY))
    return LEAD_OPTIONS.includes(value) ? value : 10
  } catch {
    return 10
  }
}

export const setLeadMinutes = (value) => {
  try {
    localStorage.setItem(LEAD_KEY, String(value))
  } catch {
    // yaddaş əlçatan deyilsə sessiya ilə qalır
  }
}
