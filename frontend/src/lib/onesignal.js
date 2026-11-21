import OneSignal from 'react-onesignal'

const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || ''
let initPromise = null

export const isOneSignalConfigured = () => Boolean(APP_ID)

// StrictMode dev-də effekti iki dəfə işlədir — təkrar init olmasın.
export const initOneSignal = () => {
  if (!isOneSignalConfigured() || typeof window === 'undefined') {
    return Promise.resolve(false)
  }
  if (!initPromise) {
    initPromise = OneSignal.init({
      appId: APP_ID,
      allowLocalhostAsSecureOrigin: true,
      // PWA worker kökdədir — OneSignal ayrı scopeda qalır (köhnə abunələr pozulmur).
      serviceWorkerParam: { scope: '/push/onesignal/' },
    }).then(() => true).catch(() => false)
  }
  return initPromise
}

const readySdk = async () => {
  if (!isOneSignalConfigured()) {
    return null
  }
  const ok = await initOneSignal()
  return ok ? OneSignal : null
}

export const linkPushUser = async (userId) => {
  try {
    const sdk = await readySdk()
    if (sdk && userId) {
      await sdk.login(String(userId))
    }
  } catch {
    // push opsionaldır — xəta tətbiqi dayandırmır
  }
}

export const unlinkPushUser = async () => {
  try {
    const sdk = await readySdk()
    if (sdk) {
      await sdk.logout()
    }
  } catch {
    // sessiya onsuz da təmizlənir
  }
}

export const optInPush = async () => {
  try {
    const sdk = await readySdk()
    if (!sdk) {
      return false
    }
    await sdk.User.PushSubscription.optIn()
    return typeof Notification !== 'undefined' && Notification.permission === 'granted'
  } catch {
    return false
  }
}

export const optOutPush = async () => {
  try {
    const sdk = await readySdk()
    if (sdk) {
      await sdk.User.PushSubscription.optOut()
    }
  } catch {
    // artıq bağlıdır
  }
}
