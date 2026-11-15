import { useEffect } from 'react'

// Modal açıq olanda arxa səhifənin scroll-u kilidlənir,
// yalnız modalın öz məzmunu sürüşür.
export const useLockBodyScroll = (active = true) => {
  useEffect(() => {
    if (!active) {
      return undefined
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [active])
}
