import { useState } from 'react'
import { FiCheck, FiDownload, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { buildBackup, downloadBackup } from '../lib/backup'
import { clearSession, getUser } from '../lib/auth'
import { createTemplate } from '../lib/api'
import { useEscapeKey } from '../lib/useEscapeKey'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'

const TTL_KEY = 'academic-schedule-template-ttl'
const TTL_OPTIONS = [
  { value: 7, label: '7 gün' },
  { value: 30, label: '30 gün' },
  { value: 90, label: '90 gün' },
  { value: 0, label: 'Həmişəlik' },
]

const readTtl = () => {
  try {
    const saved = Number(localStorage.getItem(TTL_KEY))
    return TTL_OPTIONS.some((option) => option.value === saved) ? saved : 30
  } catch {
    return 30
  }
}

const SettingsModal = ({ open, theme, onSelectTheme, weekSystem, weekState, subjects, onWeekSystemChange, onClose }) => {
  const navigate = useNavigate()
  const [shareState, setShareState] = useState(null)
  const [shareBusy, setShareBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [ttlDays, setTtlDays] = useState(readTtl)
  useLockBodyScroll(open)
  useEscapeKey(onClose, open)
  if (!open) {
    return null
  }

  const user = getUser()
  const handleLogout = () => {
    clearSession()
    onClose()
    navigate('/login', { replace: true })
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
    if (shareBusy || subjects.length === 0) {
      return
    }
    setShareBusy(true)
    setShareState(null)
    setCopied(false)
    try {
      const template = await createTemplate({ subjects, expiresInDays: ttlDays })
      setShareState({ ok: true, code: template.code })
    } catch (error) {
      setShareState({ ok: false, message: error.message || 'Paylaşma alınmadı.' })
    } finally {
      setShareBusy(false)
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
      className='modal-overlay-in fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-[20px]'
      role='dialog'
      aria-modal='true'
      aria-labelledby='settings-title'
    >
      <div className='modal-card-in w-full max-w-[420px] rounded-[14px] bg-[#FFF] p-[24px] text-[#333] shadow-xl dark:bg-[#2A2724] dark:text-[#E8E2D9]'>
        <div className='mb-[16px] flex items-center justify-between border-b border-[#EEE] pb-[16px] dark:border-[#4A4440]'>
          <h2 id='settings-title' className='text-[20px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Tənzimləmələr</h2>
          <button
            type='button'
            onClick={onClose}
            aria-label='Bağla'
            className='flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#F1EFE9] text-[18px] text-[#434140] hover:bg-[#E4E0D6] dark:bg-[#3A3632] dark:text-[#EDE8DF] dark:hover:bg-[#4A4440]'
          >
            <FiX aria-hidden='true' />
          </button>
        </div>
        <p className='mb-[10px] text-[14px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Görünüş</p>
        <div className='mb-[16px] flex overflow-hidden rounded-[8px] border border-[#D8D5CE] text-[14px] dark:border-[#4A4440]' role='group' aria-label='Rəng rejimi'>
          {[
            { value: 'light', label: 'Açıq' },
            { value: 'dark', label: 'Tünd' },
          ].map((option) => (
            <button
              key={option.value}
              type='button'
              onClick={() => onSelectTheme(option.value)}
              aria-pressed={theme === option.value}
              className={`flex-1 px-[10px] py-[10px] font-medium ${theme === option.value ? 'bg-[#A65B46] font-bold text-[#FFF]' : 'bg-[#FFF] text-[#434140] hover:bg-[#F7F3EC] dark:bg-[#2A2724] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className='mb-[10px] text-[14px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Həftə sistemi</p>
        <div className='mb-[16px] flex overflow-hidden rounded-[8px] border border-[#D8D5CE] text-[14px] dark:border-[#4A4440]' role='group' aria-label='Həftə sistemi'>
          {[
            { value: 'single', label: 'Tək həftə' },
            { value: 'double', label: 'Cüt həftə' },
          ].map((option) => (
            <button
              key={option.value}
              type='button'
              onClick={() => onWeekSystemChange(option.value)}
              aria-pressed={weekSystem === option.value}
              className={`flex-1 px-[10px] py-[10px] font-medium ${weekSystem === option.value ? 'bg-[#A65B46] font-bold text-[#FFF]' : 'bg-[#FFF] text-[#434140] hover:bg-[#F7F3EC] dark:bg-[#2A2724] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className='mb-[10px] text-[14px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Məlumat</p>
        <div className='mb-[10px] flex items-center justify-between gap-[12px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
          <div className='min-w-0'>
            <p className='truncate text-[14px] font-medium'>Yedəkləmə</p>
            <p className='truncate text-[12px] text-[#777] dark:text-[#A8A29E]'>{subjects.length} fənn</p>
          </div>
          <button
            type='button'
            onClick={() => downloadBackup(buildBackup(subjects, weekState))}
            className='flex shrink-0 items-center gap-[6px] rounded-[6px] bg-[#434140] px-[12px] py-[8px] text-[13px] font-medium text-[#E7D8C6] hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
          >
            <FiDownload aria-hidden='true' />
            Export
          </button>
        </div>
        <div className='mb-[16px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
          <div className='flex items-center justify-between gap-[12px]'>
            <div className='min-w-0'>
              <p className='truncate text-[14px] font-medium'>Şablon kimi paylaş</p>
              <p className='truncate text-[12px] text-[#777] dark:text-[#A8A29E]'>Kodla başqaları yükləsin</p>
            </div>
            <button
              type='button'
              onClick={handleShare}
              disabled={shareBusy || subjects.length === 0}
              className='shrink-0 rounded-[6px] bg-[#434140] px-[12px] py-[8px] text-[13px] font-medium text-[#E7D8C6] hover:bg-[#555250] disabled:opacity-60 dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
            >
              {shareBusy ? 'Gözlə…' : 'Paylaş'}
            </button>
          </div>
          <div className='mt-[10px] flex items-center justify-between gap-[12px]'>
            <p className='truncate text-[12px] text-[#777] dark:text-[#A8A29E]'>Saxlama müddəti</p>
            <div className='flex shrink-0 overflow-hidden rounded-[6px] border border-[#D8D5CE] text-[12px] dark:border-[#4A4440]' role='group' aria-label='Şablon saxlama müddəti'>
              {TTL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type='button'
                  onClick={() => handleTtlChange(option.value)}
                  aria-pressed={ttlDays === option.value}
                  title='Şablon nə qədər saxlanılsın'
                  className={`px-[8px] py-[6px] font-medium ${ttlDays === option.value ? 'bg-[#A65B46] font-bold text-[#FFF]' : 'bg-[#FFF] text-[#434140] hover:bg-[#F7F3EC] dark:bg-[#2A2724] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {shareState?.ok && (
            <button
              type='button'
              onClick={handleCopyCode}
              title='Kopyalamaq üçün kliklə'
              className='mt-[10px] flex w-full items-center justify-between rounded-[6px] bg-[#E3F1EC] px-[12px] py-[8px] text-[16px] font-bold tracking-[0.2em] text-[#477A68]'
            >
              {shareState.code}
              {copied ? <FiCheck aria-hidden='true' /> : <span className='text-[12px] font-medium'>Kopyala</span>}
            </button>
          )}
          {shareState && !shareState.ok && (
            <p className='mt-[10px] rounded-[6px] bg-[#FCE5E0] p-[8px] text-[13px] text-[#A65B46]'>{shareState.message}</p>
          )}
        </div>
        <p className='mb-[10px] text-[14px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Hesab</p>
        <div className='flex items-center justify-between gap-[12px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
          <div className='min-w-0'>
            <p className='truncate text-[14px] font-medium'>{user?.name || 'İstifadəçi'}</p>
            <p className='truncate text-[12px] text-[#777] dark:text-[#A8A29E]'>{user?.email || ''}</p>
          </div>
          <button
            type='button'
            onClick={handleLogout}
            className='shrink-0 rounded-[6px] bg-[#FCE5E0] px-[12px] py-[8px] text-[13px] font-medium text-[#A65B46] hover:bg-[#F6D9D2]'
          >
            Çıxış
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
