import { FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { clearSession, getUser } from '../lib/auth'
import { useEscapeKey } from '../lib/useEscapeKey'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'

const SettingsModal = ({ open, theme, onSelectTheme, weekSystem, onWeekSystemChange, onClose }) => {
  const navigate = useNavigate()
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
        <p className='mb-[10px] text-[14px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Hesab</p>
        <div className='mb-[16px] flex items-center justify-between gap-[12px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
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
        <p className='mb-[10px] text-[14px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Həftə sistemi</p>
        <div className='flex overflow-hidden rounded-[8px] border border-[#D8D5CE] text-[14px] dark:border-[#4A4440]' role='group' aria-label='Həftə sistemi'>
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
      </div>
    </div>
  )
}

export default SettingsModal
