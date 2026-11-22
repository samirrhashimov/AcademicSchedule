import { useEffect, useRef, useState } from 'react'
import { FiBookOpen, FiChevronDown, FiChevronsLeft, FiChevronsRight, FiChevronLeft, FiChevronRight, FiClock, FiCopy, FiEdit2, FiMapPin, FiPlus, FiTrash2, FiUser, FiX } from 'react-icons/fi'
import { useEscapeKey } from '../lib/useEscapeKey'
import { useGlobalShortcuts } from '../lib/useGlobalShortcuts'
import { useLockBodyScroll } from '../lib/useLockBodyScroll'
import DayInfoModal from './DayInfoModal'
import NewSubjectModal from './NewSubjectModal'
import { getSequenceIndex, isLessonVisible, resolveLessonType } from '../lib/subjects'
import {
  addWeeks,
  baseModeForWeek,
  getWeekNumber,
  parseDayKey,
  reanchorWeekState,
  resolveWeekType,
  stepWeekday,
  toDayKey,
  withWeekOverride,
} from '../lib/weeks'

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

const toMinutes = (time) => {
    const [hour, minute] = String(time).split(':').map(Number)
    return hour * 60 + (minute || 0)
}

const formatMinutes = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

const HOUR_PX = 82

const getEndTime = (lesson) => {
    const startTime = getStartTime(lesson)
    return lesson.endTime || `${String(Number(startTime.split(':')[0]) + 1).padStart(2, '0')}:${startTime.split(':')[1]}`
}

// Üst-üstə düşən dərsləri gün sütununda yan-yana düzür (lane/laneCount).
const layoutDayEvents = (events) => {
    const positioned = []
    let cluster = []
    let clusterEnd = -1
    const flushCluster = () => {
        const laneEnds = []
        for (const ev of cluster) {
            const start = toMinutes(getStartTime(ev.lesson))
            const end = toMinutes(getEndTime(ev.lesson))
            let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start)
            if (lane === -1) {
                laneEnds.push(end)
                lane = laneEnds.length - 1
            } else {
                laneEnds[lane] = end
            }
            positioned.push({ ...ev, lane, laneCount: 0, start, end })
        }
        const count = Math.max(laneEnds.length, 1)
        for (let i = positioned.length - cluster.length; i < positioned.length; i += 1) {
            positioned[i].laneCount = count
        }
        cluster = []
        clusterEnd = -1
    }
    for (const ev of events) {
        const start = toMinutes(getStartTime(ev.lesson))
        if (cluster.length > 0 && start >= clusterEnd) {
            flushCluster()
        }
        cluster.push(ev)
        clusterEnd = Math.max(clusterEnd, toMinutes(getEndTime(ev.lesson)))
    }
    if (cluster.length > 0) {
        flushCluster()
    }
    return positioned
}

// Cədvəl və mobil siyahı baxılan həftəyə, "Yaxınlıqdakılar" həmişə real həftəyə baxır.
// mode verilməsə tezlik süzgəci işləmir (hamısı göstərilir).
const lessonsIn = (list, dayName, weekNum, mode = null) => (
    list.flatMap((subject) => (
        subject.schedule
            .map((lesson, lessonIndex) => ({
                subject,
                lesson,
                sequenceIndex: getSequenceIndex(subject, lesson, lessonIndex, weekNum),
            }))
            .filter(({ subject: item, lesson }) => lesson.day === dayName && (!mode || isLessonVisible(item, lesson, mode)))
            .map(({ subject, lesson, sequenceIndex }) => ({
                subject,
                lesson,
                sequenceIndex,
                type: resolveLessonType(subject, sequenceIndex),
            }))
    )).sort((a, b) => toMinutes(getStartTime(a.lesson)) - toMinutes(getStartTime(b.lesson)))
)

const visibleSubjects = (list, mode) => (
    list.filter((subject) => subject.schedule.some((lesson) => isLessonVisible(subject, lesson, mode)))
)

// Çap üçün: yalnız dərs olan saatlar — boş sətirlər çap olunmur.
const getContentHours = (allLessons) => {
    if (allLessons.length === 0) {
        return []
    }
    const minStart = Math.min(...allLessons.map((lesson) => toMinutes(getStartTime(lesson))))
    const maxEnd = Math.max(...allLessons.map((lesson) => toMinutes(getEndTime(lesson))))
    const from = Math.floor(minStart / 60)
    const to = Math.floor((maxEnd - 1) / 60)
    return Array.from({ length: Math.max(to - from + 1, 1) }, (_, index) => from + index)
}

