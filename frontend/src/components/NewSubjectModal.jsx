import { useState } from 'react'
import { FiX } from 'react-icons/fi'
import { useEscapeKey } from '../lib/useEscapeKey'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'

const days = [
  'Bazar ertəsi',
  'Çərşənbə axşamı',
  'Çərşənbə',
  'Cümə axşamı',
  'Cümə',
  'Şənbə',
  'Bazar',
]

const buildDayDetails = (schedule = []) => {
  const details = {}
  for (const lesson of schedule) {
    if (lesson?.day) {
      details[lesson.day] = {
        startTime: lesson.startTime || lesson.time || '',
        endTime: lesson.endTime || '',
      }
    }
  }
  return details
}

const NewSubjectModal = ({ onClose, onSubmit, initialSubject = null, copyMode = false, preset = null }) => {
  const isCopyMode = Boolean(copyMode)
  const isEditMode = Boolean(initialSubject) && !isCopyMode
  const [selectedDays, setSelectedDays] = useState(() => {
    if (initialSubject) {
      return initialSubject.schedule.map((lesson) => lesson.day)
    }
    return preset ? preset.map((slot) => slot.day) : []
  })
  const [dayDetails, setDayDetails] = useState(() => ({
    ...buildDayDetails(initialSubject?.schedule),
    ...Object.fromEntries((preset || []).map((slot) => ([
      slot.day,
      { startTime: slot.startTime || '', endTime: slot.endTime || '' },
    ]))),
  }))
  const [subjectName, setSubjectName] = useState(initialSubject?.name || '')
  const [lectureCount, setLectureCount] = useState(initialSubject?.lectureCount ?? 2)
  const [seminarCount, setSeminarCount] = useState(initialSubject?.seminarCount ?? 1)
  const [frequency, setFrequency] = useState(initialSubject?.frequency || 'every-week')
  const [teacher, setTeacher] = useState(initialSubject?.teacher || '')
  const [room, setRoom] = useState(initialSubject?.room || '')
  const [error, setError] = useState('')
  useLockBodyScroll()
  useEscapeKey(onClose)

  const toggleDay = (day) => {
    setSelectedDays((currentDays) => (
      currentDays.includes(day)
        ? currentDays.filter((currentDay) => currentDay !== day)
        : [...currentDays, day]
    ))
  }

  const updateDayTime = (day, time) => {
    setDayDetails((currentDetails) => ({
      ...currentDetails,
      [day]: { ...currentDetails[day], startTime: time },
    }))
  }

  const updateDayEndTime = (day, time) => {
    setDayDetails((currentDetails) => ({
      ...currentDetails,
      [day]: { ...currentDetails[day], endTime: time },
    }))
  }

  const handleDayToggle = (day) => {
    toggleDay(day)
    setDayDetails((currentDetails) => ({
      ...currentDetails,
      [day]: currentDetails[day] || { startTime: '', endTime: '' },
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const totalLessons = Number(lectureCount) + Number(seminarCount)
    if (totalLessons === 0) {
      setError('Mühazirə və ya seminar sayı ən azı 1 olmalıdır.')
      return
    }

    if (!subjectName.trim()) {
      setError('Fənnin adını yaz.')
      return
    }

    if (selectedDays.length === 0) {
      setError('Ən azı bir dərs günü seçilməlidir.')
      return
    }

    const hasInvalidTime = selectedDays.some((day) => (
      !dayDetails[day]?.startTime
      || !dayDetails[day]?.endTime
      || dayDetails[day].endTime <= dayDetails[day].startTime
    ))
    if (hasInvalidTime) {
      setError('Hər dərs üçün başlanğıc və bitiş saatını düzgün yaz.')
      return
    }

    const orderedDays = [...selectedDays].sort((firstDay, secondDay) => (
      days.indexOf(firstDay) - days.indexOf(secondDay)
    ))
    const schedule = orderedDays.map((day) => ({
      day,
      startTime: dayDetails[day].startTime,
      endTime: dayDetails[day].endTime,
    }))

    const layoutChanged = isEditMode && (
      initialSubject.lectureCount !== Number(lectureCount)
      || initialSubject.seminarCount !== Number(seminarCount)
      || initialSubject.frequency !== frequency
      || JSON.stringify(initialSubject.schedule.map(({ day, startTime, endTime }) => ({ day, startTime, endTime })))
        !== JSON.stringify(schedule)
    )

    onSubmit({
      ...(initialSubject || {}),
      id: isCopyMode ? `${Date.now()}-${subjectName.trim()}` : (initialSubject?.id || `${Date.now()}-${subjectName.trim()}`),
      name: subjectName.trim(),
      lectureCount: Number(lectureCount),
      seminarCount: Number(seminarCount),
      frequency,
      schedule,
      teacher: teacher.trim(),
      room: room.trim(),
      overrides: (layoutChanged || isCopyMode) ? {} : (initialSubject?.overrides || {}),
    })
  }

  const title = isCopyMode ? 'Fənni kopyala' : isEditMode ? 'Fənni redaktə et' : 'Yeni fənn'
  const submitLabel = isCopyMode ? 'Kopyanı yarat' : isEditMode ? 'Yadda saxla' : 'Fənni əlavə et'

  return (
    <div
      className='modal-overlay-in fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-[20px]'
      role='dialog'
      aria-modal='true'
      aria-labelledby='new-subject-title'
    >
      <form
        onSubmit={handleSubmit}
        className='modal-card-in flex max-h-[90vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[14px] bg-[#FFF] text-[#333] shadow-xl'
      >
        <div className='flex shrink-0 items-center justify-between border-b border-[#EEE] bg-[#FFF] px-[24px] py-[18px]'>
          <h2 id='new-subject-title' className='text-[20px] font-bold text-[#434140]'>{title}</h2>
          <button
            type='button'
            onClick={onClose}
            aria-label='Modalı bağla'
            className='flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#F1EFE9] text-[18px] text-[#434140] hover:bg-[#E4E0D6]'
          >
            <FiX aria-hidden='true' />
          </button>
        </div>
        <div className='overflow-y-auto p-[24px]'>
        <label className='mb-[16px] block'>
          <span className='mb-[6px] block text-[13px] font-semibold text-[#434140]'>Fənnin adı</span>
          <input
            type='text'
            placeholder='Verilənlər Bazası'
            value={subjectName}
            onChange={(event) => setSubjectName(event.target.value)}
            required
            className='w-full rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] p-[10px] text-[14px] outline-none focus:border-[#A65B46]'
          />
        </label>

        <div className='mb-[16px] grid grid-cols-1 gap-[10px] sm:grid-cols-2'>
          <label className='block'>
            <span className='mb-[6px] block text-[13px] font-semibold text-[#434140]'>Müəllim</span>
            <input
              type='text'
              placeholder='Ad Soyad'
              value={teacher}
              onChange={(event) => setTeacher(event.target.value)}
              className='w-full rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] p-[10px] text-[14px] outline-none focus:border-[#A65B46]'
            />
          </label>
          <label className='block'>
            <span className='mb-[6px] block text-[13px] font-semibold text-[#434140]'>Otaq</span>
            <input
              type='text'
              placeholder='m. 301'
              value={room}
              onChange={(event) => setRoom(event.target.value)}
              className='w-full rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] p-[10px] text-[14px] outline-none focus:border-[#A65B46]'
            />
          </label>
        </div>

        <fieldset className='mb-[16px]'>
          <legend className='mb-[10px] text-[14px] font-bold text-[#434140]'>Dərs nisbəti</legend>
          <div className='flex gap-[10px]'>
            <label className='flex-1 rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] focus-within:border-[#A65B46]'>
              <span className='mb-[4px] block text-[13px] font-semibold text-[#434140]'>Mühazirə sayı</span>
              <input type='number' min='0' value={lectureCount} onChange={(event) => setLectureCount(Number(event.target.value))} className='w-full bg-transparent text-[16px] font-bold text-[#434140] outline-none' />
            </label>
            <label className='flex-1 rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] px-[12px] py-[10px] focus-within:border-[#A65B46]'>
              <span className='mb-[4px] block text-[13px] font-semibold text-[#434140]'>Seminar sayı</span>
              <input type='number' min='0' value={seminarCount} onChange={(event) => setSeminarCount(Number(event.target.value))} className='w-full bg-transparent text-[16px] font-bold text-[#434140] outline-none' />
            </label>
          </div>
        </fieldset>

        <fieldset className='mb-[16px]'>
          <legend className='mb-[10px] text-[14px] font-bold text-[#434140]'>Cədvəl</legend>
          <div className='flex flex-col gap-[8px]'>
            {days.map((day) => {
              const selected = selectedDays.includes(day)
              return (
                <div key={day} className={`rounded-[8px] border p-[10px] ${selected ? 'border-[#A65B46] bg-[#FDF8F5]' : 'border-[#EEE] bg-[#FFF]'}`}>
                  <label className='flex cursor-pointer items-center gap-[8px]'>
                    <input
                      type='checkbox'
                      checked={selected}
                      onChange={() => handleDayToggle(day)}
                      className='h-[16px] w-[16px] shrink-0 accent-[#A65B46]'
                    />
                    <span className='text-[14px] font-medium'>{day}</span>
                  </label>
                  {selected && (
                    <div className='mt-[10px] grid grid-cols-[1fr_14px_1fr] items-center gap-[8px]'>
                      <input
                        type='time'
                        value={dayDetails[day]?.startTime || ''}
                        onChange={(event) => updateDayTime(day, event.target.value)}
                        required
                        aria-label={`${day} üçün başlanğıc saatı`}
                        className='w-full rounded-[6px] border border-[#D8D5CE] bg-[#FFF] p-[8px] text-[14px] outline-none focus:border-[#A65B46]'
                      />
                      <span className='text-center text-[#999]'>-</span>
                      <input
                        type='time'
                        value={dayDetails[day]?.endTime || ''}
                        onChange={(event) => updateDayEndTime(day, event.target.value)}
                        required
                        aria-label={`${day} üçün bitiş saatı`}
                        className='w-full rounded-[6px] border border-[#D8D5CE] bg-[#FFF] p-[8px] text-[14px] outline-none focus:border-[#A65B46]'
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </fieldset>

        <fieldset className='mb-[20px]'>
          <legend className='mb-[10px] text-[14px] font-bold text-[#434140]'>Həftə tezliyi</legend>
          <div className='flex flex-col gap-[8px]'>
            {[
              { value: 'every-week', label: 'Hər həftə' },
              { value: 'upper-week', label: 'Yalnız Üst həftə' },
              { value: 'lower-week', label: 'Yalnız Alt həftə' },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-[10px] rounded-[8px] border px-[12px] py-[10px] text-[14px] ${frequency === option.value ? 'border-[#A65B46] bg-[#FDF8F5] font-medium' : 'border-[#D8D5CE] bg-[#FFF]'}`}
              >
                <input
                  type='radio'
                  name='frequency'
                  value={option.value}
                  checked={frequency === option.value}
                  onChange={(event) => setFrequency(event.target.value)}
                  className='h-[16px] w-[16px] shrink-0 accent-[#A65B46]'
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className='mb-[16px] rounded-[8px] bg-[#FCE5E0] p-[10px] text-[14px] text-[#A65B46]'>{error}</p>}

        <button
          type='submit'
          className='w-full rounded-[8px] bg-[#434140] py-[12px] font-medium text-[#E7D8C6] hover:bg-[#555250]'
        >
          {submitLabel}
        </button>
        </div>
      </form>
    </div>
  )
}

export default NewSubjectModal
