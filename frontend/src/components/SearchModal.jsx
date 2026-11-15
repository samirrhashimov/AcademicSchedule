import { useState } from 'react'
import { getSequenceIndex, resolveLessonType } from '../lib/subjects'

const typeLabels = {
  lecture: 'Mühazirə',
  seminar: 'Seminar',
}

const frequencyLabels = {
  'every-week': 'Hər həftə',
  'upper-week': 'Üst həftə',
  'lower-week': 'Alt həftə',
}

const getWeekNumber = (date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  return Math.ceil((((date - firstDayOfYear) / 86400000) + firstDayOfYear.getDay() + 1) / 7)
}

const SearchModal = ({ subjects, onClose }) => {
  const [query, setQuery] = useState('')
  const weekNumber = getWeekNumber(new Date())

  const normalizedQuery = query.trim().toLowerCase()
  const results = normalizedQuery
    ? subjects.filter((subject) => (
      subject.name.toLowerCase().includes(normalizedQuery)
      || (subject.teacher || '').toLowerCase().includes(normalizedQuery)
      || (subject.room || '').toLowerCase().includes(normalizedQuery)
    ))
    : []

  return (
    <div
      className='fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-[20px]'
      role='dialog'
      aria-modal='true'
      aria-labelledby='search-title'
    >
      <div className='flex max-h-[90vh] w-full max-w-[520px] flex-col rounded-[8px] bg-[#FFF] p-[25px] text-[#333] shadow-lg'>
        <div className='mb-[15px] flex items-center justify-between'>
          <h2 id='search-title' className='text-[22px] font-bold'>Axtarış</h2>
          <button
            type='button'
            onClick={onClose}
            aria-label='Bağla'
            className='text-[24px] leading-none'
          >
            ×
          </button>
        </div>

        <input
          type='search'
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='Fənn, müəllim, otaq…'
          aria-label='Fənn axtarışı'
          autoFocus
          className='mb-[15px] w-full rounded-[5px] border border-[#AAA] p-[8px] text-[14px]'
        />

        <div className='min-h-[100px] flex-1 overflow-y-auto'>
          {!normalizedQuery ? (
            <p className='text-[14px] text-[#777]'>Axtarmaq üçün yuxarıda yazın.</p>
          ) : results.length === 0 ? (
            <p className='text-[14px] text-[#777]'>“{query.trim()}” üzrə nəticə yoxdur.</p>
          ) : (
            <div className='flex flex-col gap-[10px]'>
              {results.map((subject) => (
                <div key={subject.id} className='rounded-[6px] border border-[#DDD] p-[10px]'>
                  <p className='flex items-center gap-[6px] font-medium'>
                    <span
                      className='inline-block h-[10px] w-[10px] shrink-0 rounded-full'
                      style={{ backgroundColor: subject.color || '#A65B46' }}
                    />
                    <span className='truncate'>{subject.name}</span>
                  </p>
                  <p className='mt-[2px] text-[12px] text-[#777]'>
                    {[subject.teacher, subject.room, frequencyLabels[subject.frequency]].filter(Boolean).join(' • ')}
                  </p>
                  <ul className='mt-[6px] flex flex-col gap-[4px]'>
                    {subject.schedule.map((lesson, lessonIndex) => {
                      const sequenceIndex = getSequenceIndex(subject, lessonIndex, weekNumber)
                      const type = resolveLessonType(subject, sequenceIndex)
                      return (
                        <li
                          key={`${lesson.day}-${lesson.startTime}`}
                          className='flex items-center justify-between gap-[8px] rounded-[5px] bg-[#F7F3EC] px-[8px] py-[5px] text-[13px]'
                        >
                          <span className='truncate'>
                            <strong>{lesson.day}</strong> {lesson.startTime}–{lesson.endTime}
                          </span>
                          <span className={`shrink-0 rounded-full px-[8px] py-[2px] text-[12px] ${type === 'lecture' ? 'bg-[#FCE5E0] text-[#A65B46]' : 'bg-[#E3F1EC] text-[#477A68]'}`}>
                            {typeLabels[type]}
                          </span>
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
