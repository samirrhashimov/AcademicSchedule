import { useState } from 'react'
import { FiArrowLeft, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { deleteAccount } from '../lib/api'
import { clearSession } from '../lib/auth'
import { useEscapeKey } from '../lib/useEscapeKey'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'

const DeleteAccountModal = ({ open, onClose }) => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  useLockBodyScroll(open)
  useEscapeKey(onClose, open)
  if (!open) {
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (busy || !password) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      await deleteAccount(password)
      clearSession()
      onClose()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Silinmədi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className='modal-overlay-in fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-0 sm:p-[20px]'
      role='dialog'
      aria-modal='true'
      aria-labelledby='delete-account-title'
    >
      <div className='modal-card-in h-full w-full max-w-none overflow-y-auto rounded-none bg-[#FFF] p-[24px] text-[#333] shadow-xl sm:h-auto sm:max-w-[420px] sm:rounded-[14px] dark:bg-[#2A2724] dark:text-[#E8E2D9]'>
        <div className='mb-[16px] flex items-center justify-between border-b border-[#EEE] pb-[16px] dark:border-[#4A4440]'>
          <div className='flex items-center gap-[10px]'>
            <button
              type='button'
              onClick={onClose}
              aria-label='Geri'
              title='Geri'
              className='flex h-[32px] w-[32px] items-center justify-center rounded-full text-[20px] text-[#434140] hover:bg-[#F1EFE9] dark:text-[#EDE8DF] dark:hover:bg-[#3A3632]'
            >
              <FiArrowLeft aria-hidden='true' />
            </button>
            <h2 id='delete-account-title' className='text-[20px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Hesabı sil</h2>
          </div>
          <button
            type='button'
            onClick={onClose}
            aria-label='Bağla'
            className='flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#F1EFE9] text-[18px] text-[#434140] hover:bg-[#E4E0D6] dark:bg-[#3A3632] dark:text-[#EDE8DF] dark:hover:bg-[#4A4440]'
          >
            <FiX aria-hidden='true' />
          </button>
        </div>
        <p className='mb-[16px] text-[14px]'>Hesab və bütün məlumatlar silinəcək. Davam etmək üçün şifrəni yaz.</p>
        <form onSubmit={handleSubmit} className='flex flex-col gap-[10px]'>
          <label className='block'>
            <span className='mb-[6px] block text-[13px] font-semibold text-[#434140] dark:text-[#EDE8DF]'>Şifrə</span>
            <input
              type='password'
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete='current-password'
              className='w-full rounded-[6px] border border-[#D8D5CE] bg-[#FFF] px-[10px] py-[8px] text-[13px] text-[#434140] outline-none focus:border-[#A65B46] dark:border-[#4A4440] dark:bg-[#2A2724] dark:text-[#EDE8DF]'
            />
          </label>
          {error && (
            <p className='rounded-[8px] bg-[#FCE5E0] p-[10px] text-[13px] text-[#A65B46]'>{error}</p>
          )}
          <div className='flex gap-[10px]'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 rounded-[8px] border border-[#D8D5CE] py-[10px] text-[14px] font-medium text-[#434140] hover:bg-[#F7F3EC] dark:border-[#4A4440] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'
            >
              Ləğv et
            </button>
            <button
              type='submit'
              disabled={busy || !password}
              className='flex-1 rounded-[8px] bg-[#A65B46] py-[10px] text-[14px] font-medium text-[#FFF] hover:bg-[#96503E] disabled:opacity-60'
            >
              {busy ? 'Gözlə…' : 'Hesabı sil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DeleteAccountModal
