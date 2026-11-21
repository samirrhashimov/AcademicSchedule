export const registerServiceWorker = () => {
  if (!import.meta.env.PROD || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

let deferredPrompt = null
const listeners = new Set()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event
    listeners.forEach((listener) => listener(true))
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    listeners.forEach((listener) => listener(false))
  })
}

export const onInstallAvailable = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const isInstallAvailable = () => Boolean(deferredPrompt)

export const promptInstall = async () => {
  if (!deferredPrompt) {
    return false
  }
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  listeners.forEach((listener) => listener(false))
  return outcome === 'accepted'
}
