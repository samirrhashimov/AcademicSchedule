import { Suspense, lazy, useState } from 'react'
import { FiBell, FiCamera, FiMoon, FiSun } from 'react-icons/fi'
import { fetchTemplate, fetchTemplatePreview } from '../lib/api'
import { normalizeSubject } from '../lib/subjects'
import { parseScannedCode } from '../lib/templateCode'
import { notificationsEnabled, setNotificationsEnabled } from '../lib/notifications'
import { isOneSignalConfigured, optInPush } from '../lib/onesignal'
import NewSubjectModal from './NewSubjectModal'

const QrScanner = lazy(() => import('./QrScanner'))

const TOTAL_STEPS = 5

const primaryBtn = 'rounded-[8px] bg-[#434140] py-[12px] text-[14px] font-medium text-[#E7D8C6] hover:bg-[#555250] disabled:opacity-60 dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
const ghostBtn = 'rounded-[8px] border border-[#D8D5CE] py-[12px] text-[14px] font-medium text-[#434140] hover:bg-[#F7F3EC] dark:border-[#4A4440] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'

const Onboarding = ({ weekSystem, onWeekSystemChange, theme, onSelectTheme, onAddSubject, onBulkImport, onMarkSeen, onDone }) => {
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [tMode, setTMode] = useState(false)
  const [tCode, setTCode] = useState('')
  const [tPreview, setTPreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [notifOn, setNotifOn] = useState(notificationsEnabled)
  const [notifMsg, setNotifMsg] = useState(null)

  const handleCheckCode = async (explicitCode) => {
    const clean = (explicitCode ?? tCode).trim().toUpperCase()
    if (!clean || busy) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      setTPreview(await fetchTemplatePreview(clean))
    } catch (err) {
      setError(err.message || 'Şablon tapılmadı.')
    } finally {
      setBusy(false)
    }
  }

  const handleScanDetected = (text) => {
    const clean = parseScannedCode(text)
    setTCode(clean.toUpperCase())
    setScanning(false)
    handleCheckCode(clean)
  }

  const handleLoadTemplate = async () => {
    if (!tPreview || busy) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      const template = await fetchTemplate(tPreview.code)
      const fresh = template.subjects.map((subject) => normalizeSubject({ ...subject, id: undefined }))
      await onBulkImport(fresh)
      onMarkSeen()
      setStep(3)
    } catch (err) {
      setError(err.message || 'Şablon yüklənmədi.')
    } finally {
      setBusy(false)
    }
  }

  const handleEnableNotif = async () => {
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

  return (
    <div className='flex min-h-screen items-center justify-center bg-[#FAFAF8] p-[20px] dark:bg-[#201D1B]'>
      <div className='w-full max-w-[520px] rounded-[14px] border border-[#D8D5CE] bg-[#FFF] p-[24px] dark:border-[#4A4440] dark:bg-[#2A2724]'>
        <div className='mb-[20px] flex items-center justify-between'>
          <div className='flex gap-[6px]' aria-hidden='true'>
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <span key={`step-${index}`} className={`h-[6px] w-[24px] rounded-full ${index <= step ? 'bg-[#A65B46]' : 'bg-[#E4E0D6] dark:bg-[#4A4440]'}`} />
            ))}
          </div>
          <button
            type='button'
            onClick={onDone}
            className='text-[13px] text-[#777] hover:underline dark:text-[#A8A29E]'
          >
            Keç
          </button>
        </div>

        {step === 0 && (
          <>
            <h1 className='font-["Trirong"] text-[28px] font-bold text-[#434140] dark:text-[#EDE8DF]'>AcademicSchedule</h1>
            <p className='mt-[12px] text-[15px] text-[#666] dark:text-[#A8A29E]'>
              Xoş gəldin! Fənnləri cədvələ bir dəfə əlavə edəcəksən. Daha sonra növbəti dərsin mühazirə, yoxsa seminar olduğu avtomatik hesablanacaq və vaxtı çatanda sənə bildiriş göndəriləcək.
            </p>
            <button type='button' onClick={() => setStep(1)} className={`mt-[24px] w-full ${primaryBtn}`}>
              Davam et
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className='text-[22px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Cədvəlin tipi</h1>
            <p className='mb-[16px] mt-[8px] text-[14px] text-[#777] dark:text-[#A8A29E]'>
              Cədvəlin hər həftə eyni, yoxsa növbəli qrafiklə olacaq?
            </p>
            <div className='flex overflow-hidden rounded-[8px] border border-[#D8D5CE] text-[14px] dark:border-[#4A4440]' role='group' aria-label='Həftə sistemi'>
              {[
                { value: 'single', label: 'Tək həftə', numeral: 'I' },
                { value: 'double', label: 'Cüt həftə', numeral: 'II' },
              ].map((option) => (
                <button
                  key={option.value}
                  type='button'
                  onClick={() => onWeekSystemChange(option.value)}
                  aria-pressed={weekSystem === option.value}
                  className={`flex flex-1 items-center justify-center gap-[6px] px-[10px] py-[12px] font-medium ${weekSystem === option.value ? 'bg-[#A65B46] font-bold text-[#FFF]' : 'bg-[#FFF] text-[#434140] hover:bg-[#F7F3EC] dark:bg-[#2A2724] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'}`}
                >
                  <span aria-hidden='true' className='font-bold'>{option.numeral} -</span>
                  {option.label}
                </button>
              ))}
            </div>
            <div className='mt-[16px] flex gap-[10px]'>
              <button type='button' onClick={() => setStep(0)} className={`flex-1 ${ghostBtn}`}>Geri</button>
              <button type='button' onClick={() => setStep(2)} className={`flex-1 ${primaryBtn}`}>Davam et</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className='text-[22px] font-bold text-[#434140] dark:text-[#EDE8DF]'>İlk addım</h1>
            <p className='mb-[16px] mt-[8px] text-[14px] text-[#777] dark:text-[#A8A29E]'>
              Cədvəli özün qura və ya dostlarından şablon olaraq götürə bilərsən.
            </p>
            {!tMode ? (
              <div className='flex flex-col gap-[10px]'>
                <button type='button' onClick={() => setShowManual(true)} className={`w-full ${primaryBtn}`}>
                  Əl ilə əlavə et
                </button>
                <button type='button' onClick={() => setTMode(true)} className={`w-full ${ghostBtn}`}>
                  Şablon kodu
                </button>
              </div>
            ) : !tPreview ? (
              scanning ? (
                <Suspense fallback={<p className='py-[20px] text-center text-[14px] text-[#777] dark:text-[#A8A29E]'>Gözlə…</p>}>
                  <QrScanner onDetected={handleScanDetected} onBack={() => setScanning(false)} />
                </Suspense>
              ) : (
                <div className='flex flex-col gap-[10px]'>
                  <input
                    type='text'
                    value={tCode}
                    onChange={(event) => setTCode(event.target.value.toUpperCase())}
                    placeholder='Məsələn: K7QX2P'
                    maxLength={12}
                    autoFocus
                    aria-label='Şablon kodu'
                    className='w-full rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] p-[10px] text-center text-[18px] font-bold tracking-[0.2em] text-[#434140] outline-none focus:border-[#A65B46] dark:border-[#4A4440] dark:bg-[#201D1B] dark:text-[#E8E2D9]'
                  />
                  <button
                    type='button'
                    onClick={() => setScanning(true)}
                    className={`flex w-full items-center justify-center gap-[6px] ${ghostBtn}`}
                  >
                    <FiCamera aria-hidden='true' />
                    Skan et
                  </button>
                  <div className='flex gap-[10px]'>
                    <button type='button' onClick={() => setTMode(false)} className={`flex-1 ${ghostBtn}`}>Geri</button>
                    <button type='button' onClick={() => handleCheckCode()} disabled={busy} className={`flex-1 ${primaryBtn}`}>
                      {busy ? 'Gözlə…' : 'Yoxla'}
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className='flex flex-col gap-[10px]'>
                <div className='rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] dark:border-[#4A4440] dark:bg-[#201D1B]'>
                  <p className='truncate text-[15px] font-bold text-[#434140] dark:text-[#EDE8DF]'>{tPreview.name}</p>
                  <p className='text-[12px] text-[#777] dark:text-[#A8A29E]'>{tPreview.subjectCount} fənn</p>
                </div>
                <div className='flex gap-[10px]'>
                  <button type='button' onClick={() => setTPreview(null)} disabled={busy} className={`flex-1 ${ghostBtn}`}>
                    Ləğv et
                  </button>
                  <button type='button' onClick={handleLoadTemplate} disabled={busy} className={`flex-1 ${primaryBtn}`}>
                    {busy ? 'Gözlə…' : 'Yüklə'}
                  </button>
                </div>
              </div>
            )}
            {error && (
              <p className='mt-[12px] rounded-[8px] bg-[#FCE5E0] p-[10px] text-[13px] text-[#A65B46]'>{error}</p>
            )}
            <div className='mt-[16px]'>
              <button type='button' onClick={() => setStep(1)} className={`w-full ${ghostBtn}`}>Geri</button>
              <button type='button' onClick={() => setStep(3)} className='mt-[8px] w-full text-center text-[13px] text-[#777] hover:underline dark:text-[#A8A29E]'>Hələlik boş keç</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className='flex items-center gap-[8px] text-[22px] font-bold text-[#434140] dark:text-[#EDE8DF]'>
              <FiBell aria-hidden='true' />
              Xatırlatmalar
            </h1>
            <p className='mb-[16px] mt-[8px] text-[14px] text-[#777] dark:text-[#A8A29E]'>
              Dərs başlamazdan əvvəl bildiriş al. Vaxtı ayarlardan dəyişə bilərsən.
            </p>
            {notifOn ? (
              <p className='rounded-[8px] bg-[#E3F1EC] p-[10px] text-[14px] text-[#477A68]'>Aktivdir.</p>
            ) : (
              <button type='button' onClick={handleEnableNotif} className={`w-full ${primaryBtn}`}>
                Aktivləşdir
              </button>
            )}
            {notifMsg && (
              <p className='mt-[12px] rounded-[8px] bg-[#FCE5E0] p-[10px] text-[13px] text-[#A65B46]'>{notifMsg}</p>
            )}
            <div className='mt-[16px] flex gap-[10px]'>
              <button type='button' onClick={() => setStep(2)} className={`flex-1 ${ghostBtn}`}>Geri</button>
              <button type='button' onClick={() => setStep(4)} className={`flex-1 ${primaryBtn}`}>Davam et</button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className='text-[22px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Görünüş</h1>
            <p className='mb-[16px] mt-[8px] text-[14px] text-[#777] dark:text-[#A8A29E]'>
              İstəyinə uyğun görünüş rejimini seç.
            </p>
            <div className='flex overflow-hidden rounded-[8px] border border-[#D8D5CE] text-[14px] dark:border-[#4A4440]' role='group' aria-label='Rəng rejimi'>
              {[
                { value: 'light', label: 'Açıq', icon: FiSun },
                { value: 'dark', label: 'Tünd', icon: FiMoon },
              ].map((option) => (
                <button
                  key={option.value}
                  type='button'
                  onClick={() => onSelectTheme(option.value)}
                  aria-pressed={theme === option.value}
                  className={`flex flex-1 items-center justify-center gap-[6px] px-[10px] py-[12px] font-medium ${theme === option.value ? 'bg-[#A65B46] font-bold text-[#FFF]' : 'bg-[#FFF] text-[#434140] hover:bg-[#F7F3EC] dark:bg-[#2A2724] dark:text-[#EDE8DF] dark:hover:bg-[#35302C]'}`}
                >
                  <option.icon aria-hidden='true' />
                  {option.label}
                </button>
              ))}
            </div>
            <div className='mt-[16px] flex gap-[10px]'>
              <button type='button' onClick={() => setStep(3)} className={`flex-1 ${ghostBtn}`}>Geri</button>
              <button type='button' onClick={onDone} className={`flex-1 ${primaryBtn}`}>Bitir</button>
            </div>
          </>
        )}
      </div>
      {showManual && (
        <NewSubjectModal
          weekSystem={weekSystem}
          onClose={() => setShowManual(false)}
          onSubmit={(subject) => {
            onAddSubject(subject)
            setShowManual(false)
            onMarkSeen()
            setStep(3)
          }}
        />
      )}
    </div>
  )
}

export default Onboarding
