const TOKEN_KEY = 'academic-schedule-token'
const USER_KEY = 'academic-schedule-user'

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const getUser = () => {
  try {
    const saved = localStorage.getItem(USER_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export const saveSession = ({ token, user }) => {
  try {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    // yaddaş əlçatan deyilsə sessiya ilə qalır
  }
}

export const clearSession = () => {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    // sessiya onsuz da əlçatan deyil
  }
}
