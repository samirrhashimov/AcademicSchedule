import { useEffect, useState } from 'react'
import { FiBell, FiCheck, FiClock, FiCopy, FiDownload, FiLayers, FiLock, FiLogOut, FiMoon, FiShare2, FiSun, FiTrash2, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { buildBackup, downloadBackup } from '../lib/backup'
import { clearSession, getUser } from '../lib/auth'
import { createTemplate, deleteAccount, saveNotifyLead } from '../lib/api'
import { MAX_LEAD, MIN_LEAD, PRESET_LEADS, cleanLead, getLeadMinutes, isPresetLead, notificationsEnabled, setLeadMinutes, setNotificationsEnabled } from '../lib/notifications'
import { isOneSignalConfigured, optInPush, optOutPush, unlinkPushUser } from '../lib/onesignal'
import { isInstallAvailable, onInstallAvailable, promptInstall } from '../lib/pwa'
import { useEscapeKey } from '../lib/useEscapeKey'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'
import ChangePasswordModal from './ChangePasswordModal'
import TemplatesModal from './TemplatesModal'

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

const SettingsModal = ({ open, theme, onSelectTheme, weekSystem, weekState, subjects, onWeekSystemChange, onClose }) => {
  const navigate = useNavigate()
  const [shareState, setShareState] = useState(null)
  const [shareBusy, setShareBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [ttlDays, setTtlDays] = useState(readTtl)
  const [shareName, setShareName] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [delConfirm, setDelConfirm] = useState(false)
  const [delPassword, setDelPassword] = useState('')
  const [delBusy, setDelBusy] = useState(false)
  const [delError, setDelError] = useState(null)
  const [notifOn, setNotifOn] = useState(notificationsEnabled)
  const [lead, setLead] = useState(getLeadMinutes)
  const [notifMsg, setNotifMsg] = useState(null)
  const [customOpen, setCustomOpen] = useState(false)
  const [customLead, setCustomLead] = useState(() => {
    const stored = getLeadMinutes()
    return isPresetLead(stored) ? '' : String(stored)
  })
  const [canInstall, setCanInstall] = useState(isInstallAvailable)
  useEffect(() => onInstallAvailable(setCanInstall), [])
  useLockBodyScroll(open && !showTemplates && !showPassword)
  useEscapeKey(onClose, open && !showTemplates && !showPassword)
  if (!open) {
    return null
  }

  const user = getUser()
  const handleLogout = () => {
    unlinkPushUser()
    clearSession()
    onClose()
    navigate('/login', { replace: true })
  }

  const handleDeleteAccount = async () => {
    if (delBusy || !delPassword) {
      return
    }
    setDelBusy(true)
    setDelError(null)
    try {
      await deleteAccount(delPassword)
      clearSession()
      onClose()
      navigate('/', { replace: true })
    } catch (error) {
      setDelError(error.message || 'Silinmədi.')
    } finally {
      setDelBusy(false)
    }
  }

  const handleNotifToggle = async () => {
    if (notifOn) {
      setNotificationsEnabled(false)
      setNotifOn(false)
      setNotifMsg(null)
      optOutPush()
      return
    }
    if (!isOneSignalConfigured()) {
      setNotifMsg('Push bildiriş sazlanmayıb.')
      return
    }
    const ok = await optInPush()
    if (ok) {
      setNotificationsEnabled(true)
      setNotifOn(true)
      setNotifMsg(null)
    } else {
      setNotifMsg('Brauzer ayarlarından bildirişə icazə ver.')
    }
  }

  const handleLeadChange = (value) => {
    setLeadMinutes(value)
    setLead(value)
    saveNotifyLead(value).catch(() => {})
  }

  const handleLeadSelect = (value) => {
    if (value === 'custom') {
      setCustomLead(isPresetLead(lead) ? '' : String(lead))
      setCustomOpen(true)
      return
    }
    setCustomOpen(false)
    setNotifMsg(null)
    handleLeadChange(Number(value))
  }

  const handleCustomApply = () => {
    const cleaned = cleanLead(customLead)
    if (cleaned === null) {
      setNotifMsg(`Dəqiqə ${MIN_LEAD} ilə ${MAX_LEAD} arasında olmalıdır.`)
      return
    }
    setCustomOpen(false)
    setNotifMsg(null)
    handleLeadChange(cleaned)
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
    const name = shareName.trim()
    if (shareBusy || subjects.length === 0 || !name) {
      return
    }
    setShareBusy(true)
    setShareState(null)
    setCopied(false)
    try {
      const template = await createTemplate({ name, subjects, expiresInDays: ttlDays })
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
      className='modal-overlay-in fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-0 sm:p-[20px]'
      role='dialog'
      aria-modal='true'
      aria-labelledby='settings-title'
    >
      <div className='modal-card-in flex h-full max-h-full w-full max-w-none flex-col rounded-none bg-[#FFF] p-[24px] text-[#333] shadow-xl sm:h-auto sm:max-h-[85vh] sm:max-w-[420px] sm:rounded-[14px] dark:bg-[#2A2724] dark:text-[#E8E2D9]'>
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
        <div className='overflow-y-auto pr-[4px]'>
        <p className='mb-[10px] text-[14px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Görünüş</p>
        <div className='mb-[16px] flex overflow-hidden rounded-[8px] border border-[#D8D5CE] text-[14px] dark:border-[#4A4440]' role='group' aria-label='Rəng rejimi'>
          {[
            { value: 'light', label: 'Açıq', icon: FiSun },
            { value: 'dark', label: 'Tünd', icon: FiMoon },
          ].map((option) => (
            <button
              key={option.value}
              type='button'
              onClick={() => onSelectTheme(option.value)}
              aria-pressed={theme === option.value}
              className={`flex flex-1 items-center justify-center gap-[6px] px-[10px] py-[10px] font-medium ${theme === option.value ? 'bg-[#A65B46] font-bold text-[#FFF]' : 'bg-[#FFF] text-[#434140] hover:bg-[#F7F3EC] dark:bg-[#2A2724] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'}`}
            >
              <option.icon aria-hidden='true' />
              {option.label}
            </button>
          ))}
        </div>
        <p className='mb-[10px] text-[14px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Həftə sistemi</p>
        <div className='mb-[16px] flex overflow-hidden rounded-[8px] border border-[#D8D5CE] text-[14px] dark:border-[#4A4440]' role='group' aria-label='Həftə sistemi'>
          {[
            { value: 'single', label: 'Tək həftə', numeral: 'I' },
            { value: 'double', label: 'Cüt həftə', numeral: 'II' },
          ].map((option) => (
            <button
              key={option.value}
              type='button'
              onClick={() => onWeekSystemChange(option.value)}
              aria-pressed={weekSystem === option.value}
              className={`flex flex-1 items-center justify-center gap-[6px] px-[10px] py-[10px] font-medium ${weekSystem === option.value ? 'bg-[#A65B46] font-bold text-[#FFF]' : 'bg-[#FFF] text-[#434140] hover:bg-[#F7F3EC] dark:bg-[#2A2724] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'}`}
            >
              <span aria-hidden='true' className='font-bold'>{option.numeral} -</span>
              {option.label}
            </button>
          ))}
        </div>
        <p className='mb-[10px] text-[14px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Bildirişlər</p>
        <div className='mb-[10px] flex items-center justify-between gap-[12px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
          <p className='truncate text-[14px] font-medium'>Dərs xatırlatması</p>
          <button
            type='button'
            onClick={handleNotifToggle}
            aria-pressed={notifOn}
            className='flex min-w-[96px] shrink-0 items-center justify-center gap-[6px] rounded-[6px] bg-[#434140] px-[12px] py-[8px] text-[13px] font-medium text-[#E7D8C6] hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
          >
            <FiBell aria-hidden='true' />
            {notifOn ? 'Aktiv' : 'Deaktiv'}
          </button>
        </div>
        <div className='mb-[10px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
          <div className='flex items-center justify-between gap-[12px]'>
            <p className='truncate text-[14px] font-medium'>Xəbərdarlıq vaxtı</p>
            <select
              value={isPresetLead(lead) && !customOpen ? lead : 'custom'}
              onChange={(event) => handleLeadSelect(event.target.value)}
              aria-label='Xəbərdarlıq vaxtı'
              className='min-w-[96px] shrink-0 rounded-[6px] border border-[#D8D5CE] bg-[#FFF] px-[8px] py-[6px] text-center text-[12px] font-medium text-[#434140] hover:bg-[#F7F3EC] dark:border-[#4A4440] dark:bg-[#2A2724] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'
            >
              {PRESET_LEADS.map((preset) => (
                <option key={preset.value} value={preset.value}>{preset.label}</option>
              ))}
              <option value='custom'>Xüsusi…</option>
            </select>
          </div>
          {(customOpen || !isPresetLead(lead)) && (
            <div className='mt-[8px] flex gap-[8px]'>
              <input
                type='number'
                min={MIN_LEAD}
                max={MAX_LEAD}
                value={customLead}
                onChange={(event) => setCustomLead(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleCustomApply()
                  }
                }}
                placeholder={`Dəqiqə (${MIN_LEAD}-${MAX_LEAD})`}
                aria-label='Xüsusi dəqiqə'
                className='w-full rounded-[6px] border border-[#D8D5CE] bg-[#FFF] px-[10px] py-[6px] text-[13px] text-[#434140] outline-none focus:border-[#A65B46] dark:border-[#4A4440] dark:bg-[#2A2724] dark:text-[#EDE8DF]'
              />
              <button
                type='button'
                onClick={handleCustomApply}
                className='shrink-0 rounded-[6px] bg-[#434140] px-[12px] py-[6px] text-[13px] font-medium text-[#E7D8C6] hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
              >
                OK
              </button>
            </div>
          )}
        </div>
        {notifMsg && (
          <p className='mb-[10px] rounded-[6px] bg-[#FCE5E0] p-[8px] text-[13px] text-[#A65B46]'>{notifMsg}</p>
        )}
        <p className='mb-[10px] text-[14px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Məlumat</p>
        {canInstall && (
          <div className='mb-[10px] flex items-center justify-between gap-[12px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
            <p className='truncate text-[14px] font-medium'>Tətbiqi yüklə</p>
            <button
              type='button'
              onClick={() => promptInstall()}
              className='flex min-w-[96px] shrink-0 items-center justify-center gap-[6px] rounded-[6px] bg-[#434140] px-[12px] py-[8px] text-[13px] font-medium text-[#E7D8C6] hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
            >
              <FiDownload aria-hidden='true' />
              Yüklə
            </button>
          </div>
        )}
        <div className='mb-[10px] flex items-center justify-between gap-[12px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
          <div className='min-w-0'>
            <p className='truncate text-[14px] font-medium'>Yedəkləmə</p>
            <p className='truncate text-[12px] text-[#777] dark:text-[#A8A29E]'>{subjects.length} fənn</p>
          </div>
          <button
            type='button'
            onClick={() => downloadBackup(buildBackup(subjects, weekState))}
            className='flex min-w-[96px] shrink-0 items-center justify-center gap-[6px] rounded-[6px] bg-[#434140] px-[12px] py-[8px] text-[13px] font-medium text-[#E7D8C6] hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
          >
            <FiDownload aria-hidden='true' />
            Xaric et
          </button>
        </div>
        <div className='mb-[16px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
          <div className='flex items-center justify-between gap-[12px]'>
            <div className='min-w-0'>
              <p className='truncate text-[14px] font-medium'>Şablon kimi paylaş</p>
            </div>
            <button
              type='button'
              onClick={handleShare}
              disabled={shareBusy || subjects.length === 0 || !shareName.trim()}
              className='flex min-w-[96px] shrink-0 items-center justify-center gap-[6px] rounded-[6px] bg-[#434140] px-[12px] py-[8px] text-[13px] font-medium text-[#E7D8C6] hover:bg-[#555250] disabled:opacity-60 dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
            >
              <FiShare2 aria-hidden='true' />
              {shareBusy ? 'Gözlə…' : 'Paylaş'}
            </button>
          </div>
          <input
            type='text'
            required
            value={shareName}
            onChange={(event) => setShareName(event.target.value)}
            placeholder='Şablon adı'
            maxLength={80}
            aria-label='Şablon adı'
            className='mt-[10px] w-full rounded-[6px] border border-[#D8D5CE] bg-[#FFF] px-[10px] py-[8px] text-[13px] text-[#434140] outline-none focus:border-[#A65B46] dark:border-[#4A4440] dark:bg-[#2A2724] dark:text-[#EDE8DF]'
          />
          <div className='mt-[10px] flex items-center justify-between gap-[12px]'>
            <label htmlFor='template-ttl' className='flex items-center gap-[4px] truncate text-[12px] text-[#777] dark:text-[#A8A29E]'>
              <FiClock aria-hidden='true' />
              Saxlama müddəti
            </label>
            <select
              id='template-ttl'
              value={ttlDays}
              onChange={(event) => handleTtlChange(Number(event.target.value))}
              title='Şablon nə qədər saxlanılsın'
              className='min-w-[96px] shrink-0 rounded-[6px] border border-[#D8D5CE] bg-[#FFF] px-[8px] py-[6px] text-center text-[12px] font-medium text-[#434140] hover:bg-[#F7F3EC] dark:border-[#4A4440] dark:bg-[#2A2724] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'
            >
              {TTL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {shareState?.ok && (
            <button
              type='button'
              onClick={handleCopyCode}
              title='Kopyalamaq üçün kliklə'
              className='mt-[10px] flex w-full items-center justify-between rounded-[6px] bg-[#E3F1EC] px-[12px] py-[8px] text-[16px] font-bold tracking-[0.2em] text-[#477A68]'
            >
              {shareState.code}
              {copied ? <FiCheck aria-hidden='true' /> : <FiCopy aria-hidden='true' />}
            </button>
          )}
          {shareState && !shareState.ok && (
            <p className='mt-[10px] rounded-[6px] bg-[#FCE5E0] p-[8px] text-[13px] text-[#A65B46]'>{shareState.message}</p>
          )}
        </div>
        <div className='mb-[16px] flex items-center justify-between gap-[12px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
          <div className='min-w-0'>
            <p className='truncate text-[14px] font-medium'>Şablonlarım</p>
          </div>
          <button
            type='button'
            onClick={() => setShowTemplates(true)}
            className='flex min-w-[96px] shrink-0 items-center justify-center gap-[6px] rounded-[6px] bg-[#434140] px-[12px] py-[8px] text-[13px] font-medium text-[#E7D8C6] hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
          >
            <FiLayers aria-hidden='true' />
            Aç
          </button>
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
            className='flex min-w-[96px] shrink-0 items-center justify-center gap-[6px] rounded-[6px] bg-[#FCE5E0] px-[12px] py-[8px] text-[13px] font-medium text-[#A65B46] hover:bg-[#F6D9D2]'
          >
            <FiLogOut aria-hidden='true' />
            Çıxış
          </button>
        </div>
        <div className='mt-[10px] flex items-center justify-between gap-[12px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
          <p className='truncate text-[14px] font-medium'>Şifrəni dəyişdir</p>
          <button
            type='button'
            onClick={() => setShowPassword(true)}
            className='flex min-w-[96px] shrink-0 items-center justify-center gap-[6px] rounded-[6px] bg-[#434140] px-[12px] py-[8px] text-[13px] font-medium text-[#E7D8C6] hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
          >
            <FiLock aria-hidden='true' />
            Dəyişdir
          </button>
        </div>
        <div className='mt-[10px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
          {!delConfirm ? (
            <div className='flex items-center justify-between gap-[12px]'>
              <p className='truncate text-[14px] font-medium'>Hesabı sil</p>
              <button
                type='button'
                onClick={() => setDelConfirm(true)}
                className='flex min-w-[96px] shrink-0 items-center justify-center gap-[6px] rounded-[6px] bg-[#FCE5E0] px-[12px] py-[8px] text-[13px] font-medium text-[#A65B46] hover:bg-[#F6D9D2]'
              >
                <FiTrash2 aria-hidden='true' />
                Sil
              </button>
            </div>
          ) : (
            <>
              <p className='mb-[8px] text-[13px] text-[#777] dark:text-[#A8A29E]'>Şifrəni yaz, hesab və bütün məlumatlar silinsin.</p>
              <input
                type='password'
                value={delPassword}
                onChange={(event) => setDelPassword(event.target.value)}
                placeholder='Şifrə'
                autoComplete='current-password'
                aria-label='Təsdiq üçün şifrə'
                className='w-full rounded-[6px] border border-[#D8D5CE] bg-[#FFF] px-[10px] py-[8px] text-[13px] text-[#434140] outline-none focus:border-[#A65B46] dark:border-[#4A4440] dark:bg-[#2A2724] dark:text-[#EDE8DF]'
              />
              <div className='mt-[8px] flex gap-[8px]'>
                <button
                  type='button'
                  onClick={() => {
                    setDelConfirm(false)
                    setDelPassword('')
                    setDelError(null)
                  }}
                  className='flex-1 rounded-[6px] border border-[#D8D5CE] py-[8px] text-[13px] font-medium text-[#434140] hover:bg-[#F7F3EC] dark:border-[#4A4440] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'
                >
                  Ləğv et
                </button>
                <button
                  type='button'
                  onClick={handleDeleteAccount}
                  disabled={delBusy || !delPassword}
                  className='flex-1 rounded-[6px] bg-[#A65B46] py-[8px] text-[13px] font-medium text-[#FFF] hover:bg-[#96503E] disabled:opacity-60'
                >
                  {delBusy ? 'Gözlə…' : 'Bəli, sil'}
                </button>
              </div>
              {delError && (
                <p className='mt-[8px] rounded-[6px] bg-[#FCE5E0] p-[8px] text-[13px] text-[#A65B46]'>{delError}</p>
              )}
            </>
          )}
        </div>
        </div>
      </div>
      {showTemplates && (
        <TemplatesModal open={showTemplates} onClose={() => setShowTemplates(false)} />
      )}
      {showPassword && (
        <ChangePasswordModal open={showPassword} onClose={() => setShowPassword(false)} />
      )}
    </div>
  )
}

export default SettingsModal
