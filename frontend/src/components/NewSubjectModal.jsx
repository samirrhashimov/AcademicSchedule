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

const NewSubjectModal = ({ onClose }) => {
  const [selectedDays, setSelectedDays] = useState([])
  const [dayTimes, setDayTimes] = useState({})

  const toggleDay = (day) => {
    setSelectedDays((currentDays) => (
      currentDays.includes(day)
        ? currentDays.filter((currentDay) => currentDay !== day)
        : [...currentDays, day]
    ))
  }

  const updateDayTime = (day, time) => {
    setDayTimes((currentTimes) => ({
      ...currentTimes,
      [day]: time,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onClose()
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
            required
            className='w-full rounded-[5px] border border-[#AAA] p-[8px]'
          />
        </label>

        <fieldset className='mb-[15px]'>
          <legend className='mb-[8px] font-medium'>Nisbət:</legend>
          <div className='flex gap-[15px]'>
            <label>
              <span className='mr-[5px]'>Mühazirə sayı:</span>
              <input type='number' min='0' defaultValue='2' className='w-[60px] rounded-[5px] border border-[#AAA] p-[2px]' />
            </label>
            <label>
              <span className='mr-[5px]'>Seminar sayı:</span>
              <input type='number' min='0' defaultValue='1' className='w-[60px] rounded-[5px] border border-[#AAA] p-[2px]' />
            </label>
          </div>
        </fieldset>

        <fieldset className='mb-[15px]'>
          <legend className='mb-[8px] font-medium'>Cədvəl:</legend>
          <div className='flex flex-col gap-[8px]'>
            {days.map((day) => (
              <div key={day} className='flex items-center justify-between gap-[10px]'>
                <label className='flex items-center gap-[5px]'>
                  <input
                    type='checkbox'
                    checked={selectedDays.includes(day)}
                    onChange={() => toggleDay(day)}
                  />
                  {day}
                </label>
                <input
                  type='time'
                  value={dayTimes[day] || ''}
                  onChange={(event) => updateDayTime(day, event.target.value)}
                  disabled={!selectedDays.includes(day)}
                  required={selectedDays.includes(day)}
                  aria-label={`${day} üçün saat`}
                  className='rounded-[5px] border border-[#AAA] p-[4px] disabled:bg-[#EEE]'
                />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className='mb-[20px]'>
          <legend className='mb-[8px] font-medium'>Həftə tezliyi:</legend>
          <div className='flex flex-col gap-[6px]'>
            <label><input type='radio' name='frequency' value='every-week' defaultChecked className='mr-[6px]' />Hər həftə</label>
            <label><input type='radio' name='frequency' value='upper-week' className='mr-[6px]' />Yalnız Üst həftə</label>
            <label><input type='radio' name='frequency' value='lower-week' className='mr-[6px]' />Yalnız Alt həftə</label>
          </div>
        </fieldset>

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
