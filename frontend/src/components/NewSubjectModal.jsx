import { useState } from 'react'

const days = [
  'Bazar ertəsi',
  'Çərşənbə axşamı',
  'Çərşənbə',
  'Cümə axşamı',
  'Cümə',
  'Şənbə',
  'Bazar',
]

const NewSubjectModal = ({ onClose, onSubmit }) => {
  const [selectedDays, setSelectedDays] = useState([])
  const [dayDetails, setDayDetails] = useState({})
  const [subjectName, setSubjectName] = useState('')
  const [lectureCount, setLectureCount] = useState(2)
  const [seminarCount, setSeminarCount] = useState(1)
  const [frequency, setFrequency] = useState('every-week')
  const [error, setError] = useState('')

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
    const totalLessons = lectureCount + seminarCount
    if (totalLessons === 0) {
      setError('Mühazirə və ya seminar sayı ən azı 1 olmalıdır.')
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
    const generatedTypes = [
      ...Array(lectureCount).fill('lecture'),
      ...Array(seminarCount).fill('seminar'),
    ]

    onSubmit({
      id: `${Date.now()}-${subjectName}`,
      name: subjectName.trim(),
      lectureCount,
      seminarCount,
      frequency,
      schedule: orderedDays.map((day, index) => ({
        day,
        startTime: dayDetails[day].startTime,
        endTime: dayDetails[day].endTime,
        type: generatedTypes[index] || 'lecture',
      })),
    })
  }

  return (
    <div
      className='fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-[20px]'
      role='dialog'
      aria-modal='true'
      aria-labelledby='new-subject-title'
    >
      <form
        onSubmit={handleSubmit}
        className='max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-[8px] bg-[#FFF] p-[25px] text-[#333] shadow-lg'
      >
        <div className='mb-[20px] flex items-center justify-between'>
          <h2 id='new-subject-title' className='text-[22px] font-bold'>Yeni fənn</h2>
          <button
            type='button'
            onClick={onClose}
            aria-label='Modalı bağla'
            className='text-[24px] leading-none'
          >
            ×
          </button>
        </div>

        <label className='mb-[15px] block'>
          <span className='mb-[5px] block font-medium'>Fənnin adı:</span>
          <input
            type='text'
            placeholder='Verilənlər Bazası'
            value={subjectName}
            onChange={(event) => setSubjectName(event.target.value)}
            required
            className='w-full rounded-[5px] border border-[#AAA] p-[8px]'
          />
        </label>

        <fieldset className='mb-[15px]'>
          <legend className='mb-[8px] font-medium'>Dərs nisbəti (ardıcıllıq üzrə):</legend>
          <p className='mb-[8px] text-[12px] text-[#777]'>Bu saylar həftəlik gün sayı deyil. Dərslər keçirildikcə ardıcıllıqla tətbiq olunur.</p>
          <div className='flex gap-[15px]'>
            <label>
              <span className='mr-[5px]'>Mühazirə sayı:</span>
              <input type='number' min='0' value={lectureCount} onChange={(event) => setLectureCount(Number(event.target.value))} className='w-[60px] rounded-[5px] border border-[#AAA] p-[2px]' />
            </label>
            <label>
              <span className='mr-[5px]'>Seminar sayı:</span>
              <input type='number' min='0' value={seminarCount} onChange={(event) => setSeminarCount(Number(event.target.value))} className='w-[60px] rounded-[5px] border border-[#AAA] p-[2px]' />
            </label>
          </div>
        </fieldset>

        <fieldset className='mb-[15px]'>
          <legend className='mb-[8px] font-medium'>Cədvəl:</legend>
          <div className='mb-[6px] grid grid-cols-[minmax(0,1fr)_105px_14px_105px] items-center gap-[8px] px-[2px] text-[12px] text-[#777]'>
            <span />
            <span>Başlanğıc</span>
            <span />
            <span>Bitiş</span>
          </div>
          <div className='flex flex-col gap-[7px]'>
            {days.map((day) => (
              <div key={day} className='grid grid-cols-[minmax(0,1fr)_105px_14px_105px] items-center gap-[8px]'>
                <label className='flex min-w-0 items-center gap-[7px]'>
                  <input
                    type='checkbox'
                    checked={selectedDays.includes(day)}
                    onChange={() => handleDayToggle(day)}
                  />
                  <span className='truncate'>{day}</span>
                </label>
                <input
                  type='time'
                  value={dayDetails[day]?.startTime || ''}
                  onChange={(event) => updateDayTime(day, event.target.value)}
                  disabled={!selectedDays.includes(day)}
                  required={selectedDays.includes(day)}
                  aria-label={`${day} üçün başlanğıc saatı`}
                  className='w-full rounded-[6px] border border-[#AAA] bg-[#FFF] p-[6px] text-[14px] disabled:bg-[#EEE]'
                />
                <span className='text-center text-[#777]'>-</span>
                <input
                  type='time'
                  value={dayDetails[day]?.endTime || ''}
                  onChange={(event) => updateDayEndTime(day, event.target.value)}
                  disabled={!selectedDays.includes(day)}
                  required={selectedDays.includes(day)}
                  aria-label={`${day} üçün bitiş saatı`}
                  className='w-full rounded-[6px] border border-[#AAA] bg-[#FFF] p-[6px] text-[14px] disabled:bg-[#EEE]'
                />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className='mb-[20px]'>
          <legend className='mb-[8px] font-medium'>Həftə tezliyi:</legend>
          <div className='flex flex-col gap-[6px]'>
            <label><input type='radio' name='frequency' value='every-week' checked={frequency === 'every-week'} onChange={(event) => setFrequency(event.target.value)} className='mr-[6px]' />Hər həftə</label>
            <label><input type='radio' name='frequency' value='upper-week' checked={frequency === 'upper-week'} onChange={(event) => setFrequency(event.target.value)} className='mr-[6px]' />Yalnız Üst həftə</label>
            <label><input type='radio' name='frequency' value='lower-week' checked={frequency === 'lower-week'} onChange={(event) => setFrequency(event.target.value)} className='mr-[6px]' />Yalnız Alt həftə</label>
          </div>
        </fieldset>

        {error && <p className='mb-[15px] rounded-[5px] bg-[#FCE5E0] p-[8px] text-[#A65B46]'>{error}</p>}

        <button
          type='submit'
          className='w-full rounded-[5px] bg-[#434140] py-[9px] font-medium text-[#E7D8C6]'
        >
          Fənni əlavə et
        </button>
      </form>
    </div>
  )
}

export default NewSubjectModal
