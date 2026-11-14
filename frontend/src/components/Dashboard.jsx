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

const typeLabels = {
    lecture: 'Mühazirə',
    seminar: 'Seminar',
}

const hours = Array.from({ length: 13 }, (_, index) => index + 8)
const WEEK_MODE_STORAGE_KEY = 'academic-schedule-week-mode'

const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    return Math.ceil((((date - firstDayOfYear) / 86400000) + firstDayOfYear.getDay() + 1) / 7)
}

const getWeekMode = (weekNumber, weekStart) => {
    try {
        const savedMode = localStorage.getItem(WEEK_MODE_STORAGE_KEY)
        if (savedMode) {
            const parsedMode = JSON.parse(savedMode)
            if (parsedMode.weekNumber === weekNumber && ['upper-week', 'lower-week'].includes(parsedMode.mode)) {
                return parsedMode.mode
            }
            if (parsedMode.weekStart && ['upper-week', 'lower-week'].includes(parsedMode.mode)) {
                const savedWeekStart = new Date(parsedMode.weekStart)
                const weeksElapsed = Math.round((weekStart - savedWeekStart) / 604800000)
                if (weeksElapsed >= 0) {
                    return weeksElapsed % 2 === 0
                        ? parsedMode.mode
                        : parsedMode.mode === 'upper-week' ? 'lower-week' : 'upper-week'
                }
            }
        }
    } catch (error) {
        console.error('Həftə rejimi localStorage-dan oxunmadı:', error)
    }

    return weekNumber % 2 === 0 ? 'upper-week' : 'lower-week'
}

const getMonday = (date) => {
    const monday = new Date(date)
    const day = monday.getDay()
    const difference = day === 0 ? -6 : 1 - day
    monday.setDate(monday.getDate() + difference)
    monday.setHours(0, 0, 0, 0)
    return monday
}

const getStartTime = (lesson) => lesson.startTime || lesson.time

const getTimeHour = (lesson) => Number(getStartTime(lesson).split(':')[0])

const getDurationMinutes = (lesson) => {
    const startTime = getStartTime(lesson)
    const endTime = lesson.endTime || `${String(Number(startTime.split(':')[0]) + 1).padStart(2, '0')}:${startTime.split(':')[1]}`
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)
    return Math.max((endHour * 60 + endMinute) - (startHour * 60 + startMinute), 60)
}

const getSequenceIndex = (subject, lessonIndex, weekNumber) => {
    const weekIndex = subject.frequency === 'every-week'
        ? weekNumber
        : Math.floor(weekNumber / 2)
    return (weekIndex * subject.schedule.length) + lessonIndex
}

const getLessonType = (subject, sequenceIndex) => {
    const cycleLength = subject.lectureCount + subject.seminarCount
    if (!cycleLength) {
        return 'lecture'
    }

    const cycleIndex = (sequenceIndex + (subject.sequenceOffset || 0)) % cycleLength
    return cycleIndex < subject.lectureCount ? 'lecture' : 'seminar'
}

const SubjectMenu = ({ subjects, onRemoveSubject }) => (
    <aside className='w-full shrink-0 rounded-[8px] bg-[#434140] p-[15px] text-[#FFF] lg:w-[245px]'>
        <div className='mb-[15px] flex items-center justify-between'>
            <h2 className='text-[18px] font-bold'>Fənlərim</h2>
            <span className='rounded-full bg-[#A65B46] px-[8px] py-[2px] text-[12px]'>{subjects.length}</span>
        </div>
        {subjects.length === 0 ? (
            <p className='text-[14px] text-[#DDD]'>Hələ fənn əlavə edilməyib.</p>
        ) : (
            <div className='flex flex-col gap-[8px]'>
                {subjects.map((subject) => (
                    <div key={subject.id} className='rounded-[6px] bg-[#FFF] p-[10px] text-[#333]'>
                        <p className='font-medium'>{subject.name}</p>
                        <p className='mt-[3px] text-[12px] text-[#777]'>
                            {subject.lectureCount} mühazirə, {subject.seminarCount} seminar
                        </p>
                        <button
                            type='button'
                            onClick={() => onRemoveSubject(subject.id)}
                            className='mt-[8px] text-[12px] text-[#A65B46] underline'
                        >
                            Fənni sil
                        </button>
                    </div>
                ))}
            </div>
        )}
    </aside>
)

const CalendarEvent = ({ subject, lesson, sequenceIndex, onUpdateLessonType }) => {
    const type = getLessonType(subject, sequenceIndex)

    return (
    <div style={{ minHeight: `${Math.max((getDurationMinutes(lesson) / 60) * 82 - 8, 66)}px` }} className={`rounded-[5px] border-l-[4px] p-[7px] text-[13px] ${
        type === 'lecture'
            ? 'border-[#A65B46] bg-[#FCE5E0]'
            : 'border-[#477A68] bg-[#E3F1EC]'
    }`}>
        <p className='font-bold'>{getStartTime(lesson)} - {lesson.endTime || 'növbəti saat'}</p>
        <p className='truncate'>{subject.name}</p>
        <select
            value={type}
            onChange={(event) => onUpdateLessonType(subject.id, sequenceIndex, event.target.value)}
            aria-label={`${subject.name} üçün dərs tipi`}
            className='mt-[3px] max-w-full bg-transparent text-[12px] font-medium outline-none'
        >
            <option value='lecture'>{typeLabels.lecture}</option>
            <option value='seminar'>{typeLabels.seminar}</option>
        </select>
    </div>
    )
}

