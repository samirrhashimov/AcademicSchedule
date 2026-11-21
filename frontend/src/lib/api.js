import { clearSession, getToken } from './auth'
import { unlinkPushUser } from './onesignal'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const request = async (path, options = {}) => {
  let response
  try {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
    const token = getToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    response = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('Servərə qoşulmaq olmadı. Backend işləyirmi?')
  }
  if (response.status === 204) {
    return null
  }
  const data = await response.json().catch(() => ({}))
  if (response.status === 401) {
    unlinkPushUser()
    clearSession()
    const path = window.location.pathname
    if (!path.startsWith('/login') && !path.startsWith('/register')) {
      window.location.assign('/login')
    }
    throw new Error(data?.error || 'Sessiya bitib, yenidən daxil ol.')
  }
  if (!response.ok) {
    throw new Error(data?.error || `Sorğu alınmadı (${response.status})`)
  }
  return data
}

export const register = (payload) => request('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify(payload),
})

export const login = (payload) => request('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify(payload),
})

export const forgotPassword = (email) => request('/api/auth/forgot-password', {
  method: 'POST',
  body: JSON.stringify({ email }),
})

export const resetPassword = (payload) => request('/api/auth/reset-password', {
  method: 'POST',
  body: JSON.stringify(payload),
})

export const changePassword = (payload) => request('/api/auth/password', {
  method: 'PUT',
  body: JSON.stringify(payload),
})

export const deleteAccount = (password) => request('/api/auth/me', {
  method: 'DELETE',
  body: JSON.stringify({ password }),
})

export const fetchNotifyLead = () => request('/api/auth/notify-lead')

export const saveNotifyLead = (lead) => request('/api/auth/notify-lead', {
  method: 'PUT',
  body: JSON.stringify({ lead }),
})

export const fetchTemplate = (code) => request(`/api/templates/${encodeURIComponent(code)}`)

export const fetchTemplatePreview = (code) => request(`/api/templates/${encodeURIComponent(code)}/preview`)

export const fetchMyTemplates = () => request('/api/templates/mine')

export const deleteTemplate = (code) => request(`/api/templates/${encodeURIComponent(code)}`, { method: 'DELETE' })

export const createTemplate = (payload) => request('/api/templates', {
  method: 'POST',
  body: JSON.stringify(payload),
})

export const fetchSubjects = () => request('/api/subjects')

export const createSubject = (subject) => request('/api/subjects', {
  method: 'POST',
  body: JSON.stringify(subject),
})

export const updateSubject = (id, subject) => request(`/api/subjects/${id}`, {
  method: 'PUT',
  body: JSON.stringify(subject),
})

export const deleteSubject = (id) => request(`/api/subjects/${id}`, { method: 'DELETE' })

export const importSubjects = (subjects) => request('/api/subjects/import', {
  method: 'POST',
  body: JSON.stringify({ subjects }),
})

export const fetchWeekState = async () => {
  try {
    return await request('/api/week-state')
  } catch (error) {
    if (error.message === 'not-found') {
      return null
    }
    throw error
  }
}

export const saveWeekState = (weekState) => request('/api/week-state', {
  method: 'PUT',
  body: JSON.stringify(weekState),
})
