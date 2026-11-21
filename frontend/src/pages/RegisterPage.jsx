import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import ScheduleIllustration from '../components/illustrations/ScheduleIllustration'
import { register } from '../lib/api'
import { saveSession } from '../lib/auth'
import { linkPushUser } from '../lib/onesignal'

const inputClass = 'w-full rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] p-[10px] text-[14px] text-[#333] outline-none focus:border-[#A65B46] dark:border-[#4A4440] dark:bg-[#201D1B] dark:text-[#E8E2D9]'
const labelClass = 'mb-[6px] block text-[13px] font-semibold text-[#434140] dark:text-[#EDE8DF]'

const RegisterPage = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
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
      const session = await register({
        name: name.trim(),
        email: email.trim(),
        password,
      })
      saveSession(session)
      linkPushUser(session?.user?.id)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err.message || 'Qeydiyyat alınmadı.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout illustration={<ScheduleIllustration />} tagline='Bir dəqiqəyə hesab yarat, cədvəlini qurmağa başla.'>
      <h1 className='text-[24px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Qeydiyyat</h1>
      <p className='mb-[20px] mt-[4px] text-[14px] text-[#777] dark:text-[#A8A29E]'>Pulsuzdur, bir dəqiqə çəkir.</p>
      <form onSubmit={handleSubmit} className='flex flex-col gap-[14px]'>
        <label className='block'>
          <span className={labelClass}>Ad</span>
          <input
            type='text'
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder='Ad Soyad'
            autoComplete='name'
            className={inputClass}
          />
        </label>
        <label className='block'>
          <span className={labelClass}>E-poçt</span>
          <input
            type='email'
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder='sen@misal.az'
            autoComplete='email'
            className={inputClass}
          />
        </label>
        <div className='grid grid-cols-1 gap-[14px] sm:grid-cols-2'>
          <label className='block'>
            <span className={labelClass}>Şifrə</span>
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
            <span className={labelClass}>Şifrə (təkrar)</span>
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
        </div>
        <button
          type='submit'
          disabled={busy}
          className='w-full rounded-[8px] bg-[#434140] py-[12px] font-medium text-[#E7D8C6] hover:bg-[#555250] disabled:opacity-60 dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
        >
          {busy ? 'Gözlə…' : 'Hesab yarat'}
        </button>
      </form>
      {error && (
        <p className='mt-[12px] rounded-[8px] bg-[#FCE5E0] p-[10px] text-[14px] text-[#A65B46]'>{error}</p>
      )}
      <p className='mt-[16px] text-center text-[13px] text-[#777] dark:text-[#A8A29E]'>
        Hesabın var? <Link to='/login' className='font-medium text-[#A65B46] hover:underline'>Daxil ol</Link>
      </p>
    </AuthLayout>
  )
}

export default RegisterPage
