import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import StudyIllustration from '../components/illustrations/StudyIllustration'
import { login } from '../lib/api'
import { saveSession } from '../lib/auth'

const LoginPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const session = await login({ email: email.trim(), password })
      saveSession(session)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Giriş alınmadı.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout illustration={<StudyIllustration />} tagline='Dərslərinə qaldığın yerdən davam et.'>
      <h1 className='text-[24px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Daxil ol</h1>
      <p className='mb-[20px] mt-[4px] text-[14px] text-[#777] dark:text-[#A8A29E]'>Xoş gəldin, cədvəlin səni gözləyir.</p>
      <form onSubmit={handleSubmit} className='flex flex-col gap-[14px]'>
        <label className='block'>
          <span className='mb-[6px] block text-[13px] font-semibold text-[#434140] dark:text-[#EDE8DF]'>E-poçt</span>
          <input
            type='email'
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder='sen@misal.az'
            autoComplete='email'
            className='w-full rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] p-[10px] text-[14px] text-[#333] outline-none focus:border-[#A65B46] dark:border-[#4A4440] dark:bg-[#201D1B] dark:text-[#E8E2D9]'
          />
        </label>
        <label className='block'>
          <span className='mb-[6px] block text-[13px] font-semibold text-[#434140] dark:text-[#EDE8DF]'>Şifrə</span>
          <input
            type='password'
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder='••••••••'
            autoComplete='current-password'
            className='w-full rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] p-[10px] text-[14px] text-[#333] outline-none focus:border-[#A65B46] dark:border-[#4A4440] dark:bg-[#201D1B] dark:text-[#E8E2D9]'
          />
        </label>
        <button
          type='submit'
          disabled={busy}
          className='w-full rounded-[8px] bg-[#434140] py-[12px] font-medium text-[#E7D8C6] hover:bg-[#555250] disabled:opacity-60 dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
        >
          {busy ? 'Gözlə…' : 'Daxil ol'}
        </button>
      </form>
      {error && (
        <p className='mt-[12px] rounded-[8px] bg-[#FCE5E0] p-[10px] text-[14px] text-[#A65B46]'>{error}</p>
      )}
      <p className='mt-[16px] text-center text-[13px] text-[#777] dark:text-[#A8A29E]'>
        Hesabın yoxdur? <Link to='/register' className='font-medium text-[#A65B46] hover:underline'>Qeydiyyatdan keç</Link>
      </p>
    </AuthLayout>
  )
}

export default LoginPage
