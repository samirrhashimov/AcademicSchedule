import { useState } from 'react'
import { FiX } from 'react-icons/fi'
import { changePassword } from '../lib/api'
import { useEscapeKey } from '../lib/useEscapeKey'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'

const inputClass = 'w-full rounded-[6px] border border-[#D8D5CE] bg-[#FFF] px-[10px] py-[8px] text-[13px] text-[#434140] outline-none focus:border-[#A65B46] dark:border-[#4A4440] dark:bg-[#2A2724] dark:text-[#EDE8DF]'

const ChangePasswordModal = ({ open, onClose }) => {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  useLockBodyScroll(open)
  useEscapeKey(onClose, open)
  if (!open) {
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (busy) {
      return
    }
    if (next !== confirm) {
      setStatus({ ok: false, message: 'Yeni şifrələr eyni deyil.' })
      return
    }
    if (next.length < 6) {
      setStatus({ ok: false, message: 'Yeni şifrə ən azı 6 simvol olmalıdır.' })
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      await changePassword({ currentPassword: current, newPassword: next })
      setStatus({ ok: true, message: 'Şifrə yeniləndi.' })
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (error) {
      setStatus({ ok: false, message: error.message || 'Yenilənmədi.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className='modal-overlay-in fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-0 sm:p-[20px]'
      role='dialog'
      aria-modal='true'
      aria-labelledby='change-password-title'
    >
      <div className='modal-card-in h-full w-full max-w-none overflow-y-auto rounded-none bg-[#FFF] p-[24px] text-[#333] shadow-xl sm:h-auto sm:max-w-[420px] sm:rounded-[14px] dark:bg-[#2A2724] dark:text-[#E8E2D9]'>
        <div className='mb-[16px] flex items-center justify-between border-b border-[#EEE] pb-[16px] dark:border-[#4A4440]'>
          <h2 id='change-password-title' className='text-[20px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Şifrəni dəyişdir</h2>
          <button
            type='button'
            onClick={onClose}
            aria-label='Bağla'
            className='flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#F1EFE9] text-[18px] text-[#434140] hover:bg-[#E4E0D6] dark:bg-[#3A3632] dark:text-[#EDE8DF] dark:hover:bg-[#4A4440]'
          >
            <FiX aria-hidden='true' />
          </button>
        </div>
        {status?.ok ? (
          <>
            <p className='rounded-[8px] bg-[#E3F1EC] p-[10px] text-[14px] text-[#477A68]'>{status.message}</p>
            <button
              type='button'
              onClick={onClose}
              className='mt-[12px] w-full rounded-[8px] bg-[#434140] py-[10px] text-[14px] font-medium text-[#E7D8C6] hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
            >
              Bağla
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className='flex flex-col gap-[10px]'>
            <label className='block'>
              <span className='mb-[6px] block text-[13px] font-semibold text-[#434140] dark:text-[#EDE8DF]'>Cari şifrə</span>
              <input
                type='password'
                required
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
                autoComplete='current-password'
                className={inputClass}
              />
            </label>
            <label className='block'>
              <span className='mb-[6px] block text-[13px] font-semibold text-[#434140] dark:text-[#EDE8DF]'>Yeni şifrə</span>
              <input
                type='password'
                required
                minLength={6}
                value={next}
                onChange={(event) => setNext(event.target.value)}
                autoComplete='new-password'
                className={inputClass}
              />
            </label>
            <label className='block'>
              <span className='mb-[6px] block text-[13px] font-semibold text-[#434140] dark:text-[#EDE8DF]'>Yeni şifrə (təkrar)</span>
              <input
                type='password'
                required
                minLength={6}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete='new-password'
                className={inputClass}
              />
            </label>
            <button
              type='submit'
              disabled={busy}
              className='rounded-[8px] bg-[#434140] py-[10px] text-[14px] font-medium text-[#E7D8C6] hover:bg-[#555250] disabled:opacity-60 dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
            >
              {busy ? 'Gözlə…' : 'Yadda saxla'}
            </button>
            {status && !status.ok && (
              <p className='rounded-[8px] bg-[#FCE5E0] p-[10px] text-[13px] text-[#A65B46]'>{status.message}</p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}

export default ChangePasswordModal