const Dashboard = ({ subjects, onRemoveSubject, onUpdateLessonType }) => {
    const today = new Date()
    const weekStart = getMonday(today)
    const weekNumber = getWeekNumber(today)
    const hasAlternatingWeeks = subjects.some((subject) => subject.frequency !== 'every-week')
    const [weekMode, setWeekMode] = useState(() => getWeekMode(weekNumber, weekStart))

    const changeWeekMode = (mode) => {
        setWeekMode(mode)
        localStorage.setItem(WEEK_MODE_STORAGE_KEY, JSON.stringify({
            weekNumber,
            weekStart: weekStart.toISOString(),
            mode,
        }))
    }
    const weekDays = (
        days.map((name, index) => {
            const date = new Date(weekStart)
            date.setDate(weekStart.getDate() + index)
            return { name, date }
        })
    )

    const activeSubjects = subjects.filter((subject) => (
        !hasAlternatingWeeks
        || subject.frequency === 'every-week'
        || subject.frequency === weekMode
    ))

    return (
        <div className='flex flex-col gap-[15px] pb-[30px]'>
            <div className='flex flex-col items-start gap-[15px] lg:flex-row'>
                <SubjectMenu subjects={subjects} onRemoveSubject={onRemoveSubject} />
                <main className='min-w-0 flex-1'>
                    <div className='mb-[10px] flex items-center justify-between'>
                        <div>
                            <h1 className='text-[22px] font-bold text-[#434140]'>Həftəlik cədvəl</h1>
                            <p className='text-[13px] text-[#666]'>Dərs tipini cədvəldən dəyişə bilərsən.</p>
                        </div>
                        <div className='flex flex-col items-end gap-[5px]'>
                            <span className='text-[13px] text-[#666]'>
                                {weekDays[0].date.toLocaleDateString('az-AZ', { day: '2-digit', month: 'short' })} - {weekDays[6].date.toLocaleDateString('az-AZ', { day: '2-digit', month: 'short' })}
                            </span>
                            {hasAlternatingWeeks ? (
                                <div className='flex overflow-hidden rounded-[5px] border border-[#A65B46] text-[12px]'>
                                    <button type='button' onClick={() => changeWeekMode('upper-week')} className={`px-[8px] py-[4px] ${weekMode === 'upper-week' ? 'bg-[#A65B46] text-[#FFF]' : 'bg-[#FFF] text-[#A65B46]'}`}>Üst həftə</button>
                                    <button type='button' onClick={() => changeWeekMode('lower-week')} className={`px-[8px] py-[4px] ${weekMode === 'lower-week' ? 'bg-[#A65B46] text-[#FFF]' : 'bg-[#FFF] text-[#A65B46]'}`}>Alt həftə</button>
                                </div>
                            ) : (
                                <span className='rounded-[5px] bg-[#434140] px-[8px] py-[4px] text-[12px] text-[#FFF]'>Tək həftə</span>
                            )}
                        </div>
                    </div>

                    <div className='overflow-x-auto rounded-[8px] bg-[#FFF] shadow-sm'>
                        <div className='min-w-[1050px]'>
                            <div className='grid grid-cols-[65px_repeat(7,minmax(130px,1fr))] border-b border-[#DDD]'>
                                <div className='border-r border-[#DDD] p-[8px]' />
                                {weekDays.map(({ name, date }) => (
                                    <div key={name} className={`border-r border-[#DDD] p-[8px] text-center ${date.toDateString() === today.toDateString() ? 'bg-[#FCE5E0]' : ''}`}>
                                        <p className='text-[12px] text-[#666]'>{name}</p>
                                        <p className='font-bold text-[#434140]'>{date.getDate()}</p>
                                    </div>
                                ))}
                            </div>

                            {hours.map((hour) => (
                                <div key={hour} className='grid min-h-[82px] grid-cols-[65px_repeat(7,minmax(130px,1fr))]'>
                                    <div className='border-b border-r border-[#DDD] p-[8px] text-right text-[12px] text-[#777]'>
                                        {String(hour).padStart(2, '0')}:00
                                    </div>
                                    {weekDays.map(({ name }) => (
                                        <div key={`${name}-${hour}`} className='border-b border-r border-[#DDD] p-[4px]'>
                                            {activeSubjects.flatMap((subject) => (
                                                subject.schedule
                                                    .map((lesson, lessonIndex) => ({
                                                        subject,
                                                        lesson,
                                                        sequenceIndex: getSequenceIndex(subject, lessonIndex, weekNumber),
                                                    }))
                                                    .filter(({ lesson }) => lesson.day === name && getTimeHour(lesson) === hour)
                                                    .map(({ subject, lesson, sequenceIndex }) => (
                                                        <CalendarEvent
                                                            key={`${subject.id}-${lesson.day}`}
                                                            subject={subject}
                                                            lesson={lesson}
                                                            sequenceIndex={sequenceIndex}
                                                            onUpdateLessonType={onUpdateLessonType}
                                                        />
                                                    ))
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    {subjects.length === 0 && (
                        <div className='mt-[15px] rounded-[8px] border border-dashed border-[#A65B46] p-[20px] text-center text-[#555]'>
                            Başlamaq üçün “+ Yeni Fənn” düyməsinə kliklə.
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default Dashboard
