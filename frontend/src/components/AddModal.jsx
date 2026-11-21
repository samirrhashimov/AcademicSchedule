import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { FiCamera, FiLayers, FiPlus, FiUpload, FiX } from 'react-icons/fi'
import { fetchTemplate, fetchTemplatePreview, importSubjects, saveWeekState } from '../lib/api'
import { parseScannedCode } from '../lib/templateCode'
const QrScanner = lazy(() => import('./QrScanner'))
import { parseBackup } from '../lib/backup'
import { normalizeSubject } from '../lib/subjects'
import { useEscapeKey } from '../lib/useEscapeKey'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'

const AddModal = ({ open, onClose, onSelectNew }) => {
  const [status, setStatus] = useState(null)
  const [step, setStep] = useState('menu')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(null)
  const [menuIndex, setMenuIndex] = useState(0)
  const fileInputRef = useRef(null)
  const menuRefs = useRef([])
  const resetForm = () => {
    setStep('menu')
    setStatus(null)
    setCode('')
    setBusy(false)
    setPreview(null)
  }
  const handleClose = () => {
    resetForm()
    onClose()
  }
  const handleEscape = () => {
    if (preview) {
      setPreview(null)
      return
    }
    if (step === 'code') {
      setStep('menu')
      return
    }
    handleClose()
  }
  useLockBodyScroll(open)
  useEscapeKey(handleEscape, open)
  useEffect(() => {
    if (open && step === 'menu') {
      menuRefs.current[menuIndex]?.focus()
    }
  }, [open, step, menuIndex])
  if (!open) {
    return null
  }

  const handleFile = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }
    setStatus(null)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const parsed = parseBackup(JSON.parse(String(reader.result)))
        await importSubjects(parsed.subjects)
        await saveWeekState(parsed.weekState)
        setStatus({ ok: true })
        window.setTimeout(() => window.location.reload(), 1200)
      } catch (error) {
        setStatus({ ok: false, message: error.message || 'İdxal alınmadı.' })
      }
    }
    reader.onerror = () => setStatus({ ok: false, message: 'Fayl oxunmadı.' })
    reader.readAsText(file)
  }

  const handleCheckCode = async (event, explicitCode) => {
    event?.preventDefault()
    const clean = (explicitCode ?? code).trim().toUpperCase()
    if (!clean || busy) {
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      const meta = await fetchTemplatePreview(clean)
      setPreview(meta)
    } catch (error) {
      setStatus({ ok: false, message: error.message || 'Şablon tapılmadı.' })
    } finally {
      setBusy(false)
    }
  }

  const handleMenuKeyDown = (event) => {
    const count = menuRefs.current.length
    if (count === 0) {
      return
    }
    let next = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = (menuIndex + 1) % count
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = (menuIndex - 1 + count) % count
    } else if (event.key === 'Home') {
      next = 0
    } else if (event.key === 'End') {
      next = count - 1
    }
    if (next === null) {
      return
    }
    event.preventDefault()
    setMenuIndex(next)
    menuRefs.current[next]?.focus()
  }

  const handleCardKeyDown = (event) => {
    if (step !== 'menu' || event.metaKey || event.ctrlKey || event.altKey) {
      return
    }
    const index = ['1', '2', '3'].indexOf(event.key)
    if (index === -1) {
      return
    }
    event.preventDefault()
    menuRefs.current[index]?.click()
  }

  const handleScanDetected = (text) => {
    const clean = parseScannedCode(text)
    setCode(clean.toUpperCase())
    setStep('code')
    handleCheckCode(null, clean)
  }

  const handleConfirmLoad = async () => {
    if (!preview || busy) {
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      const template = await fetchTemplate(preview.code)
      const fresh = template.subjects.map((subject) => normalizeSubject({ ...subject, id: undefined }))
      await importSubjects(fresh)
      setStatus({ ok: true })
      window.setTimeout(() => window.location.reload(), 1200)
    } catch (error) {
      setStatus({ ok: false, message: error.message || 'Şablon yüklənmədi.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className='modal-overlay-in fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-0 sm:p-[20px]'
      role='dialog'
      aria-modal='true'
      aria-labelledby='add-title'
    >
      <div onKeyDown={handleCardKeyDown} className='modal-card-in h-full w-full max-w-none overflow-y-auto rounded-none bg-[#FFF] p-[24px] text-[#333] shadow-xl sm:h-auto sm:max-w-[600px] sm:rounded-[14px] dark:bg-[#2A2724] dark:text-[#E8E2D9]'>
        <div className='mb-[16px] flex items-center justify-between border-b border-[#EEE] pb-[16px] dark:border-[#4A4440]'>
          <h2 id='add-title' className='text-[20px] font-bold text-[#434140] dark:text-[#EDE8DF]'>
            {step === 'menu' ? 'Əlavə et' : step === 'scan' ? 'Kodu skan et' : 'Şablon kodu'}
          </h2>
          <button
            type='button'
            onClick={handleClose}
            aria-label='Bağla'
            className='flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#F1EFE9] text-[18px] text-[#434140] hover:bg-[#E4E0D6] dark:bg-[#3A3632] dark:text-[#EDE8DF] dark:hover:bg-[#4A4440]'
          >
            <FiX aria-hidden='true' />
          </button>
        </div>
        {step === 'menu' ? (
          <div className='grid grid-cols-1 gap-[10px] sm:grid-cols-3' onKeyDown={handleMenuKeyDown}>
            <button
              type='button'
              ref={(element) => { menuRefs.current[0] = element }}
              onFocus={() => setMenuIndex(0)}
              onClick={onSelectNew}
              title='Yeni fənn (1)'
              className='relative flex min-h-[230px] flex-col items-center justify-center gap-[6px] rounded-[10px] border border-[#D8D5CE] bg-[#FAFAF8] px-[20px] py-[28px] text-center hover:border-[#A65B46] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A65B46] dark:border-[#4A4440] dark:bg-[#201D1B]'
            >
              <span aria-hidden='true' className='absolute right-[10px] top-[10px] rounded-[4px] bg-[#EEE] px-[6px] py-[2px] text-[11px] font-bold text-[#777] dark:bg-[#3A3632] dark:text-[#A8A29E]'>1</span>
              <FiPlus aria-hidden='true' className='mb-[10px] text-[72px] text-[#434140] dark:text-[#E7D8C6]' />
              <span className='text-[15px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Yeni fənn</span>
              <span className='text-[12px] text-[#777] dark:text-[#A8A29E]'>Fənni əl ilə daxil et</span>
            </button>
            <button
              type='button'
              ref={(element) => { menuRefs.current[1] = element }}
              onFocus={() => setMenuIndex(1)}
              onClick={() => fileInputRef.current?.click()}
              title='İdxal et (2)'
              className='relative flex min-h-[230px] flex-col items-center justify-center gap-[6px] rounded-[10px] border border-[#D8D5CE] bg-[#FAFAF8] px-[20px] py-[28px] text-center hover:border-[#A65B46] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A65B46] dark:border-[#4A4440] dark:bg-[#201D1B]'
            >
              <span aria-hidden='true' className='absolute right-[10px] top-[10px] rounded-[4px] bg-[#EEE] px-[6px] py-[2px] text-[11px] font-bold text-[#777] dark:bg-[#3A3632] dark:text-[#A8A29E]'>2</span>
              <FiUpload aria-hidden='true' className='mb-[10px] text-[72px] text-[#434140] dark:text-[#E7D8C6]' />
              <span className='text-[15px] font-bold text-[#434140] dark:text-[#EDE8DF]'>İdxal et</span>
              <span className='text-[12px] text-[#777] dark:text-[#A8A29E]'>JSON faylından daxil et</span>
            </button>
            <button
              type='button'
              ref={(element) => { menuRefs.current[2] = element }}
              onFocus={() => setMenuIndex(2)}
              onClick={() => setStep('code')}
              aria-label='Şablon kodu ilə yüklə'
              title='Şablon kodu (3)'
              className='relative flex min-h-[230px] flex-col items-center justify-center gap-[6px] rounded-[10px] border border-[#D8D5CE] bg-[#FAFAF8] px-[20px] py-[28px] text-center hover:border-[#A65B46] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A65B46] dark:border-[#4A4440] dark:bg-[#201D1B]'
            >
              <span aria-hidden='true' className='absolute right-[10px] top-[10px] rounded-[4px] bg-[#EEE] px-[6px] py-[2px] text-[11px] font-bold text-[#777] dark:bg-[#3A3632] dark:text-[#A8A29E]'>3</span>
              <FiLayers aria-hidden='true' className='mb-[10px] text-[72px] text-[#434140] dark:text-[#E7D8C6]' />
              <span className='text-[15px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Şablon kodu</span>
              <span className='text-[12px] text-[#777] dark:text-[#A8A29E]'>Kodu yaz, hazır cədvəli yüklə</span>
            </button>
          </div>
        ) : step === 'scan' ? (
          <Suspense fallback={<p className='py-[20px] text-center text-[14px] text-[#777] dark:text-[#A8A29E]'>Gözlə…</p>}>
            <QrScanner onDetected={handleScanDetected} onBack={() => setStep('code')} />
          </Suspense>
        ) : preview ? (
          <div className='flex flex-col gap-[12px]'>
            <div className='rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
              <p className='truncate text-[15px] font-bold text-[#434140] dark:text-[#EDE8DF]'>{preview.name}</p>
              <p className='text-[12px] text-[#777] dark:text-[#A8A29E]'>{preview.subjectCount} fənn</p>
            </div>
            <div className='flex gap-[10px]'>
              <button
                type='button'
                onClick={() => setPreview(null)}
                disabled={busy}
                className='flex-1 rounded-[8px] border border-[#D8D5CE] px-[12px] py-[10px] text-[14px] font-medium text-[#434140] hover:bg-[#F7F3EC] disabled:opacity-60 dark:border-[#4A4440] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'
              >
                Ləğv et
              </button>
              <button
                type='button'
                onClick={handleConfirmLoad}
                disabled={busy}
                className='flex-1 rounded-[8px] bg-[#434140] py-[10px] font-medium text-[#E7D8C6] hover:bg-[#555250] disabled:opacity-60 dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
              >
                {busy ? 'Gözlə…' : 'Davam et'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCheckCode} className='flex flex-col gap-[12px]'>
            <label className='block'>
              <span className='mb-[6px] block text-[13px] font-semibold text-[#434140] dark:text-[#EDE8DF]'>Şablon kodu</span>
              <input
                type='text'
                required
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder='Məsələn: K7QX2P'
                autoFocus
                maxLength={12}
                className='w-full rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] p-[10px] text-center text-[18px] font-bold tracking-[0.2em] text-[#434140] outline-none focus:border-[#A65B46] dark:border-[#4A4440] dark:bg-[#201D1B] dark:text-[#E8E2D9]'
              />
            </label>
            <button
              type='button'
              onClick={() => setStep('scan')}
              className='flex items-center justify-center gap-[6px] rounded-[8px] border border-[#D8D5CE] px-[12px] py-[10px] text-[14px] font-medium text-[#434140] hover:bg-[#F7F3EC] dark:border-[#4A4440] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'
            >
              <FiCamera aria-hidden='true' />
              Skan et
            </button>
            <div className='flex gap-[10px]'>
              <button
                type='button'
                onClick={() => setStep('menu')}
                className='rounded-[8px] border border-[#D8D5CE] px-[12px] py-[10px] text-[14px] font-medium text-[#434140] hover:bg-[#F7F3EC] dark:border-[#4A4440] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'
              >
                Geri
              </button>
              <button
                type='submit'
                disabled={busy}
                className='flex-1 rounded-[8px] bg-[#434140] py-[10px] font-medium text-[#E7D8C6] hover:bg-[#555250] disabled:opacity-60 dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
              >
                {busy ? 'Gözlə…' : 'Yoxla'}
              </button>
            </div>
          </form>
        )}
        <input
          ref={fileInputRef}
          type='file'
          accept='application/json,.json'
          onChange={handleFile}
          className='hidden'
          aria-label='JSON yedək faylı seç'
        />
        {status && (
          <p className={`mt-[12px] rounded-[8px] p-[10px] text-[13px] ${status.ok ? 'bg-[#E3F1EC] text-[#477A68]' : 'bg-[#FCE5E0] text-[#A65B46]'}`}>
            {status.ok ? 'Yükləndi, səhifə yenilənir…' : status.message}
          </p>
        )}
      </div>
    </div>
  )
}

export default AddModal
