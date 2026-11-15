import { useEffect } from 'react'

// Modal/dialoq açıq olanda ESC onu bağlayır.
// Enter artıq formanın özündən işləyir (submit / fokuslu düymə).
export const useEscapeKey = (onClose, active = true) => {
  useEffect(() => {
    if (!active) {
      return undefined
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [active, onClose])
}
