import { useState } from 'react'
import { FiX } from 'react-icons/fi'
import { getSequenceIndex, resolveLessonType } from '../lib/subjects'
import { getWeekNumber, mondayOfWeek } from '../lib/weeks'
import { useEscapeKey } from '../lib/useEscapeKey'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'

const typeLabels = {
  lecture: 'Mühazirə',
  seminar: 'Seminar',
}

const frequencyLabels = {
  'every-week': 'Hər həftə',
  'upper-week': 'Üst həftə',
  'lower-week': 'Alt həftə',
}

const SearchModal = ({ subjects, onClose, onSelectLesson, weekSystem = 'double' }) => {
  const [query, setQuery] = useState('')
  useLockBodyScroll()
  useEscapeKey(onClose)
  const weekNumber = getWeekNumber(mondayOfWeek(new Date()))
  const showFrequency = weekSystem !== 'single'
  const searchable = showFrequency
    ? subjects
    : subjects.map((subject) => ({ ...subject, frequency: 'every-week' }))

  const normalizedQuery = query.trim().toLowerCase()
  const results = normalizedQuery
    ? searchable.filter((subject) => (
      subject.name.toLowerCase().includes(normalizedQuery)
      || (subject.teacher || '').toLowerCase().includes(normalizedQuery)
      || (subject.room || '').toLowerCase().includes(normalizedQuery)
    ))
    : []

  return (
    <div
      className='modal-overlay-in fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-0 sm:p-[20px]'
      role='dialog'
      aria-modal='true'
      aria-labelledby='search-title'
    >
      <div className='modal-card-in flex h-full max-h-full w-full max-w-none flex-col overflow-hidden rounded-none bg-[#FFF] text-[#333] shadow-xl sm:h-auto sm:max-h-[90vh] sm:max-w-[520px] sm:rounded-[14px] dark:bg-[#2A2724] dark:text-[#E8E2D9]'>
        <div className='flex shrink-0 items-center justify-between border-b border-[#EEE] bg-[#FFF] px-[24px] py-[18px] dark:border-[#4A4440] dark:bg-[#2A2724]'>
          <h2 id='search-title' className='text-[20px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Axtarış</h2>
          <button
            type='button'
            onClick={onClose}
            aria-label='Bağla'
            className='flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#F1EFE9] text-[18px] text-[#434140] hover:bg-[#E4E0D6] dark:bg-[#3A3632] dark:text-[#EDE8DF] dark:hover:bg-[#4A4440]'
          >
            <FiX aria-hidden='true' />
          </button>
        </div>

        <div className='px-[24px] pt-[16px]'>
          <input
            type='search'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Fənn, müəllim, otaq…'
            aria-label='Fənn axtarışı'
            autoFocus
            className='w-full rounded-[8px] border border-[#D8D5CE] bg-[#FAFAF8] p-[10px] text-[14px] outline-none focus:border-[#A65B46] dark:border-[#4A4440] dark:bg-[#201D1B] dark:text-[#E8E2D9]'
          />
        </div>

        <div className='min-h-[100px] flex-1 overflow-y-auto p-[24px]'>
          {!normalizedQuery ? (
            <p className='text-[14px] text-[#777] dark:text-[#A8A29E]'>Axtarmaq üçün yuxarıda yazın.</p>
          ) : results.length === 0 ? (
            <p className='text-[14px] text-[#777] dark:text-[#A8A29E]'>“{query.trim()}” üzrə nəticə yoxdur.</p>
          ) : (
            <div className='flex flex-col gap-[10px]'>
              {results.map((subject) => (
                <div key={subject.id} className='rounded-[8px] border border-[#EEE] bg-[#FFF] p-[12px] dark:border-[#4A4440] dark:bg-[#35302C]'>
                  <p className='truncate text-[14px] font-bold text-[#434140] dark:text-[#EDE8DF]'>{subject.name}</p>
                  <p className='mt-[2px] text-[12px] text-[#777] dark:text-[#A8A29E]'>
                    {[subject.teacher && `Müəllim: ${subject.teacher}`, subject.room && `Otaq: ${subject.room}`, showFrequency && frequencyLabels[subject.frequency]].filter(Boolean).join(' • ')}
                  </p>
                  <ul className='mt-[8px] flex flex-col gap-[6px]'>
                    {subject.schedule.map((lesson, lessonIndex) => {
                      const sequenceIndex = getSequenceIndex(subject, lessonIndex, weekNumber)
                      const type = resolveLessonType(subject, sequenceIndex)
                      return (
                        <li key={`${lesson.day}-${lesson.startTime}`}>
                          <button
                            type='button'
                            onClick={() => {
                              onSelectLesson({ subjectId: subject.id, sequenceIndex })
                              onClose()
                            }}
                            title='Cədvəldə göstər'
                            className='flex w-full items-center justify-between gap-[8px] rounded-[6px] bg-[#F7F3EC] px-[10px] py-[7px] text-left text-[13px] hover:bg-[#EFE6D2] dark:bg-[#201D1B] dark:hover:bg-[#2E2A26]'
                          >
                            <span className='truncate'>
                              <strong>{lesson.day}</strong> {lesson.startTime}–{lesson.endTime}
                            </span>
                            <span className={`shrink-0 rounded-full px-[8px] py-[2px] text-[12px] ${type === 'lecture' ? 'bg-[#FCE5E0] text-[#A65B46]' : 'bg-[#E3F1EC] text-[#477A68]'}`}>
                              {typeLabels[type]}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchModal
