import { useState } from 'react'
import { FiCheck, FiCopy, FiX } from 'react-icons/fi'
import QRCode from 'react-qr-code'
import { createTemplate } from '../lib/api'
import { useEscapeKey } from '../lib/useEscapeKey'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'

const TTL_KEY = 'academic-schedule-template-ttl'
const TTL_OPTIONS = [
  { value: 3, label: '3 gün' },
  { value: 7, label: '7 gün' },
  { value: 30, label: '30 gün' },
  { value: 90, label: '90 gün' },
  { value: 0, label: 'Həmişəlik' },
]

const readTtl = () => {
  try {
    const saved = Number(localStorage.getItem(TTL_KEY))
    return TTL_OPTIONS.some((option) => option.value === saved) ? saved : 7
  } catch {
    return 7
  }
}

const ShareTemplateModal = ({ open, onClose, subjects }) => {
  const [name, setName] = useState('')
  const [ttlDays, setTtlDays] = useState(readTtl)
  const [shareState, setShareState] = useState(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  useLockBodyScroll(open)
  useEscapeKey(onClose, open)
  if (!open) {
    return null
  }

  const handleTtlChange = (value) => {
    setTtlDays(value)
    try {
      localStorage.setItem(TTL_KEY, String(value))
    } catch {
      // yaddaş əlçatan deyilsə sessiya ilə qalır
    }
  }

  const handleShare = async () => {
    const clean = name.trim()
    if (busy || subjects.length === 0 || !clean) {
      return
    }
    setBusy(true)
    setShareState(null)
    setCopied(false)
    try {
      const template = await createTemplate({ name: clean, subjects, expiresInDays: ttlDays })
      setShareState({ ok: true, code: template.code })
    } catch (error) {
      setShareState({ ok: false, message: error.message || 'Paylaşma alınmadı.' })
    } finally {
      setBusy(false)
    }
  }

  const handleCopyCode = async () => {
    if (!shareState?.code) {
      return
    }
    try {
      await navigator.clipboard.writeText(shareState.code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      className='modal-overlay-in fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-0 sm:p-[20px]'
      role='dialog'
      aria-modal='true'
      aria-labelledby='share-template-title'
    >
      <div className='modal-card-in h-full w-full max-w-none overflow-y-auto rounded-none bg-[#FFF] p-[24px] text-[#333] shadow-xl sm:h-auto sm:max-w-[420px] sm:rounded-[14px] dark:bg-[#2A2724] dark:text-[#E8E2D9]'>
        <div className='mb-[16px] flex items-center justify-between border-b border-[#EEE] pb-[16px] dark:border-[#4A4440]'>
          <h2 id='share-template-title' className='text-[20px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Şablon kimi paylaş</h2>
          <button
            type='button'
            onClick={onClose}
            aria-label='Bağla'
            className='flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#F1EFE9] text-[18px] text-[#434140] hover:bg-[#E4E0D6] dark:bg-[#3A3632] dark:text-[#EDE8DF] dark:hover:bg-[#4A4440]'
          >
            <FiX aria-hidden='true' />
          </button>
        </div>
        {shareState?.ok ? (
          <div className='flex flex-col items-center gap-[12px]'>
            <div className='rounded-[8px] bg-[#FFF] p-[12px]'>
              <QRCode value={shareState.code} size={180} bgColor='#FFFFFF' fgColor='#434140' />
            </div>
            <button
              type='button'
              onClick={handleCopyCode}
              title='Kopyalamaq üçün kliklə'
              className='flex items-center gap-[6px] text-[16px] font-bold tracking-[0.2em] text-[#477A68]'
            >
              {shareState.code}
              {copied ? <FiCheck aria-hidden='true' /> : <FiCopy aria-hidden='true' />}
            </button>
            <button
              type='button'
              onClick={onClose}
              className='w-full rounded-[8px] bg-[#434140] py-[10px] text-[14px] font-medium text-[#E7D8C6] hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
            >
              Bağla
            </button>
          </div>
        ) : (
          <div className='flex flex-col gap-[12px]'>
            <label className='block'>
              <span className='mb-[6px] block text-[13px] font-semibold text-[#434140] dark:text-[#EDE8DF]'>Şablon adı</span>
              <input
                type='text'
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder='Məsələn: Kompüter mühəndisliyi'
                maxLength={80}
                autoFocus
                className='w-full rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] p-[10px] text-[14px] text-[#434140] outline-none focus:border-[#A65B46] dark:border-[#4A4440] dark:bg-[#201D1B] dark:text-[#E8E2D9]'
              />
            </label>
            <label className='block'>
              <span className='mb-[6px] block text-[13px] font-semibold text-[#434140] dark:text-[#EDE8DF]'>Saxlama müddəti</span>
              <select
                value={ttlDays}
                onChange={(event) => handleTtlChange(Number(event.target.value))}
                className='w-full rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] p-[10px] text-[14px] text-[#434140] outline-none focus:border-[#A65B46] dark:border-[#4A4440] dark:bg-[#201D1B] dark:text-[#E8E2D9]'
              >
                {TTL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type='button'
              onClick={handleShare}
              disabled={busy || subjects.length === 0 || !name.trim()}
              className='rounded-[8px] bg-[#434140] py-[10px] text-[14px] font-medium text-[#E7D8C6] hover:bg-[#555250] disabled:opacity-60 dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
            >
              {busy ? 'Gözlə…' : 'Paylaş'}
            </button>
            {subjects.length === 0 && (
              <p className='text-center text-[13px] text-[#777] dark:text-[#A8A29E]'>Paylaşmaq üçün fənn yoxdur.</p>
            )}
            {shareState && !shareState.ok && (
              <p className='rounded-[8px] bg-[#FCE5E0] p-[10px] text-[13px] text-[#A65B46]'>{shareState.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ShareTemplateModal
