import { useEffect, useState } from 'react'
import { FiArchive, FiBell, FiDownload, FiLayers, FiLock, FiLogOut, FiMoon, FiShare2, FiSun, FiTrash2, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { buildBackup, downloadBackup } from '../lib/backup'
import { clearSession, getUser } from '../lib/auth'
import { saveNotifyLead } from '../lib/api'
import { MAX_LEAD, MIN_LEAD, PRESET_LEADS, cleanLead, getLeadMinutes, isPresetLead, notificationsEnabled, setLeadMinutes, setNotificationsEnabled } from '../lib/notifications'
import { isOneSignalConfigured, optInPush, optOutPush, unlinkPushUser } from '../lib/onesignal'
import { isInstallAvailable, onInstallAvailable, promptInstall } from '../lib/pwa'
import { useEscapeKey } from '../lib/useEscapeKey'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'
import ChangePasswordModal from './ChangePasswordModal'
import DeleteAccountModal from './DeleteAccountModal'
import SemestersModal from './SemestersModal'
import ShareTemplateModal from './ShareTemplateModal'
import TemplatesModal from './TemplatesModal'

const SettingsModal = ({ open, theme, onSelectTheme, weekSystem, weekState, subjects, onWeekSystemChange, onClose }) => {
  const navigate = useNavigate()
  const [view, setView] = useState('root')
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
  useLockBodyScroll(open)
  useEscapeKey(onClose, open && view === 'root')
  if (!open) {
    return null
  }
  if (view === 'templates') {
    return <TemplatesModal open onClose={() => setView('root')} />
  }
  if (view === 'password') {
    return <ChangePasswordModal open onClose={() => setView('root')} />
  }
  if (view === 'delete') {
    return <DeleteAccountModal open onClose={() => setView('root')} />
  }
  if (view === 'share') {
    return <ShareTemplateModal open onClose={() => setView('root')} subjects={subjects} />
  }
  if (view === 'semesters') {
    return <SemestersModal open onClose={() => setView('root')} />
  }

  const user = getUser()
  const handleLogout = () => {
    unlinkPushUser()
    clearSession()
    onClose()
    navigate('/login', { replace: true })
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
        <div className='mb-[16px] flex items-center justify-between gap-[12px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
          <p className='truncate text-[14px] font-medium'>Şablon kimi paylaş</p>
          <button
            type='button'
            onClick={() => setView('share')}
            disabled={subjects.length === 0}
            className='flex min-w-[96px] shrink-0 items-center justify-center gap-[6px] rounded-[6px] bg-[#434140] px-[12px] py-[8px] text-[13px] font-medium text-[#E7D8C6] hover:bg-[#555250] disabled:opacity-60 dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
          >
            <FiShare2 aria-hidden='true' />
            Paylaş
          </button>
        </div>
        <div className='mb-[16px] flex items-center justify-between gap-[12px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
          <div className='min-w-0'>
            <p className='truncate text-[14px] font-medium'>Şablonlarım</p>
          </div>
          <button
            type='button'
            onClick={() => setView('templates')}
            className='flex min-w-[96px] shrink-0 items-center justify-center gap-[6px] rounded-[6px] bg-[#434140] px-[12px] py-[8px] text-[13px] font-medium text-[#E7D8C6] hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
          >
            <FiLayers aria-hidden='true' />
            Aç
          </button>
        </div>
        <div className='mb-[16px] flex items-center justify-between gap-[12px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
          <p className='truncate text-[14px] font-medium'>Semestrlər</p>
          <button
            type='button'
            onClick={() => setView('semesters')}
            className='flex min-w-[96px] shrink-0 items-center justify-center gap-[6px] rounded-[6px] bg-[#434140] px-[12px] py-[8px] text-[13px] font-medium text-[#E7D8C6] hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
          >
            <FiArchive aria-hidden='true' />
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
            className='flex min-w-[96px] shrink-0 items-center justify-center gap-[6px] rounded-[6px] bg-[#434140] px-[12px] py-[8px] text-[13px] font-medium text-[#E7D8C6] hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
          >
            <FiLogOut aria-hidden='true' />
            Çıxış
          </button>
        </div>
        <div className='mt-[10px] flex items-center justify-between gap-[12px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
          <p className='truncate text-[14px] font-medium'>Şifrəni dəyişdir</p>
          <button
            type='button'
            onClick={() => setView('password')}
            className='flex min-w-[96px] shrink-0 items-center justify-center gap-[6px] rounded-[6px] bg-[#434140] px-[12px] py-[8px] text-[13px] font-medium text-[#E7D8C6] hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
          >
            <FiLock aria-hidden='true' />
            Dəyişdir
          </button>
        </div>
        <div className='mt-[10px] flex items-center justify-between gap-[12px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
          <p className='truncate text-[14px] font-medium'>Hesabı sil</p>
          <button
            type='button'
            onClick={() => setView('delete')}
            className='flex min-w-[96px] shrink-0 items-center justify-center gap-[6px] rounded-[6px] bg-[#FCE5E0] px-[12px] py-[8px] text-[13px] font-medium text-[#A65B46] hover:bg-[#F6D9D2]'
          >
            <FiTrash2 aria-hidden='true' />
            Sil
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