const PrintSchedules = ({ subjects, weekState }) => {
    const today = new Date()
    const todayStr = today.toDateString()
    const currentMonday = getMonday(today)
    const anchorMonday = parseDayKey(weekState.anchorWeekStart) || currentMonday
    const anchorMode = ['upper-week', 'lower-week'].includes(weekState.anchorMode) ? weekState.anchorMode : 'upper-week'

    const weeks = weekState.system === 'single'
        ? [{ mode: null, monday: currentMonday }]
        : ['upper-week', 'lower-week'].map((mode) => (
            baseModeForWeek(anchorMonday, anchorMode, currentMonday) === mode
                ? { mode, monday: currentMonday }
                : { mode, monday: addWeeks(currentMonday, 1) }
        ))

    return (
        <div className='hidden print:block'>
            {weeks.map(({ mode, monday }) => {
                const weekNumber = getWeekNumber(monday)
                const active = !mode
                    ? subjects.map((subject) => ({
                        ...subject,
                        frequency: 'every-week',
                        schedule: subject.schedule.map((lesson) => ({ ...lesson, frequency: 'every-week' })),
                    }))
                    : visibleSubjects(subjects, mode)
                const byDay = days.map((name, index) => {
                    const date = new Date(monday)
                    date.setDate(monday.getDate() + index)
                    return { name, date, lessons: lessonsIn(active, name, weekNumber, mode) }
                })
                const contentHours = getContentHours(byDay.flatMap(({ lessons }) => lessons.map(({ lesson }) => lesson)))
                return (
                    <section key={mode || 'single'} className='mb-[16px]'>
                        {mode && (
                            <h2 className='mb-[8px] ml-[6mm] text-[16px] font-bold text-[#434140]'>
                                {mode === 'upper-week' ? 'Üst həftə' : 'Alt həftə'}
                            </h2>
                        )}
                        {contentHours.length === 0 ? (
                            <p className='ml-[6mm] text-[13px] text-[#777]'>Bu həftə dərs yoxdur.</p>
                        ) : (
                            <div className='grid grid-cols-[52px_repeat(7,minmax(0,1fr))] border-b border-[#DDD]'>
                                <div />
                                {byDay.map(({ name }) => (
                                    <div key={name} className='border-r border-[#DDD] p-[4px] text-center'>
                                        <p className='text-[12px] text-[#666]'>{name}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {contentHours.length > 0 && (
                            <div className='grid grid-cols-[52px_repeat(7,minmax(0,1fr))]'>
                                <div className='relative' style={{ height: `${contentHours.length * HOUR_PX}px` }}>
                                    {contentHours.map((hour) => (
                                        <div
                                            key={hour}
                                            className='absolute right-[6px] text-right text-[11px] tabular-nums text-[#999]'
                                            style={{ top: `${(hour - contentHours[0]) * HOUR_PX + 5}px` }}
                                        >
                                            {String(hour).padStart(2, '0')}:00
                                        </div>
                                    ))}
                                </div>
                                {byDay.map(({ name, date, lessons }) => (
                                    <div
                                        key={name}
                                        className={`relative border-l border-[#DDD] ${date.toDateString() === todayStr ? 'bg-[#FCE5E0]/50' : ''}`}
                                        style={{ height: `${contentHours.length * HOUR_PX}px` }}
                                    >
                                        {contentHours.map((hour) => (
                                            <div
                                                key={hour}
                                                className='absolute left-0 right-0 border-t border-[#DDD]'
                                                style={{ top: `${(hour - contentHours[0]) * HOUR_PX}px` }}
                                            />
                                        ))}
                                        {layoutDayEvents(lessons).map(({ subject, lesson, sequenceIndex, lane, laneCount, start, end, type }) => (
                                            <div
                                                key={`${subject.id}-${sequenceIndex}`}
                                                className='absolute'
                                                style={{
                                                    top: `${((start - contentHours[0] * 60) / 60) * HOUR_PX}px`,
                                                    height: `${Math.max(((end - start) / 60) * HOUR_PX, 60)}px`,
                                                    left: `calc(${(lane / laneCount) * 100}% + 3px)`,
                                                    width: `calc(${100 / laneCount}% - 6px)`,
                                                }}
                                            >
                                                <div className={`print-exact h-full overflow-hidden rounded-[5px] border-l-[4px] p-[7px] text-[13px] text-[#333] ${type === 'lecture' ? 'border-[#A65B46] bg-[#FCE5E0]' : 'border-[#477A68] bg-[#E3F1EC]'}`}>
                                                    <p className='font-bold'>{getStartTime(lesson)} - {lesson.endTime || 'növbəti saat'}</p>
                                                    <p className='truncate font-medium'>{subject.name}</p>
                                                    <p className='text-[12px] font-medium text-[#666]'>{type === 'lecture' ? 'Mühazirə' : 'Seminar'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )
            })}
        </div>
    )
}

const isOverridden = (subject, sequenceIndex) => (
    Boolean(subject.overrides && subject.overrides[String(sequenceIndex)])
)

const getVisibleHours = (activeSubjects, mode) => {
    let minHour = 8
    let maxHour = 20
    for (const subject of activeSubjects) {
        for (const lesson of subject.schedule) {
            if (!isLessonVisible(subject, lesson, mode)) {
                continue
            }
            const start = getStartTime(lesson)
            if (!start) {
                continue
            }
            minHour = Math.min(minHour, getTimeHour(lesson))
            const endHour = lesson.endTime
                ? Number(lesson.endTime.split(':')[0]) + (Number(lesson.endTime.split(':')[1]) > 0 ? 1 : 0)
                : getTimeHour(lesson) + 1
            maxHour = Math.max(maxHour, endHour)
        }
    }
    return Array.from({ length: maxHour - minHour + 1 }, (_, index) => minHour + index)
}

const findConflicts = (activeSubjects, mode) => {
    const byDay = {}
    for (const subject of activeSubjects) {
        for (const lesson of subject.schedule) {
            if (!isLessonVisible(subject, lesson, mode)) {
                continue
            }
            if (!byDay[lesson.day]) {
                byDay[lesson.day] = []
            }
            byDay[lesson.day].push({
                subject,
                lesson,
                start: toMinutes(getStartTime(lesson)),
                end: toMinutes(lesson.endTime || getStartTime(lesson)),
            })
        }
    }

    const conflicts = []
    for (const [day, lessons] of Object.entries(byDay)) {
        const sorted = [...lessons].sort((a, b) => a.start - b.start)
        for (let i = 1; i < sorted.length; i += 1) {
            if (sorted[i].start < sorted[i - 1].end) {
                conflicts.push({ day, first: sorted[i - 1], second: sorted[i] })
            }
        }
    }
    return conflicts
}

const SubjectMenu = ({ subjects, onRequestRemoveSubject, onEditSubject, onDuplicateSubject, onAddSubject }) => (
    <aside className='w-full rounded-[12px] bg-[#434140] p-[16px] text-[#FFF] lg:w-[250px]'>
        <div className='mb-[12px] flex items-center justify-between gap-[8px]'>
            <span className='flex items-center gap-[8px]'>
                <span className='text-[17px] font-bold'>Fənlərim</span>
                <span className='min-w-[26px] rounded-full bg-[#E7D8C6] px-[8px] py-[3px] text-center text-[12px] font-bold tabular-nums text-[#434140]'>{subjects.length}</span>
            </span>
            <button
                type='button'
                onClick={onAddSubject}
                aria-label='Yeni fənn'
                title='Yeni fənn'
                className='rounded-full p-[6px] text-[18px] leading-none text-[#E7D8C6] hover:bg-[#555250]'
            >
                <FiPlus aria-hidden='true' />
            </button>
        </div>
        {subjects.length === 0 ? (
            <div className='rounded-[8px] border border-dashed border-[#6B6862] p-[16px] text-center text-[13px] text-[#DDD]'>
                Hələ fənn əlavə edilməyib.
            </div>
        ) : (
            <div className='flex flex-col gap-[10px]'>
                {subjects.map((subject) => (
                    <div key={subject.id} className='rounded-[8px] bg-[#FFF] p-[12px] text-[#333] dark:bg-[#2A2724] dark:text-[#E8E2D9]'>
                        <p className='truncate text-[14px] font-bold'>{subject.name}</p>
                        <p className='mt-[6px] flex items-center gap-[6px] text-[12px] text-[#777] dark:text-[#A8A29E]'>
                            <FiBookOpen aria-hidden='true' className='shrink-0' />
                            <span>{subject.lectureCount} müh. • {subject.seminarCount} sem.</span>
                        </p>
                        {subject.teacher && (
                            <p className='mt-[4px] flex items-center gap-[6px] text-[12px] text-[#777] dark:text-[#A8A29E]'>
                                <FiUser aria-hidden='true' className='shrink-0' />
                                <span className='truncate'>{subject.teacher}</span>
                            </p>
                        )}
                        {subject.room && (
                            <p className='mt-[4px] flex items-center gap-[6px] text-[12px] text-[#777] dark:text-[#A8A29E]'>
                                <FiMapPin aria-hidden='true' className='shrink-0' />
                                <span className='truncate'>Otaq: {subject.room}</span>
                            </p>
                        )}
                        <div className='mt-[10px] flex items-center gap-[4px] border-t border-[#EEE] pt-[8px] dark:border-[#4A4440]'>
                            <button
                                type='button'
                                onClick={() => onEditSubject(subject)}
                                aria-label='Redaktə et'
                                title='Redaktə et'
                                className='flex flex-1 items-center justify-center rounded-[6px] p-[7px] text-[15px] leading-none text-[#477A68] hover:bg-[#E3F1EC] dark:text-[#7FB598] dark:hover:bg-[#33463C]'
                            >
                                <FiEdit2 aria-hidden='true' />
                            </button>
                            <button
                                type='button'
                                onClick={() => onDuplicateSubject(subject)}
                                aria-label='Dublikat yarat'
                                title='Dublikat yarat'
                                className='flex flex-1 items-center justify-center rounded-[6px] p-[7px] text-[15px] leading-none text-[#555] hover:bg-[#EEE] dark:text-[#C9C2B8] dark:hover:bg-[#3E3833]'
                            >
                                <FiCopy aria-hidden='true' />
                            </button>
                            <button
                                type='button'
                                onClick={() => onRequestRemoveSubject(subject)}
                                aria-label='Fənni sil'
                                title='Fənni sil'
                                className='flex flex-1 items-center justify-center rounded-[6px] p-[7px] text-[15px] leading-none text-[#A65B46] hover:bg-[#FCE5E0] dark:hover:bg-[#473431]'
                            >
                                <FiTrash2 aria-hidden='true' />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </aside>
)

const CalendarEvent = ({ subject, lesson, sequenceIndex, onRequestTypeChange, onEditSubject, onSelect, heightPx = 82 }) => {
    const type = resolveLessonType(subject, sequenceIndex)
    const overridden = isOverridden(subject, sequenceIndex)
    const isLecture = type === 'lecture'
    const typeColor = isLecture ? 'text-[#A65B46]' : 'text-[#477A68]'

    // Hündürlüyə görə qat qat:
    // 1) saat (həmişə)  2) ad (həmişə)  3) tip ayrıca sətirdə (həmişə)
    const tier = heightPx < 88 ? 0 : heightPx < 140 ? 1 : 2
    const showFullFooter = tier >= 2

    return (
    <div
        onClick={(event) => {
            event.stopPropagation()
            onSelect?.()
        }}
        onContextMenu={(event) => {
            event.preventDefault()
            onEditSubject(subject)
        }}
        title={onSelect ? 'Redaktə etmək üçün kliklə' : 'Redaktə etmək üçün sağ kliklə'}
        className={`print-exact flex h-full cursor-context-menu flex-col overflow-hidden rounded-[8px] border-l-[4px] text-[13px] text-[#333] transition-[filter] hover:brightness-95 ${tier === 0 ? 'p-[6px]' : 'p-[8px]'} ${
        isLecture
            ? 'border-[#A65B46] bg-[#FCE5E0]'
            : 'border-[#477A68] bg-[#E3F1EC]'
    }`}>
        <p className='flex items-center gap-[4px] text-[12px] font-bold tabular-nums'>
            <FiClock aria-hidden='true' className='shrink-0' />
            {getStartTime(lesson)} - {lesson.endTime || 'növbəti saat'}
        </p>
        <p className={`truncate font-bold leading-snug ${tier === 0 ? 'mt-[1px] text-[13px]' : 'mt-[2px] text-[14px]'}`}>{subject.name}</p>
        {/* Tip ayrıca sətirdə: dar kartda addan sonra, genişdə aşağıda. */}
        <div className='mt-auto flex items-center justify-between gap-[4px] pt-[4px]'>
            <span className='relative inline-flex max-w-full shrink-0 items-center'>
                <select
                    value={type}
                    onClick={(event) => event.stopPropagation()}
                    onContextMenu={(event) => event.stopPropagation()}
                    onChange={(event) => {
                        if (event.target.value !== type) {
                            onRequestTypeChange(subject, lesson, sequenceIndex, event.target.value)
                        }
                    }}
                    title={overridden ? 'Ardıcıllıq qaydasından istisna' : `${subject.name} üçün dərs tipi`}
                    aria-label={`${subject.name} üçün dərs tipi`}
                    className={`max-w-full appearance-none rounded-full bg-[#FFF]/70 font-bold outline-none ${tier === 0 ? 'py-[2px] pl-[8px] pr-[20px] text-[11px]' : 'py-[3px] pl-[8px] pr-[22px] text-[12px]'} ${typeColor} ${overridden && !showFullFooter ? 'ring-1 ring-[#A65B46]/50' : ''}`}
                >
                    <option value='lecture'>{typeLabels.lecture}</option>
                    <option value='seminar'>{typeLabels.seminar}</option>
                </select>
                <FiChevronDown aria-hidden='true' className={`pointer-events-none absolute right-[7px] text-[12px] ${typeColor}`} />
            </span>
            {overridden && showFullFooter && (
                <span className='shrink-0 text-[11px] italic text-[#777]' title='Ardıcıllıq qaydasından istisna'>istisna</span>
            )}
        </div>
    </div>
    )
}

const TypeChangeDialog = ({ pending, onChoose, onCancel }) => {
    useLockBodyScroll(Boolean(pending))
    useEscapeKey(onCancel, Boolean(pending))
    if (!pending) {
        return null
    }

    return (
        <div
            className='modal-overlay-in fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-0 sm:p-[20px]'
            role='dialog'
            aria-modal='true'
            aria-labelledby='type-change-title'
        >
            <div className='modal-card-in h-full w-full max-w-none overflow-y-auto rounded-none bg-[#FFF] p-[24px] text-[#333] shadow-xl sm:h-auto sm:max-w-[420px] sm:rounded-[14px] dark:bg-[#2A2724] dark:text-[#E8E2D9]'>
                <div className='mb-[16px] flex items-center justify-between border-b border-[#EEE] pb-[16px] dark:border-[#4A4440]'>
                    <h2 id='type-change-title' className='text-[20px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Dərs tipini dəyiş</h2>
                    <button
                        type='button'
                        onClick={onCancel}
                        aria-label='Bağla'
                        className='flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#F1EFE9] text-[18px] text-[#434140] hover:bg-[#E4E0D6] dark:bg-[#3A3632] dark:text-[#EDE8DF] dark:hover:bg-[#4A4440]'
                    >
                        <FiX aria-hidden='true' />
                    </button>
                </div>
                <p className='mb-[16px] text-[14px]'>
                    {pending.subject.name} - {pending.lesson.day},{' '}
                    {getStartTime(pending.lesson)}: {typeLabels[pending.currentType]} →{' '}
                    <strong>{typeLabels[pending.newType]}</strong>. Bu dəyişiklik necə tətbiq olunsun?
                </p>
                <div className='flex flex-col gap-[10px]'>
                    <button
                        type='button'
                        onClick={() => onChoose('once')}
                        className='rounded-[8px] border border-[#477A68] px-[10px] py-[12px] text-[14px] font-medium text-[#477A68] hover:bg-[#E3F1EC] dark:text-[#7FB598] dark:hover:bg-[#35302C]'
                    >
                        Bir dəfəlik - yalnız bu həftəki dərs
                    </button>
                    <button
                        type='button'
                        onClick={() => onChoose('always')}
                        className='rounded-[8px] bg-[#434140] px-[10px] py-[12px] text-[14px] font-medium text-[#E7D8C6] hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
                    >
                        Həmişə - bu gündən etibarən nisbətlə davam etsin
                    </button>
                    <button
                        type='button'
                        onClick={onCancel}
                        className='rounded-[8px] px-[10px] py-[12px] text-[14px] text-[#777] hover:bg-[#EEE] dark:text-[#A8A29E] dark:hover:bg-[#3E3833]'
                    >
                        Ləğv et
                    </button>
                </div>
            </div>
        </div>
    )
}

const WeekTypeChangeDialog = ({ pending, currentLabel, onChoose, onCancel }) => {
    useLockBodyScroll(Boolean(pending))
    useEscapeKey(onCancel, Boolean(pending))
    if (!pending) {
        return null
    }

    return (
        <div
            className='modal-overlay-in fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-0 sm:p-[20px]'
            role='dialog'
            aria-modal='true'
            aria-labelledby='week-type-change-title'
        >
            <div className='modal-card-in h-full w-full max-w-none overflow-y-auto rounded-none bg-[#FFF] p-[24px] text-[#333] shadow-xl sm:h-auto sm:max-w-[420px] sm:rounded-[14px] dark:bg-[#2A2724] dark:text-[#E8E2D9]'>
                <div className='mb-[16px] flex items-center justify-between border-b border-[#EEE] pb-[16px] dark:border-[#4A4440]'>
                    <h2 id='week-type-change-title' className='text-[20px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Həftənin tipini dəyiş</h2>
                    <button
                        type='button'
                        onClick={onCancel}
                        aria-label='Bağla'
                        className='flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#F1EFE9] text-[18px] text-[#434140] hover:bg-[#E4E0D6] dark:bg-[#3A3632] dark:text-[#EDE8DF] dark:hover:bg-[#4A4440]'
                    >
                        <FiX aria-hidden='true' />
                    </button>
                </div>
                <p className='mb-[16px] text-[14px]'>
                    {currentLabel} →{' '}
                    <strong>{pending.newMode === 'upper-week' ? 'Üst həftə' : 'Alt həftə'}</strong>. Bu dəyişiklik necə tətbiq olunsun?
                </p>
                <div className='flex flex-col gap-[10px]'>
                    <button
                        type='button'
                        onClick={() => onChoose('once')}
                        className='rounded-[8px] border border-[#477A68] px-[10px] py-[12px] text-[14px] font-medium text-[#477A68] hover:bg-[#E3F1EC] dark:text-[#7FB598] dark:hover:bg-[#35302C]'
                    >
                        İstisna - yalnız bu həftə
                    </button>
                    <button
                        type='button'
                        onClick={() => onChoose('always')}
                        className='rounded-[8px] bg-[#434140] px-[10px] py-[12px] text-[14px] font-medium text-[#E7D8C6] hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
                    >
                        Həmişə - bu həftədən etibarən o sıra ilə davam etsin
                    </button>
                    <button
                        type='button'
                        onClick={onCancel}
                        className='rounded-[8px] px-[10px] py-[12px] text-[14px] text-[#777] hover:bg-[#EEE] dark:text-[#A8A29E] dark:hover:bg-[#3E3833]'
                    >
                        Ləğv et
                    </button>
                </div>
            </div>
        </div>
    )
}

const DeleteConfirmDialog = ({ subject, onConfirm, onCancel }) => {
    useLockBodyScroll(Boolean(subject))
    useEscapeKey(onCancel, Boolean(subject))
    if (!subject) {
        return null
    }

    return (
        <div
            className='modal-overlay-in fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-0 sm:p-[20px]'
            role='dialog'
            aria-modal='true'
            aria-labelledby='delete-confirm-title'
        >
            <div className='modal-card-in h-full w-full max-w-none overflow-y-auto rounded-none bg-[#FFF] p-[24px] text-[#333] shadow-xl sm:h-auto sm:max-w-[380px] sm:rounded-[14px] dark:bg-[#2A2724] dark:text-[#E8E2D9]'>
                <div className='mb-[16px] flex items-center justify-between border-b border-[#EEE] pb-[16px] dark:border-[#4A4440]'>
                    <h2 id='delete-confirm-title' className='text-[20px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Fənni sil</h2>
                    <button
                        type='button'
                        onClick={onCancel}
                        aria-label='Bağla'
                        className='flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#F1EFE9] text-[18px] text-[#434140] hover:bg-[#E4E0D6] dark:bg-[#3A3632] dark:text-[#EDE8DF] dark:hover:bg-[#4A4440]'
                    >
                        <FiX aria-hidden='true' />
                    </button>
                </div>
                <p className='mb-[16px] text-[14px]'>
                    “<strong>{subject.name}</strong>” silinsin? Əminsən?
                </p>
                <div className='flex flex-col gap-[10px]'>
                    <button
                        type='button'
                        onClick={onConfirm}
                        className='rounded-[8px] bg-[#A65B46] px-[10px] py-[12px] text-[14px] font-medium text-[#FFF] hover:bg-[#96543F]'
                    >
                        Bəli, sil
                    </button>
                    <button
                        type='button'
                        onClick={onCancel}
                        className='rounded-[8px] px-[10px] py-[12px] text-[14px] text-[#777] hover:bg-[#EEE] dark:text-[#A8A29E] dark:hover:bg-[#3E3833]'
                    >
                        Ləğv et
                    </button>
                </div>
            </div>
        </div>
    )
}

const Dashboard = ({ subjects, onAddSubject, onRemoveSubject, onUpdateSubject, onApplyLessonType, jump, weekState, onWeekStateChange, isDayInfoOpen, onDayInfoOpenChange }) => {
    const today = new Date()
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const currentWeekStart = getMonday(today)
    const currentWeekNumber = getWeekNumber(currentWeekStart)
    const [viewedWeekStart, setViewedWeekStart] = useState(() => currentWeekStart)
    const [editingSubject, setEditingSubject] = useState(null)
    const [pendingChange, setPendingChange] = useState(null)
    const [pendingWeekChange, setPendingWeekChange] = useState(null)
    const [pendingDeleteSubject, setPendingDeleteSubject] = useState(null)
    const [copyingSubject, setCopyingSubject] = useState(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [pendingSlot, setPendingSlot] = useState(null)
    const [hoverSlot, setHoverSlot] = useState(null)
    const [highlight, setHighlight] = useState(null)
    const highlightRef = useRef(null)
    const highlightTimeout = useRef(null)
    const lastJumpRef = useRef(0)

    // Cədvəldə boş yerə sol klik: kliklənən yerə yeni fənn.
    const handleGridClick = (event, dayName) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const totalMinutes = hours.length * 60
        const clicked = hours[0] * 60 + ((event.clientY - rect.top) / rect.height) * totalMinutes
        const rounded = Math.round(clicked / 15) * 15
        const rangeEnd = (hours[hours.length - 1] + 1) * 60
        const start = Math.max(hours[0] * 60, Math.min(rounded, rangeEnd - 30))
        setPendingSlot({ day: dayName, startTime: formatMinutes(start), endTime: formatMinutes(start + 60) })
    }

    // Hover olunan yerdə mavi vaxt xətti (qırmızı "indi" xəttinin tayı).
    const handleGridHover = (event, dayName) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const totalMinutes = hours.length * 60
        const pointed = hours[0] * 60 + ((event.clientY - rect.top) / rect.height) * totalMinutes
        const snapped = Math.round(pointed / 15) * 15
        const clamped = Math.max(hours[0] * 60, Math.min(snapped, (hours[hours.length - 1] + 1) * 60))
        setHoverSlot({ day: dayName, minutes: clamped })
    }
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        try {
            const saved = localStorage.getItem('academic-schedule-sidebar-open')
            if (saved === '0' || saved === '1') {
                return saved === '1'
            }
        } catch {
            return true
        }
        return window.innerWidth >= 1024
    })

    const toggleSidebar = () => {
        setSidebarOpen((current) => {
            const next = !current
            try {
                localStorage.setItem('academic-schedule-sidebar-open', next ? '1' : '0')
            } catch {
                // yaddaş əlçatan deyilsə, yalnız bu sessiya üçün tətbiq olunur
            }
            return next
        })
    }

    const viewedWeekNumber = getWeekNumber(viewedWeekStart)
    const viewedWeekType = resolveWeekType(weekState, viewedWeekStart)
    const viewedMode = viewedWeekType.mode
    const currentMode = resolveWeekType(weekState, currentWeekStart).mode
    const viewedIsCurrent = viewedWeekStart.getTime() === currentWeekStart.getTime()

    const todayIndex = Math.min(6, Math.max(0, Math.round((todayMidnight - currentWeekStart) / 86400000)))
    const [mobileDay, setMobileDay] = useState(days[todayIndex])

    const goToWeek = (monday) => {
        setViewedWeekStart(monday)
        const index = Math.round((todayMidnight - monday) / 86400000)
        setMobileDay(index >= 0 && index < 7 ? days[index] : days[0])
    }

    // Mobil günbəgün keçid: sərhəddə həftə dəyişir.
    const stepMobileDay = (delta) => {
        const current = days.indexOf(mobileDay)
        const { index, weekDelta } = stepWeekday(current < 0 ? 0 : current, delta)
        if (weekDelta !== 0) {
            setViewedWeekStart(addWeeks(viewedWeekStart, weekDelta))
        }
        setMobileDay(days[index])
    }

    // Mobil siyahıda barmaqla sağa-sola sürüşdürmə.
    const touchStartX = useRef(null)
    const handleTouchStart = (event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null
    }
    const handleTouchEnd = (event) => {
        if (touchStartX.current === null) {
            return
        }
        const deltaX = touchStartX.current - (event.changedTouches[0]?.clientX ?? touchStartX.current)
        touchStartX.current = null
        if (deltaX > 50) {
            stepMobileDay(1)
        } else if (deltaX < -50) {
            stepMobileDay(-1)
        }
    }

    const requestWeekModeChange = (mode) => {
        if (mode === viewedMode) {
            return
        }
        setPendingWeekChange({ newMode: mode })
    }

    const chooseWeekModeChange = (scope) => {
        if (pendingWeekChange) {
            const { newMode } = pendingWeekChange
            onWeekStateChange((current) => (
                scope === 'always'
                    ? reanchorWeekState(current, viewedWeekStart, newMode)
                    : withWeekOverride(current, viewedWeekStart, newMode)
            ))
            setPendingWeekChange(null)
        }
    }

    const clearWeekOverride = () => {
        onWeekStateChange((current) => withWeekOverride(current, viewedWeekStart, null))
    }

    const weekDays = (
        days.map((name, index) => {
            const date = new Date(viewedWeekStart)
            date.setDate(viewedWeekStart.getDate() + index)
            return { name, date }
        })
    )

    // Tək həftə rejimində tezlik fərqi yoxdur: hamı hər həftə görünür.
    const weekSystem = weekState.system === 'single' ? 'single' : 'double'
    const displaySubjects = weekSystem === 'single'
        ? subjects.map((subject) => ({
            ...subject,
            frequency: 'every-week',
            schedule: subject.schedule.map((lesson) => ({ ...lesson, frequency: 'every-week' })),
        }))
        : subjects

    const activeSubjects = visibleSubjects(displaySubjects, viewedMode)
    const currentActiveSubjects = visibleSubjects(displaySubjects, currentMode)

    const hours = getVisibleHours(activeSubjects, viewedMode)
    const conflicts = findConflicts(activeSubjects, viewedMode)

    const occurrences = activeSubjects.flatMap((subject) => (
        subject.schedule
            .map((lesson, lessonIndex) => ({ subject, lesson, lessonIndex }))
            .filter(({ lesson }) => isLessonVisible(subject, lesson, viewedMode))
            .map(({ subject, lesson, lessonIndex }) => {
                const sequenceIndex = getSequenceIndex(subject, lesson, lessonIndex, viewedWeekNumber)
                return {
                    subject,
                    lesson,
                    sequenceIndex,
                    type: resolveLessonType(subject, sequenceIndex),
                }
            })
    ))
    const lectureTotal = occurrences.filter((occurrence) => occurrence.type === 'lecture').length
    const seminarTotal = occurrences.filter((occurrence) => occurrence.type === 'seminar').length

    const nowMinutes = today.getHours() * 60 + today.getMinutes()
    const todayLessons = lessonsIn(currentActiveSubjects, days[todayIndex], currentWeekNumber, currentMode)

    // Sabah: həftə dəyişirsə (bazar → bazar ertəsi) növbəti həftənin tipi ilə.
    const tomorrowDate = new Date(todayMidnight)
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)
    const tomorrowMonday = getMonday(tomorrowDate)
    const tomorrowWeekNumber = getWeekNumber(tomorrowMonday)
    const tomorrowMode = resolveWeekType(weekState, tomorrowMonday).mode
    const tomorrowActiveSubjects = visibleSubjects(displaySubjects, tomorrowMode)
    const tomorrowDayName = days[(todayIndex + 1) % 7]
    const tomorrowLessons = lessonsIn(tomorrowActiveSubjects, tomorrowDayName, tomorrowWeekNumber, tomorrowMode)

    const mobileLessons = lessonsIn(activeSubjects, mobileDay, viewedWeekNumber, viewedMode)
    const mobileDate = weekDays[days.indexOf(mobileDay)]?.date
    const mobileDateLabel = mobileDate ? `${mobileDate.getDate()}.${String(mobileDate.getMonth() + 1).padStart(2, '0')}` : ''

    // Axtarışdan keçid: cari həftəyə qayıt, dərsi işıqlandır və ora sürüşdür.
    useEffect(() => {
        if (!jump || jump.n === lastJumpRef.current) {
            return
        }
        lastJumpRef.current = jump.n
        const now = new Date()
        const monday = getMonday(now)
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const index = Math.min(6, Math.max(0, Math.round((midnight - monday) / 86400000)))
        setViewedWeekStart(monday)
        setMobileDay(days[index])
        setHighlight({ subjectId: jump.subjectId, sequenceIndex: jump.sequenceIndex })
        if (highlightTimeout.current) {
            clearTimeout(highlightTimeout.current)
        }
        highlightTimeout.current = setTimeout(() => setHighlight(null), 3300)
        requestAnimationFrame(() => {
            highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        })
        return () => {
            if (highlightTimeout.current) {
                clearTimeout(highlightTimeout.current)
            }
        }
    }, [jump])

    const requestTypeChange = (subject, lesson, sequenceIndex, newType) => {
        setPendingChange({
            subjectId: subject.id,
            subjectName: subject.name,
            subject,
            lesson,
            sequenceIndex,
            currentType: resolveLessonType(subject, sequenceIndex),
            newType,
        })
    }

    const chooseChangeMode = (mode) => {
        if (pendingChange) {
            onApplyLessonType(pendingChange.subjectId, pendingChange.sequenceIndex, pendingChange.newType, mode)
            setPendingChange(null)
        }
    }

    useGlobalShortcuts({
        ArrowLeft: () => goToWeek(addWeeks(viewedWeekStart, -1)),
        ArrowRight: () => goToWeek(addWeeks(viewedWeekStart, 1)),
        t: () => goToWeek(currentWeekStart),
        T: () => goToWeek(currentWeekStart),
    })

    return (
        <div className='flex flex-col gap-[15px] pb-[30px]'>
            {conflicts.length > 0 && (
                <div className='rounded-[8px] border border-[#A65B46] bg-[#FCE5E0] p-[12px] text-[13px] text-[#6E3A2C]'>
                    <p className='mb-[6px] font-bold'>Vaxt toqquşması ({conflicts.length}):</p>
                    <ul className='flex flex-col gap-[3px]'>
                        {conflicts.map(({ day, first, second }, index) => (
                            <li key={`${day}-${index}`}>
                                {day}: {first.subject.name} ({getStartTime(first.lesson)}–{first.lesson.endTime}) ↔{' '}
                                {second.subject.name} ({getStartTime(second.lesson)}–{second.lesson.endTime})
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className={`flex flex-col lg:flex-row ${sidebarOpen ? 'gap-[15px] lg:gap-[15px]' : 'gap-0 lg:gap-0'}`}>
                <div className={`no-print grid shrink-0 transition-[grid-template-rows,opacity,width] duration-300 ease-in-out ${sidebarOpen ? 'grid-rows-[1fr] w-full opacity-100 lg:w-[250px]' : 'grid-rows-[0fr] w-full opacity-0 lg:w-0'}`}>
                    <div className='min-h-0 overflow-hidden'>
                    <SubjectMenu
                        subjects={subjects}
                        onRequestRemoveSubject={setPendingDeleteSubject}
                        onEditSubject={setEditingSubject}
                        onDuplicateSubject={(subject) => setCopyingSubject({
                            ...subject,
                            schedule: subject.schedule.map((lesson) => ({ ...lesson })),
                            name: `${subject.name} (nüsxə)`,
                        })}
                        onAddSubject={() => setIsAddModalOpen(true)}
                    />
                    </div>
                </div>
                <main className='min-w-0 flex-1'>
                    <button
                        type='button'
                        onClick={toggleSidebar}
                        aria-label={sidebarOpen ? 'Paneli gizlət' : 'Fənlərim panelini aç'}
                        title={sidebarOpen ? 'Paneli gizlət' : 'Fənlərim'}
                        className='sidebar-reopen no-print fixed left-0 top-1/2 z-10 -translate-y-1/2 rounded-r-[8px] bg-[#434140] px-[8px] py-[14px] text-[18px] text-[#E7D8C6] shadow-md hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]'
                    >
                        {sidebarOpen ? <FiChevronsLeft aria-hidden='true' /> : <FiChevronsRight aria-hidden='true' />}
                    </button>
                    <div className='mb-[10px] flex flex-wrap items-center justify-between gap-[10px]'>
                        <div className='print:hidden'>
                            <h1 className='text-[22px] font-bold text-[#434140] dark:text-[#EDE8DF]'>Həftəlik cədvəl</h1>
                            <p className='text-[13px] text-[#666] dark:text-[#A8A29E]'>
                                Bu həftə: <strong>{lectureTotal} müh.</strong>, <strong>{seminarTotal} sem.</strong>
                            </p>
                        </div>
                        <div className='no-print flex flex-col items-end gap-[5px]'>
                            <div className='flex items-stretch overflow-hidden rounded-[6px] border border-[#434140] text-[13px] dark:border-[#55504A]'>
                                <button
                                    type='button'
                                    onClick={() => goToWeek(addWeeks(viewedWeekStart, -1))}
                                    aria-label='Əvvəlki həftə'
                                    title='Əvvəlki həftə (←)'
                                    className='flex items-center px-[10px] py-[5px] text-[15px] text-[#434140] hover:bg-[#EEE] dark:text-[#EDE8DF] dark:hover:bg-[#3A3632]'
                                >
                                    <FiChevronLeft aria-hidden='true' />
                                </button>
                                {!viewedIsCurrent && (
                                    <button
                                        type='button'
                                        onClick={() => goToWeek(currentWeekStart)}
                                        title='Bu həftə (T)'
                                        className='border-x border-[#DDD] px-[12px] py-[5px] font-medium text-[#434140] hover:bg-[#EEE] dark:border-[#4A4440] dark:text-[#EDE8DF] dark:hover:bg-[#3A3632]'
                                    >
                                        Bu gün
                                    </button>
                                )}
                                <button
                                    type='button'
                                    onClick={() => goToWeek(addWeeks(viewedWeekStart, 1))}
                                    aria-label='Növbəti həftə'
                                    title='Növbəti həftə (→)'
                                    className='flex items-center px-[10px] py-[5px] text-[15px] text-[#434140] hover:bg-[#EEE] dark:text-[#EDE8DF] dark:hover:bg-[#3A3632]'
                                >
                                    <FiChevronRight aria-hidden='true' />
                                </button>
                            </div>
                            {weekSystem === 'single' ? (
                                <span className='rounded-[5px] bg-[#434140] px-[10px] py-[5px] text-[12px] font-bold text-[#FFF] dark:bg-[#E7D8C6] dark:text-[#434140]'>Tək həftə</span>
                            ) : (
                                <div className='flex items-center gap-[6px]'>
                                    <div className='flex overflow-hidden rounded-[5px] border border-[#A65B46] text-[12px]'>
                                        <button type='button' onClick={() => requestWeekModeChange('upper-week')} className={`px-[10px] py-[5px] ${viewedMode === 'upper-week' ? 'bg-[#A65B46] font-bold text-[#FFF] hover:bg-[#96543F]' : 'bg-[#FFF] text-[#A65B46] hover:bg-[#F7F3EC] dark:bg-[#2A2724] dark:hover:bg-[#3E3833]'}`}>Üst həftə</button>
                                        <button type='button' onClick={() => requestWeekModeChange('lower-week')} className={`px-[10px] py-[5px] ${viewedMode === 'lower-week' ? 'bg-[#A65B46] font-bold text-[#FFF] hover:bg-[#96543F]' : 'bg-[#FFF] text-[#A65B46] hover:bg-[#F7F3EC] dark:bg-[#2A2724] dark:hover:bg-[#3E3833]'}`}>Alt həftə</button>
                                    </div>
                                    {viewedWeekType.isOverride && (
                                        <button
                                            type='button'
                                            onClick={clearWeekOverride}
                                            title='Avtomatik növbələşməyə qayıt'
                                            className='rounded-[5px] border border-[#AAA] px-[8px] py-[4px] text-[12px] text-[#434140] hover:bg-[#EEE] dark:border-[#55504A] dark:text-[#EDE8DF] dark:hover:bg-[#3A3632]'
                                        >
                                            Avto
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className='no-print mb-[10px] flex items-center justify-between rounded-[8px] bg-[#FFF] p-[8px] shadow-sm lg:hidden dark:bg-[#2A2724]'>
                        <button
                            type='button'
                            onClick={() => stepMobileDay(-1)}
                            aria-label='Əvvəlki gün'
                            title='Əvvəlki gün'
                            className='rounded-[5px] p-[8px] text-[18px] text-[#434140] hover:bg-[#EEE] dark:text-[#EDE8DF] dark:hover:bg-[#3A3632]'
                        >
                            <FiChevronLeft aria-hidden='true' />
                        </button>
                        <div className='text-center'>
                            <p className='text-[15px] font-bold text-[#434140] dark:text-[#EDE8DF]'>{mobileDay}</p>
                            <p className='text-[12px] text-[#666] dark:text-[#A8A29E]'>{mobileDateLabel}</p>
                        </div>
                        <button
                            type='button'
                            onClick={() => stepMobileDay(1)}
                            aria-label='Növbəti gün'
                            title='Növbəti gün'
                            className='rounded-[5px] p-[8px] text-[18px] text-[#434140] hover:bg-[#EEE] dark:text-[#EDE8DF] dark:hover:bg-[#3A3632]'
                        >
                            <FiChevronRight aria-hidden='true' />
                        </button>
                    </div>
                    <div className='no-print mb-[10px] flex gap-[6px] overflow-x-auto rounded-[8px] bg-[#FFF] p-[8px] shadow-sm lg:hidden dark:bg-[#2A2724]'>
                        {days.map((day) => (
                            <button
                                key={day}
                                type='button'
                                onClick={() => setMobileDay(day)}
                                className={`shrink-0 rounded-[5px] px-[10px] py-[6px] text-[12px] ${mobileDay === day ? 'bg-[#434140] text-[#FFF] hover:bg-[#555250] dark:bg-[#E7D8C6] dark:text-[#434140] dark:hover:bg-[#D8D2C4]' : 'bg-[#EEE] text-[#333] hover:bg-[#DFDFDF] dark:bg-[#3A3632] dark:text-[#E8E2D9] dark:hover:bg-[#4A4440]'}`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                    <div
                        key={`${toDayKey(viewedWeekStart)}-${mobileDay}`}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        className='week-fade no-print flex flex-col gap-[8px] lg:hidden'
                    >
                        {mobileLessons.length === 0 ? (
                            <p className='rounded-[8px] bg-[#FFF] p-[12px] text-[13px] text-[#777] shadow-sm dark:bg-[#2A2724] dark:text-[#A8A29E]'>
                                {mobileDay} günü dərs yoxdur.
                            </p>
                        ) : (
                            mobileLessons.map(({ subject, lesson, sequenceIndex }) => (
                                <CalendarEvent
                                    key={`${subject.id}-${sequenceIndex}`}
                                    subject={subject}
                                    lesson={lesson}
                                    sequenceIndex={sequenceIndex}
                                    onRequestTypeChange={requestTypeChange}
                                    onEditSubject={setEditingSubject}
                                    onSelect={() => setEditingSubject(subject)}
                                    heightPx={160}
                                />
                            ))
                        )}
                    </div>

                    <div className='mb-[10px] ml-[6mm] hidden print:block'>
                        <p className='print-exact font-["Trirong"] text-[20px] font-bold text-[#A65B46]'>AcademicSchedule</p>
                        <p className='text-[13px] text-[#434140]'>Həftəlik cədvəl</p>
                    </div>
                    <PrintSchedules subjects={subjects} weekState={weekState} />
                    <div key={toDayKey(viewedWeekStart)} className='week-fade no-print hidden overflow-x-auto rounded-[8px] bg-[#FFF] shadow-sm lg:block dark:bg-[#2A2724]'>
                        <div className='min-w-[1050px]'>
                            <div className='grid grid-cols-[52px_repeat(7,minmax(130px,1fr))] border-b border-[#DDD] dark:border-[#4A4440]'>
                                <div className='border-b border-[#DDD] p-[8px] dark:border-[#4A4440]' />
                                {weekDays.map(({ name, date }) => (
                                    <div key={name} className={`border-r border-[#DDD] p-[8px] text-center dark:border-[#4A4440] ${date.toDateString() === today.toDateString() ? 'bg-[#FCE5E0] dark:bg-[#FCE5E0]/20' : ''}`}>
                                        <p className='text-[12px] text-[#666] dark:text-[#A8A29E]'>{name}</p>
                                        <p className='font-bold text-[#434140] dark:text-[#EDE8DF]'>{date.getDate()}</p>
                                    </div>
                                ))}
                            </div>

                            <div className='grid grid-cols-[52px_repeat(7,minmax(130px,1fr))] border-b border-[#DDD] dark:border-[#4A4440]'>
                                <div>
                                    {hours.map((hour) => (
                                        <div
                                            key={hour}
                                            className='relative'
                                            style={{ height: `${HOUR_PX}px` }}
                                        >
                                            <div className='absolute right-[8px] top-[5px] text-right text-[12px] tabular-nums text-[#999] dark:text-[#A8A29E]'>
                                                {String(hour).padStart(2, '0')}:00
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {weekDays.map(({ name, date }) => {
                                    const isTodayColumn = date.toDateString() === today.toDateString()
                                    const positioned = layoutDayEvents(lessonsIn(activeSubjects, name, viewedWeekNumber, viewedMode))
                                    const showNowLine = isTodayColumn
                                        && nowMinutes >= hours[0] * 60
                                        && nowMinutes <= (hours[hours.length - 1] + 1) * 60
                                    const nowY = ((nowMinutes - hours[0] * 60) / 60) * HOUR_PX
                                    return (
                                        <div
                                            key={name}
                                            className={`relative border-l border-[#DDD] dark:border-[#3A3632] ${isTodayColumn ? 'bg-[#FCE5E0]/50 dark:bg-[#FCE5E0]/10' : ''}`}
                                            style={{ height: `${hours.length * HOUR_PX}px` }}
                                            onClick={(event) => handleGridClick(event, name)}
                                            onMouseMove={(event) => handleGridHover(event, name)}
                                            onMouseLeave={() => setHoverSlot(null)}
                                            title='Yeni fənn üçün kliklə'
                                        >
                                            {hours.map((hour) => (
                                                <div
                                                    key={hour}
                                                    className='absolute left-0 right-0 border-t border-[#DDD] dark:border-[#3A3632]'
                                                    style={{ top: `${(hour - hours[0]) * HOUR_PX}px` }}
                                                />
                                            ))}
                                            {positioned.map(({ subject, lesson, sequenceIndex, lane, laneCount, start, end }) => {
                                                const isHighlighted = highlight
                                                    && highlight.subjectId === subject.id
                                                    && highlight.sequenceIndex === sequenceIndex
                                                return (
                                                <div
                                                    key={`${subject.id}-${sequenceIndex}`}
                                                    ref={isHighlighted ? highlightRef : null}
                                                    className='absolute'
                                                    style={{
                                                        top: `${((start - hours[0] * 60) / 60) * HOUR_PX}px`,
                                                        height: `${Math.max(((end - start) / 60) * HOUR_PX, 72)}px`,
                                                        left: `calc(${(lane / laneCount) * 100}% + 3px)`,
                                                        width: `calc(${100 / laneCount}% - 6px)`,
                                                    }}
                                                >
                                                    {isHighlighted && (
                                                        <div className='highlight-flash pointer-events-none absolute inset-0 z-10 rounded-[5px] ring-2 ring-[#A65B46]' />
                                                    )}
                                                    <CalendarEvent
                                                        subject={subject}
                                                        lesson={lesson}
                                                        sequenceIndex={sequenceIndex}
                                                        onRequestTypeChange={requestTypeChange}
                                                        onEditSubject={setEditingSubject}
                                                        heightPx={Math.max(((end - start) / 60) * HOUR_PX, 72)}
                                                    />
                                                </div>
                                                )
                                            })}
                                            {showNowLine && (
                                                <div
                                                    className='absolute left-0 right-0 z-10'
                                                    style={{ top: `${nowY}px` }}
                                                    title={`İndi: ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`}
                                                >
                                                    <div className='h-[2px] w-full bg-red-500' />
                                                    <div className='absolute -top-[3.5px] left-0 h-[9px] w-[9px] rounded-full bg-red-500' />
                                                </div>
                                            )}
                                            {hoverSlot && hoverSlot.day === name && (
                                                <div
                                                    className='pointer-events-none absolute left-0 right-0 z-20'
                                                    style={{ top: `${((hoverSlot.minutes - hours[0] * 60) / 60) * HOUR_PX}px` }}
                                                >
                                                    <div className='h-[2px] w-full bg-gray-400 opacity-40' />
                                                    <span className='absolute -top-[8px] right-0 z-10 rounded-[4px] bg-[#D9D9D9] px-[5px] py-[1px] text-[11px] font-medium tabular-nums text-[#434140]'>
                                                        {formatMinutes(hoverSlot.minutes)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                </main>
            </div>

            <TypeChangeDialog
                pending={pendingChange}
                onChoose={chooseChangeMode}
                onCancel={() => setPendingChange(null)}
            />

            <WeekTypeChangeDialog
                pending={pendingWeekChange}
                currentLabel={viewedWeekType.mode === 'upper-week' ? 'Üst həftə' : 'Alt həftə'}
                onChoose={chooseWeekModeChange}
                onCancel={() => setPendingWeekChange(null)}
            />

            <DeleteConfirmDialog
                subject={pendingDeleteSubject}
                onConfirm={() => {
                    onRemoveSubject(pendingDeleteSubject.id)
                    setPendingDeleteSubject(null)
                }}
                onCancel={() => setPendingDeleteSubject(null)}
            />

            <DayInfoModal
                open={isDayInfoOpen}
                todayLessons={todayLessons}
                tomorrowLessons={tomorrowLessons}
                tomorrowTitle={`Sabah (${tomorrowDayName})`}
                nowMinutes={nowMinutes}
                onClose={() => onDayInfoOpenChange(false)}
            />

            {isAddModalOpen && (
                <NewSubjectModal
                    weekSystem={weekSystem}
                    onClose={() => setIsAddModalOpen(false)}
                    onSubmit={(created) => {
                        onAddSubject(created)
                        setIsAddModalOpen(false)
                    }}
                />
            )}

            {editingSubject && (
                <NewSubjectModal
                    initialSubject={editingSubject}
                    weekSystem={weekSystem}
                    onClose={() => setEditingSubject(null)}
                    onDelete={() => {
                        setPendingDeleteSubject(editingSubject)
                        setEditingSubject(null)
                    }}
                    onSubmit={(updated) => {
                        onUpdateSubject(updated)
                        setEditingSubject(null)
                    }}
                />
            )}

            {copyingSubject && (
                <NewSubjectModal
                    initialSubject={copyingSubject}
                    copyMode
                    weekSystem={weekSystem}
                    onClose={() => setCopyingSubject(null)}
                    onSubmit={(copied) => {
                        onAddSubject(copied)
                        setCopyingSubject(null)
                    }}
                />
            )}

            {pendingSlot && (
                <NewSubjectModal
                    preset={[pendingSlot]}
                    weekSystem={weekSystem}
                    onClose={() => setPendingSlot(null)}
                    onSubmit={(created) => {
                        onAddSubject(created)
                        setPendingSlot(null)
                    }}
                />
            )}
        </div>
    )
}

export default Dashboard
