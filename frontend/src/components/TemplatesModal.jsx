import { useEffect, useState } from 'react'
import { FiArrowLeft, FiCheck, FiCopy, FiTrash2, FiX } from 'react-icons/fi'
import { deleteTemplate, fetchMyTemplates } from '../lib/api'
import { useEscapeKey } from '../lib/useEscapeKey'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'

const formatExpiry = (expiresAt) => {
  if (!expiresAt) {
    return 'Həmişəlik'
  }
  try {
    return new Date(expiresAt).toLocaleDateString()
  } catch {
    return ''
  }
}

const TemplatesModal = ({ open, onClose }) => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedCode, setCopiedCode] = useState(null)
  const [confirmCode, setConfirmCode] = useState(null)
  useLockBodyScroll(open)
  useEscapeKey(onClose, open)

  useEffect(() => {
    if (!open) {
      return
    }
    fetchMyTemplates()
      .then((list) => setTemplates(Array.isArray(list) ? list : []))
      .catch((fetchError) => setError(fetchError.message || 'Yüklənmədi.'))
      .finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    if (!confirmCode) {
      return undefined
    }
    const timer = window.setTimeout(() => setConfirmCode(null), 3000)
    return () => window.clearTimeout(timer)
  }, [confirmCode])

  if (!open) {
    return null
  }

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      window.setTimeout(() => setCopiedCode(null), 2000)
    } catch {
      setCopiedCode(null)
    }
  }

  const handleDelete = async (code) => {
    if (confirmCode !== code) {
      setConfirmCode(code)
      return
    }
    setConfirmCode(null)
    try {
      await deleteTemplate(code)
      setTemplates((current) => current.filter((template) => template.code !== code))
    } catch (deleteError) {
      setError(deleteError.message || 'Silinmədi.')
    }
  }

  return (
    <div
      className='modal-overlay-in fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-0 sm:p-[20px]'
      role='dialog'
      aria-modal='true'
      aria-labelledby='templates-title'
    >
      <div className='modal-card-in h-full w-full max-w-none overflow-y-auto rounded-none bg-[#FFF] p-[24px] text-[#333] shadow-xl sm:h-auto sm:max-w-[480px] sm:rounded-[14px] dark:bg-[#2A2724] dark:text-[#E8E2D9]'>
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
            <h2 id='templates-title' className='text-[20px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Şablonlarım</h2>
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
        {loading ? (
          <p className='py-[20px] text-center text-[14px] text-[#777] dark:text-[#A8A29E]'>Gözlə…</p>
        ) : templates.length === 0 ? (
          <p className='py-[20px] text-center text-[14px] text-[#777] dark:text-[#A8A29E]'>Hələ şablon yoxdur.</p>
        ) : (
          <div className='flex max-h-[320px] flex-col gap-[10px] overflow-y-auto'>
            {templates.map((template) => (
              <div
                key={template.code}
                className='flex items-center justify-between gap-[12px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'
              >
                <div className='min-w-0'>
                  <p className='truncate text-[14px] font-bold text-[#434140] dark:text-[#EDE8DF]'>{template.name}</p>
                  <button
                    type='button'
                    onClick={() => handleCopy(template.code)}
                    title='Kopyalamaq üçün kliklə'
                    className='flex items-center gap-[4px] text-[13px] font-bold tracking-[0.15em] text-[#A65B46]'
                  >
                    {template.code}
                    {copiedCode === template.code ? <FiCheck aria-hidden='true' /> : <FiCopy aria-hidden='true' />}
                  </button>
                  <p className='truncate text-[12px] text-[#777] dark:text-[#A8A29E]'>
                    {template.subjectCount} fənn • {template.downloads} yükləmə • {formatExpiry(template.expiresAt)}
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => handleDelete(template.code)}
                  aria-label='Şablonu sil'
                  title={confirmCode === template.code ? 'Əminsən? Yenidən kliklə' : 'Sil'}
                  className={`flex min-w-[96px] shrink-0 items-center justify-center gap-[6px] rounded-[6px] px-[12px] py-[8px] text-[13px] font-medium ${
                    confirmCode === template.code
                      ? 'bg-[#A65B46] text-[#FFF] hover:bg-[#96503E]'
                      : 'bg-[#FCE5E0] text-[#A65B46] hover:bg-[#F6D9D2]'
                  }`}
                >
                  <FiTrash2 aria-hidden='true' />
                  {confirmCode === template.code ? 'Əminsən?' : 'Sil'}
                </button>
              </div>
            ))}
          </div>
        )}
        {error && (
          <p className='mt-[12px] rounded-[8px] bg-[#FCE5E0] p-[10px] text-[13px] text-[#A65B46]'>{error}</p>
        )}
      </div>
    </div>
  )
}

export default TemplatesModal
