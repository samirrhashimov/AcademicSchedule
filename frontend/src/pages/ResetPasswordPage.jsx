import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import ScheduleIllustration from '../components/illustrations/ScheduleIllustration'
import { resetPassword } from '../lib/api'

const inputClass = 'w-full rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] p-[10px] text-[14px] text-[#333] outline-none focus:border-[#A65B46] dark:border-[#4A4440] dark:bg-[#201D1B] dark:text-[#E8E2D9]'

const ResetPasswordPage = () => {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (password !== confirm) {
      setError('Şifrələr eyni deyil.')
      return
    }
    setError('')
    setBusy(true)
    try {
      await resetPassword({ token, password })
      setDone(true)
    } catch (err) {
      setError(err.message || 'Yenilənmədi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout illustration={<ScheduleIllustration />} tagline='Yeni şifrəni təyin et, davam et.'>
      <h1 className='text-[24px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Yeni şifrə</h1>
      <p className='mb-[20px] mt-[4px] text-[14px] text-[#777] dark:text-[#A8A29E]'>Ən azı 6 simvol yaz.</p>
      {done ? (
        <p className='rounded-[8px] bg-[#E3F1EC] p-[10px] text-[14px] text-[#477A68]'>
          Şifrə yeniləndi. <Link to='/login' className='font-medium hover:underline'>Daxil ol</Link>
        </p>
      ) : (
        <form onSubmit={handleSubmit} className='flex flex-col gap-[14px]'>
          <label className='block'>
            <span className='mb-[6px] block text-[13px] font-semibold text-[#434140] dark:text-[#EDE8DF]'>Yeni şifrə</span>
            <input
              type='password'
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder='••••••••'
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
              placeholder='••••••••'
              autoComplete='new-password'
              className={inputClass}
            />
          </label>
          <button
            type='submit'
            disabled={busy}
            className='w-full rounded-[8px] bg-[#434140] py-[12px] font-medium text-[#E7D8C6] hover:bg-[#555250] disabled:opacity-60 dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
          >
            {busy ? 'Gözlə…' : 'Şifrəni yenilə'}
          </button>
        </form>
      )}
      {error && (
        <p className='mt-[12px] rounded-[8px] bg-[#FCE5E0] p-[10px] text-[14px] text-[#A65B46]'>{error}</p>
      )}
    </AuthLayout>
  )
}

export default ResetPasswordPage
