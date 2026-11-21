const ENABLED_KEY = 'academic-schedule-notifications'
const LEAD_KEY = 'academic-schedule-notify-lead'

export const PRESET_LEADS = [
  { value: 15, label: '15 dəq' },
  { value: 30, label: '30 dəq' },
  { value: 60, label: '1 saat' },
  { value: 180, label: '3 saat' },
  { value: 720, label: '12 saat' },
  { value: 1440, label: '24 saat' },
]

export const MIN_LEAD = 5
export const MAX_LEAD = 1440
export const DEFAULT_LEAD = 30

export const isPresetLead = (value) => PRESET_LEADS.some((preset) => preset.value === value)

export const cleanLead = (value) => {
  const lead = Number(value)
  return Number.isInteger(lead) && lead >= MIN_LEAD && lead <= MAX_LEAD ? lead : null
}

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
    return cleanLead(localStorage.getItem(LEAD_KEY)) ?? DEFAULT_LEAD
  } catch {
    return DEFAULT_LEAD
  }
}

export const setLeadMinutes = (value) => {
  try {
    localStorage.setItem(LEAD_KEY, String(value))
  } catch {
    // yaddaş əlçatan deyilsə sessiya ilə qalır
  }
}
