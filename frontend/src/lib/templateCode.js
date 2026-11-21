// Skan olunmuş mətn ya düz kod, ya da ?template= parametrli link olur.
export const parseScannedCode = (text) => {
  const trimmed = String(text || '').trim()
  try {
    const param = new URL(trimmed).searchParams.get('template')
    if (param) {
      return param
    }
  } catch {
    // düz kod, elə qaytar
  }
  return trimmed
}
