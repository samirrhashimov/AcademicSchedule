import { useEffect } from 'react'

const isTypingTarget = (target) => {
  if (!target || !(target instanceof HTMLElement)) {
    return false
  }
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

// Modal açıq olanda və ya yazı yazılanda işləmir.
export const useGlobalShortcuts = (handlers) => {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }
      if (isTypingTarget(event.target)) {
        return
      }
      if (document.querySelector('[role="dialog"]')) {
        return
      }
      const handler = handlers[event.key]
      if (!handler) {
        return
      }
      if (event.key === '/' || event.key.startsWith('Arrow')) {
        event.preventDefault()
      }
      handler()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [handlers])
}
