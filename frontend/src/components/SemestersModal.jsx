import { useEffect, useState } from 'react'
import { FiArrowLeft, FiChevronDown, FiPlus, FiX } from 'react-icons/fi'
import { archiveSemester, deleteSemester, fetchSemester, fetchSemesters, restoreSemester } from '../lib/api'
import { useEscapeKey } from '../lib/useEscapeKey'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'

const suggestName = () => {
  const now = new Date()
  return `${now.getFullYear()} ${now.getMonth() >= 7 ? 'Payız' : 'Yaz'}`
}

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return ''
  }
}

const SemestersModal = ({ open, onClose }) => {
  const [semesters, setSemesters] = useState([])
  const [details, setDetails] = useState({})
  const [expandedId, setExpandedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState(null)
  const [newOpen, setNewOpen] = useState(false)
  const [newName, setNewName] = useState(suggestName)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(null)
  useLockBodyScroll(open)
  useEscapeKey(onClose, open)

  useEffect(() => {
    if (!open) {
      return
    }
    fetchSemesters()
      .then((list) => setSemesters(Array.isArray(list) ? list : []))
      .catch((fetchError) => setError(fetchError.message || 'Yüklənmədi.'))
      .finally(() => setLoading(false))
  }, [open])

  if (!open) {
    return null
  }

  const reloadSoon = (message) => {
    setStatus(message)
    window.setTimeout(() => window.location.reload(), 1200)
  }

  const handleToggle = async (id) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    if (details[id]) {
      setExpandedId(id)
      return
    }
    try {
      const full = await fetchSemester(id)
      setDetails((current) => ({ ...current, [id]: full.subjects || [] }))
      setExpandedId(id)
    } catch (fetchError) {
      setError(fetchError.message || 'Yüklənmədi.')
    }
  }

  const handleArchive = async () => {
    const name = newName.trim()
    if (busy || !name) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      await archiveSemester(name)
      reloadSoon('Arxivləndi, səhifə yenilənir…')
    } catch (archiveError) {
      setError(archiveError.message || 'Arxivlənmədi.')
    } finally {
      setBusy(false)
    }
  }

  const handleRestore = async (id) => {
    if (busy) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      await restoreSemester(id)
      reloadSoon('Bərpa olundu, səhifə yenilənir…')
    } catch (restoreError) {
      setError(restoreError.message || 'Bərpa olunmadı.')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id) => {
    if (busy) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      await deleteSemester(id)
      setSemesters((current) => current.filter((item) => item.id !== id))
      setConfirm(null)
    } catch (deleteError) {
      setError(deleteError.message || 'Silinmədi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className='modal-overlay-in fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-0 sm:p-[20px]'
      role='dialog'
      aria-modal='true'
      aria-labelledby='semesters-title'
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
            <h2 id='semesters-title' className='text-[20px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Semestrlər</h2>
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
        {!newOpen ? (
          <button
            type='button'
            onClick={() => setNewOpen(true)}
            className='mb-[12px] flex w-full items-center justify-center gap-[6px] rounded-[8px] bg-[#434140] py-[10px] text-[14px] font-medium text-[#E7D8C6] hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
          >
            <FiPlus aria-hidden='true' />
            Yeni semestr
          </button>
        ) : (
          <div className='mb-[12px] rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] p-[12px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
            <p className='mb-[8px] text-[13px] text-[#777] dark:text-[#A8A29E]'>Cari cədvəl arxivlənəcək, boş semestr başlayacaq.</p>
            <input
              type='text'
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              maxLength={80}
              aria-label='Semestr adı'
              autoFocus
              className='w-full rounded-[6px] border border-[#D8D5CE] bg-[#FFF] px-[10px] py-[8px] text-[13px] text-[#434140] outline-none focus:border-[#A65B46] dark:border-[#4A4440] dark:bg-[#2A2724] dark:text-[#EDE8DF]'
            />
            <div className='mt-[8px] flex gap-[8px]'>
              <button
                type='button'
                onClick={() => setNewOpen(false)}
                className='flex-1 rounded-[6px] border border-[#D8D5CE] py-[8px] text-[13px] font-medium text-[#434140] hover:bg-[#F7F3EC] dark:border-[#4A4440] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'
              >
                Ləğv et
              </button>
              <button
                type='button'
                onClick={handleArchive}
                disabled={busy || !newName.trim()}
                className='flex-1 rounded-[6px] bg-[#434140] py-[8px] text-[13px] font-medium text-[#E7D8C6] hover:bg-[#555250] disabled:opacity-60 dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
              >
                {busy ? 'Gözlə…' : 'Arxivlə'}
              </button>
            </div>
          </div>
        )}
        {loading ? (
          <p className='py-[20px] text-center text-[14px] text-[#777] dark:text-[#A8A29E]'>Gözlə…</p>
        ) : semesters.length === 0 ? (
          <p className='py-[20px] text-center text-[14px] text-[#777] dark:text-[#A8A29E]'>Hələ arxiv yoxdur.</p>
        ) : (
          <div className='flex max-h-[320px] flex-col gap-[10px] overflow-y-auto'>
            {semesters.map((item) => (
              <div
                key={item.id}
                className='rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'
              >
                <button
                  type='button'
                  onClick={() => handleToggle(item.id)}
                  aria-expanded={expandedId === item.id}
                  className='flex w-full items-center justify-between gap-[12px] text-left'
                >
                  <span className='min-w-0'>
                    <span className='block truncate text-[14px] font-bold text-[#434140] dark:text-[#EDE8DF]'>{item.name}</span>
                    <span className='block truncate text-[12px] text-[#777] dark:text-[#A8A29E]'>
                      {item.subjectCount} fənn • {formatDate(item.archivedAt)}
                    </span>
                  </span>
                  <FiChevronDown aria-hidden='true' className={`shrink-0 text-[18px] text-[#777] transition-transform dark:text-[#A8A29E] ${expandedId === item.id ? 'rotate-180' : ''}`} />
                </button>
                {expandedId === item.id && (
                  <div className='mt-[8px] border-t border-[#EEE] pt-[8px] dark:border-[#4A4440]'>
                    {(details[item.id] || []).length === 0 ? (
                      <p className='text-[13px] text-[#777] dark:text-[#A8A29E]'>Fənn yoxdur.</p>
                    ) : (
                      <ul className='flex flex-col gap-[3px]'>
                        {(details[item.id] || []).map((subject, index) => (
                          <li key={subject.id || index} className='truncate text-[13px] text-[#434140] dark:text-[#EDE8DF]'>
                            {subject.name} <span className='text-[#777] dark:text-[#A8A29E]'>({subject.schedule?.length || 0} dərs)</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {confirm?.id === item.id ? (
                  <div className='mt-[8px]'>
                    <p className='mb-[8px] text-[13px] text-[#777] dark:text-[#A8A29E]'>
                      {confirm.action === 'restore' ? 'Cari cədvəl əvəzlənəcək.' : 'Arxiv silinsin?'}
                    </p>
                    <div className='flex gap-[8px]'>
                      <button
                        type='button'
                        onClick={() => setConfirm(null)}
                        className='flex-1 rounded-[6px] border border-[#D8D5CE] py-[8px] text-[13px] font-medium text-[#434140] hover:bg-[#F7F3EC] dark:border-[#4A4440] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'
                      >
                        Ləğv et
                      </button>
                      <button
                        type='button'
                        onClick={() => (confirm.action === 'restore' ? handleRestore(item.id) : handleDelete(item.id))}
                        disabled={busy}
                        className={`flex-1 rounded-[6px] py-[8px] text-[13px] font-medium text-[#FFF] disabled:opacity-60 ${confirm.action === 'restore' ? 'bg-[#477A68] hover:bg-[#3D6A5B]' : 'bg-[#A65B46] hover:bg-[#96503E]'}`}
                      >
                        {busy ? 'Gözlə…' : confirm.action === 'restore' ? 'Bərpa et' : 'Sil'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className='mt-[8px] flex gap-[8px]'>
                    <button
                      type='button'
                      onClick={() => setConfirm({ id: item.id, action: 'restore' })}
                      className='flex-1 rounded-[6px] border border-[#477A68] py-[8px] text-[13px] font-medium text-[#477A68] hover:bg-[#E3F1EC] dark:text-[#7FB598] dark:hover:bg-[#35302C]'
                    >
                      Bərpa et
                    </button>
                    <button
                      type='button'
                      onClick={() => setConfirm({ id: item.id, action: 'delete' })}
                      className='flex-1 rounded-[6px] bg-[#FCE5E0] py-[8px] text-[13px] font-medium text-[#A65B46] hover:bg-[#F6D9D2]'
                    >
                      Sil
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {status && (
          <p className='mt-[12px] rounded-[8px] bg-[#E3F1EC] p-[10px] text-[13px] text-[#477A68]'>{status}</p>
        )}
        {error && (
          <p className='mt-[12px] rounded-[8px] bg-[#FCE5E0] p-[10px] text-[13px] text-[#A65B46]'>{error}</p>
        )}
      </div>
    </div>
  )
}

export default SemestersModal
