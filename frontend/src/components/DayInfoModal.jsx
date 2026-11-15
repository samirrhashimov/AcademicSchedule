const getStartTime = (lesson) => lesson.startTime || lesson.time

const typeLabels = {
  lecture: 'Mühazirə',
  seminar: 'Seminar',
}

const toMinutes = (time) => {
  const [hour, minute] = String(time).split(':').map(Number)
  return hour * 60 + (minute || 0)
}

const LessonList = ({ lessons, nowMinutes, showState }) => {
  if (lessons.length === 0) {
    return <p className='text-[13px] text-[#777]'>Dərs yoxdur.</p>
  }
  return (
    <ul className='flex flex-col gap-[6px]'>
      {lessons.map(({ subject, lesson, sequenceIndex, type }) => {
        const start = toMinutes(getStartTime(lesson))
        const end = toMinutes(lesson.endTime || getStartTime(lesson))
        const state = nowMinutes < start ? 'gözləyir' : nowMinutes <= end ? 'indi' : 'bitib'
        return (
          <li key={`${subject.id}-${sequenceIndex}`} className='flex items-center justify-between gap-[8px] rounded-[5px] bg-[#F7F3EC] px-[8px] py-[6px] text-[13px]'>
            <span className='min-w-0 truncate'>
              <strong>{getStartTime(lesson)}</strong> {subject.name}
              <span className='text-[#777]'> • {typeLabels[type]}</span>
              {[subject.teacher, subject.room].filter(Boolean).length > 0 && (
                <span className='text-[#777]'> • {[subject.teacher, subject.room].filter(Boolean).join(' • ')}</span>
              )}
            </span>
            {showState && (
              <span className={`shrink-0 rounded-full px-[8px] py-[2px] text-[12px] ${state === 'indi' ? 'bg-[#477A68] text-[#FFF]' : 'bg-[#EEE] text-[#555]'}`}>
                {state}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

const DayInfoModal = ({ open, todayLessons, tomorrowLessons, tomorrowTitle, nowMinutes, onClose }) => {
  if (!open) {
    return null
  }

  return (
    <div
      className='fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-[20px]'
      role='dialog'
      aria-modal='true'
      aria-labelledby='day-info-title'
    >
      <div className='flex max-h-[90vh] w-full max-w-[420px] flex-col rounded-[8px] bg-[#FFF] p-[20px] text-[#333] shadow-lg'>
        <div className='mb-[12px] flex items-center justify-between'>
          <h2 id='day-info-title' className='text-[18px] font-bold'>Yaxınlıqdakılar</h2>
          <button
            type='button'
            onClick={onClose}
            aria-label='Bağla'
            className='rounded-[4px] px-[4px] text-[24px] leading-none hover:bg-[#EEE]'
          >
            ×
          </button>
        </div>
        <div className='flex flex-1 flex-col gap-[14px] overflow-y-auto'>
          <section>
            <h3 className='mb-[6px] text-[14px] font-bold text-[#434140]'>Bu gün</h3>
            <LessonList lessons={todayLessons} nowMinutes={nowMinutes} showState />
          </section>
          <section>
            <h3 className='mb-[6px] text-[14px] font-bold text-[#434140]'>{tomorrowTitle}</h3>
            <LessonList lessons={tomorrowLessons} nowMinutes={nowMinutes} showState={false} />
          </section>
        </div>
      </div>
    </div>
  )
}

export default DayInfoModal
