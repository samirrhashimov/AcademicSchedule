import { useEffect, useState } from 'react'
import { FiChevronsLeft, FiChevronsRight, FiChevronLeft, FiChevronRight, FiCopy, FiEdit2, FiTrash2 } from 'react-icons/fi'
import NewSubjectModal from './NewSubjectModal'
import { getSequenceIndex, resolveLessonType } from '../lib/subjects'
import {
  addWeeks,
  defaultWeekState,
  normalizeWeekState,
  reanchorWeekState,
  resolveWeekType,
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

const WEEK_STORAGE_KEY = 'academic-schedule-week-mode'

const loadWeekState = (fallbackMonday) => {
    const fallbackMode = getWeekNumber(fallbackMonday) % 2 === 0 ? 'upper-week' : 'lower-week'
    try {
        const saved = localStorage.getItem(WEEK_STORAGE_KEY)
        return normalizeWeekState(saved ? JSON.parse(saved) : null, fallbackMonday, fallbackMode)
    } catch (error) {
        console.error('Həftə rejimi localStorage-dan oxunmadı:', error)
        return defaultWeekState(fallbackMonday, fallbackMode)
    }
}

const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    return Math.ceil((((date - firstDayOfYear) / 86400000) + firstDayOfYear.getDay() + 1) / 7)
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

const isOverridden = (subject, sequenceIndex) => (
    Boolean(subject.overrides && subject.overrides[String(sequenceIndex)])
)

const getVisibleHours = (activeSubjects) => {
    let minHour = 8
    let maxHour = 20
    for (const subject of activeSubjects) {
        for (const lesson of subject.schedule) {
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

const findConflicts = (activeSubjects) => {
    const byDay = {}
    for (const subject of activeSubjects) {
        for (const lesson of subject.schedule) {
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

const SubjectMenu = ({ subjects, onRequestRemoveSubject, onEditSubject, onDuplicateSubject, onHideSidebar }) => (
    <aside className='w-full rounded-[8px] bg-[#434140] p-[15px] text-[#FFF] lg:w-[245px]'>
        <div className='mb-[15px] flex items-center justify-between gap-[8px]'>
            <span className='flex items-center gap-[8px]'>
                <span className='text-[18px] font-bold'>Fənlərim</span>
                <span className='rounded-full bg-[#A65B46] px-[8px] py-[2px] text-[12px] font-medium'>{subjects.length}</span>
            </span>
            <button
                type='button'
                onClick={onHideSidebar}
                aria-label='Paneli gizlət'
                title='Paneli gizlət'
                className='p-[4px] text-[20px] leading-none text-[#E7D8C6] hover:text-[#FFF]'
            >
                <FiChevronsLeft aria-hidden='true' />
            </button>
        </div>
        {subjects.length === 0 ? (
            <p className='text-[14px] text-[#DDD]'>Hələ fənn əlavə edilməyib.</p>
        ) : (
            <div className='flex flex-col gap-[8px]'>
                {subjects.map((subject) => (
                    <div key={subject.id} className='rounded-[6px] bg-[#FFF] p-[10px] text-[#333]'>
                        <div className='flex items-start justify-between gap-[8px]'>
                            <div className='min-w-0'>
                                <p className='truncate font-medium'>{subject.name}</p>
                                <p className='mt-[3px] text-[12px] text-[#777]'>
                                    {subject.lectureCount} müh., {subject.seminarCount} sem.
                                </p>
                                {(subject.teacher || subject.room) && (
                                    <p className='mt-[2px] text-[12px] text-[#777]'>
                                        {subject.teacher && <span className='block truncate'>Müəllim: {subject.teacher}</span>}
                                        {subject.room && <span className='block truncate'>Otaq: {subject.room}</span>}
                                    </p>
                                )}
                            </div>
                            <div className='flex shrink-0 flex-col gap-[6px]'>
                                <button
                                    type='button'
                                    onClick={() => onEditSubject(subject)}
                                    aria-label='Redaktə et'
                                    title='Redaktə et'
                                    className='rounded-[4px] bg-[#E3F1EC] p-[6px] text-[15px] leading-none text-[#477A68] hover:bg-[#D4E6DC]'
                                >
                                    <FiEdit2 aria-hidden='true' />
                                </button>
                                <button
                                    type='button'
                                    onClick={() => onDuplicateSubject(subject)}
                                    aria-label='Dublikat yarat'
                                    title='Dublikat yarat'
                                    className='rounded-[4px] bg-[#EEE] p-[6px] text-[15px] leading-none text-[#555] hover:bg-[#DFDFDF]'
                                >
                                    <FiCopy aria-hidden='true' />
                                </button>
                                <button
                                    type='button'
                                    onClick={() => onRequestRemoveSubject(subject)}
                                    aria-label='Fənni sil'
                                    title='Fənni sil'
                                    className='rounded-[4px] bg-[#FCE5E0] p-[6px] text-[15px] leading-none text-[#A65B46] hover:bg-[#F6D9D2]'
                                >
                                    <FiTrash2 aria-hidden='true' />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </aside>
)

const CalendarEvent = ({ subject, lesson, sequenceIndex, onRequestTypeChange }) => {
    const type = resolveLessonType(subject, sequenceIndex)
    const overridden = isOverridden(subject, sequenceIndex)

    return (
    <div className={`h-full overflow-hidden rounded-[5px] border-l-[4px] p-[7px] text-[13px] ${
        type === 'lecture'
            ? 'border-[#A65B46] bg-[#FCE5E0]'
            : 'border-[#477A68] bg-[#E3F1EC]'
    }`}>
        <p className='font-bold'>{getStartTime(lesson)} - {lesson.endTime || 'növbəti saat'}</p>
        <p className='truncate font-medium'>{subject.name}</p>
        {(subject.teacher || subject.room) && (
            <p className='truncate text-[12px] text-[#666]'>
                {[subject.teacher, subject.room].filter(Boolean).join(' • ')}
            </p>
        )}
        <select
            value={type}
            onChange={(event) => {
                if (event.target.value !== type) {
                    onRequestTypeChange(subject, lesson, sequenceIndex, event.target.value)
                }
            }}
            aria-label={`${subject.name} üçün dərs tipi`}
            className='mt-[3px] max-w-full bg-transparent text-[12px] font-medium outline-none'
        >
            <option value='lecture'>{typeLabels.lecture}</option>
            <option value='seminar'>{typeLabels.seminar}</option>
        </select>
        {overridden && (
            <p className='mt-[2px] text-[11px] text-[#777]' title='Ardıcıllıq qaydasından istisna'>istisna ✎</p>
        )}
    </div>
    )
}

const TypeChangeDialog = ({ pending, onChoose, onCancel }) => {
    if (!pending) {
        return null
    }

    return (
        <div
            className='fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-[20px]'
            role='dialog'
            aria-modal='true'
            aria-labelledby='type-change-title'
        >
            <div className='w-full max-w-[420px] rounded-[8px] bg-[#FFF] p-[20px] text-[#333] shadow-lg'>
                <h2 id='type-change-title' className='mb-[8px] text-[18px] font-bold'>Dərs tipini dəyiş</h2>
                <p className='mb-[4px] text-[14px]'>
                    {pending.subject.name} — {pending.lesson.day},{' '}
                    {getStartTime(pending.lesson)}: {typeLabels[pending.currentType]} →{' '}
                    <strong>{typeLabels[pending.newType]}</strong>
                </p>
                <p className='mb-[15px] text-[13px] text-[#666]'>
                    Bu dəyişiklik necə tətbiq olunsun?
                </p>
                <div className='flex flex-col gap-[8px]'>
                    <button
                        type='button'
                        onClick={() => onChoose('once')}
                        className='rounded-[5px] border border-[#477A68] px-[10px] py-[8px] text-[14px] font-medium text-[#477A68] hover:bg-[#E3F1EC]'
                    >
                        Bir dəfəlik — yalnız bu həftəki dərs
                    </button>
                    <button
                        type='button'
                        onClick={() => onChoose('always')}
                        className='rounded-[5px] bg-[#434140] px-[10px] py-[8px] text-[14px] font-medium text-[#E7D8C6] hover:bg-[#555250]'
                    >
                        Həmişə — bu gündən etibarən nisbətlə davam etsin
                    </button>
                    <button
                        type='button'
                        onClick={onCancel}
                        className='rounded-[5px] px-[10px] py-[8px] text-[14px] text-[#777] hover:bg-[#EEE]'
                    >
                        Ləğv et
                    </button>
                </div>
            </div>
        </div>
    )
}

const WeekTypeChangeDialog = ({ pending, currentLabel, onChoose, onCancel }) => {
    if (!pending) {
        return null
    }

    return (
        <div
            className='fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-[20px]'
            role='dialog'
            aria-modal='true'
            aria-labelledby='week-type-change-title'
        >
            <div className='w-full max-w-[420px] rounded-[8px] bg-[#FFF] p-[20px] text-[#333] shadow-lg'>
                <h2 id='week-type-change-title' className='mb-[8px] text-[18px] font-bold'>Həftənin tipini dəyiş</h2>
                <p className='mb-[4px] text-[14px]'>
                    {currentLabel} →{' '}
                    <strong>{pending.newMode === 'upper-week' ? 'Üst həftə' : 'Alt həftə'}</strong>
                </p>
                <p className='mb-[15px] text-[13px] text-[#666]'>
                    Bu dəyişiklik necə tətbiq olunsun?
                </p>
                <div className='flex flex-col gap-[8px]'>
                    <button
                        type='button'
                        onClick={() => onChoose('once')}
                        className='rounded-[5px] border border-[#477A68] px-[10px] py-[8px] text-[14px] font-medium text-[#477A68] hover:bg-[#E3F1EC]'
                    >
                        İstisna — yalnız bu həftə
                    </button>
                    <button
                        type='button'
                        onClick={() => onChoose('always')}
                        className='rounded-[5px] bg-[#434140] px-[10px] py-[8px] text-[14px] font-medium text-[#E7D8C6] hover:bg-[#555250]'
                    >
                        Həmişə — bu həftədən etibarən o sıra ilə davam etsin
                    </button>
                    <button
                        type='button'
                        onClick={onCancel}
                        className='rounded-[5px] px-[10px] py-[8px] text-[14px] text-[#777] hover:bg-[#EEE]'
                    >
                        Ləğv et
                    </button>
                </div>
            </div>
        </div>
    )
}

const DeleteConfirmDialog = ({ subject, onConfirm, onCancel }) => {
    if (!subject) {
        return null
    }

    return (
        <div
            className='fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-[20px]'
            role='dialog'
            aria-modal='true'
            aria-labelledby='delete-confirm-title'
        >
            <div className='w-full max-w-[380px] rounded-[8px] bg-[#FFF] p-[20px] text-[#333] shadow-lg'>
                <h2 id='delete-confirm-title' className='mb-[8px] text-[18px] font-bold'>Fənni sil</h2>
                <p className='mb-[15px] text-[14px]'>
                    “<strong>{subject.name}</strong>” silinsin? Əminsən?
                </p>
                <div className='flex flex-col gap-[8px]'>
                    <button
                        type='button'
                        onClick={onConfirm}
                        className='rounded-[5px] bg-[#A65B46] px-[10px] py-[8px] text-[14px] font-medium text-[#FFF] hover:bg-[#96543F]'
                    >
                        Bəli, sil
                    </button>
                    <button
                        type='button'
                        onClick={onCancel}
                        className='rounded-[5px] px-[10px] py-[8px] text-[14px] text-[#777] hover:bg-[#EEE]'
                    >
                        Ləğv et
                    </button>
                </div>
            </div>
        </div>
    )
}

const Dashboard = ({ subjects, onAddSubject, onRemoveSubject, onUpdateSubject, onApplyLessonType }) => {
    const today = new Date()
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const currentWeekStart = getMonday(today)
    const currentWeekNumber = getWeekNumber(currentWeekStart)
    const [viewedWeekStart, setViewedWeekStart] = useState(() => currentWeekStart)
    const [weekState, setWeekState] = useState(() => loadWeekState(currentWeekStart))
    const [editingSubject, setEditingSubject] = useState(null)
    const [pendingChange, setPendingChange] = useState(null)
    const [pendingWeekChange, setPendingWeekChange] = useState(null)
    const [pendingDeleteSubject, setPendingDeleteSubject] = useState(null)
    const [copyingSubject, setCopyingSubject] = useState(null)
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        try {
            return localStorage.getItem('academic-schedule-sidebar-open') !== '0'
        } catch {
            return true
        }
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

    useEffect(() => {
        localStorage.setItem(WEEK_STORAGE_KEY, JSON.stringify(weekState))
    }, [weekState])

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

    const requestWeekModeChange = (mode) => {
        if (mode === viewedMode) {
            return
        }
        setPendingWeekChange({ newMode: mode })
    }

    const chooseWeekModeChange = (scope) => {
        if (pendingWeekChange) {
            const { newMode } = pendingWeekChange
            setWeekState((current) => (
                scope === 'always'
                    ? reanchorWeekState(current, viewedWeekStart, newMode)
                    : withWeekOverride(current, viewedWeekStart, newMode)
            ))
            setPendingWeekChange(null)
        }
    }

    const clearWeekOverride = () => {
        setWeekState((current) => withWeekOverride(current, viewedWeekStart, null))
    }

    const weekDays = (
        days.map((name, index) => {
            const date = new Date(viewedWeekStart)
            date.setDate(viewedWeekStart.getDate() + index)
            return { name, date }
        })
    )

    const activeSubjects = subjects.filter((subject) => (
        subject.frequency === 'every-week'
        || subject.frequency === viewedMode
    ))
    const currentActiveSubjects = subjects.filter((subject) => (
        subject.frequency === 'every-week'
        || subject.frequency === currentMode
    ))

    const hours = getVisibleHours(activeSubjects)
    const conflicts = findConflicts(activeSubjects)

    const occurrences = activeSubjects.flatMap((subject) => (
        subject.schedule.map((lesson, lessonIndex) => {
            const sequenceIndex = getSequenceIndex(subject, lessonIndex, viewedWeekNumber)
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
    // Cədvəl və mobil siyahı baxılan həftəyə, "Bugün/Növbəti" panelləri həmişə real həftəyə baxır.
    const lessonsIn = (list, dayName, weekNum) => (
        list.flatMap((subject) => (
            subject.schedule
                .map((lesson, lessonIndex) => ({
                    subject,
                    lesson,
                    sequenceIndex: getSequenceIndex(subject, lessonIndex, weekNum),
                }))
                .filter(({ lesson }) => lesson.day === dayName)
                .map(({ subject, lesson, sequenceIndex }) => ({
                    subject,
                    lesson,
                    sequenceIndex,
                    type: resolveLessonType(subject, sequenceIndex),
                }))
        )).sort((a, b) => toMinutes(getStartTime(a.lesson)) - toMinutes(getStartTime(b.lesson)))
    )

    const todayLessons = lessonsIn(currentActiveSubjects, days[todayIndex], currentWeekNumber)
    const nextLesson = (() => {
        const remaining = todayLessons.filter(({ lesson }) => toMinutes(lesson.endTime || getStartTime(lesson)) > nowMinutes)
        if (remaining.length > 0) {
            return { ...remaining[0], day: days[todayIndex], isToday: true }
        }
        for (let index = todayIndex + 1; index < 7; index += 1) {
            const upcoming = lessonsIn(currentActiveSubjects, days[index], currentWeekNumber)
            if (upcoming.length > 0) {
                return { ...upcoming[0], day: days[index], isToday: false }
            }
        }
        return null
    })()

    const mobileLessons = lessonsIn(activeSubjects, mobileDay, viewedWeekNumber)

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

    return (
        <div className='flex flex-col gap-[15px] pb-[30px]'>
            <div className='grid grid-cols-1 gap-[10px] md:grid-cols-2'>
                <div className='rounded-[8px] bg-[#FFF] p-[12px] shadow-sm'>
                    <h2 className='mb-[8px] text-[15px] font-bold text-[#434140]'>Bugünkü dərslər</h2>
                    {todayLessons.length === 0 ? (
                        <p className='text-[13px] text-[#777]'>Bu gün dərs yoxdur.</p>
                    ) : (
                        <ul className='flex flex-col gap-[6px]'>
                            {todayLessons.map(({ subject, lesson, sequenceIndex, type }) => {
                                const start = toMinutes(getStartTime(lesson))
                                const end = toMinutes(lesson.endTime || getStartTime(lesson))
                                const state = nowMinutes < start ? 'gözləyir' : nowMinutes <= end ? 'indi' : 'bitib'
                                return (
                                    <li key={`${subject.id}-${sequenceIndex}`} className='flex items-center justify-between gap-[8px] rounded-[5px] bg-[#F7F3EC] px-[8px] py-[6px] text-[13px]'>
                                        <span className='min-w-0 truncate'>
                                            <strong>{getStartTime(lesson)}</strong> {subject.name}
                                            <span className='text-[#777]'> • {typeLabels[type]}</span>
                                        </span>
                                        <span className={`shrink-0 rounded-full px-[8px] py-[2px] text-[12px] ${state === 'indi' ? 'bg-[#477A68] text-[#FFF]' : 'bg-[#EEE] text-[#555]'}`}>
                                            {state}
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>
                <div className='rounded-[8px] bg-[#FFF] p-[12px] shadow-sm'>
                    <h2 className='mb-[8px] text-[15px] font-bold text-[#434140]'>Növbəti dərs</h2>
                    {!nextLesson ? (
                        <p className='text-[13px] text-[#777]'>Bu həftə başqa dərs qalmayıb.</p>
                    ) : (
                        <p className='text-[14px] text-[#333]'>
                            <strong>{nextLesson.day}{nextLesson.isToday ? ' (bugün)' : ''}</strong>{' '}
                            {getStartTime(nextLesson.lesson)} — {nextLesson.subject.name}{' '}
                            <span className='text-[#777]'>({typeLabels[nextLesson.type]})</span>
                            {[nextLesson.subject.teacher, nextLesson.subject.room].filter(Boolean).length > 0 && (
                                <span className='text-[#777]'> • {[nextLesson.subject.teacher, nextLesson.subject.room].filter(Boolean).join(' • ')}</span>
                            )}
                        </p>
                    )}
                </div>
            </div>

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

            <div className={`flex flex-col gap-[15px] lg:flex-row ${sidebarOpen ? 'lg:gap-[15px]' : 'lg:gap-0'}`}>
                <div className={`shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-in-out ${sidebarOpen ? 'w-full opacity-100 lg:w-[245px]' : 'hidden opacity-0 lg:block lg:h-auto lg:w-0'}`}>
                    <SubjectMenu
                        subjects={subjects}
                        onRequestRemoveSubject={setPendingDeleteSubject}
                        onEditSubject={setEditingSubject}
                        onDuplicateSubject={(subject) => setCopyingSubject({
                            ...subject,
                            schedule: subject.schedule.map((lesson) => ({ ...lesson })),
                            name: `${subject.name} (nüsxə)`,
                        })}
                        onHideSidebar={toggleSidebar}
                    />
                </div>
                <main className='min-w-0 flex-1'>
                    {!sidebarOpen && (
                        <button
                            type='button'
                            onClick={toggleSidebar}
                            aria-label='Fənlərim panelini aç'
                            title='Fənlərim'
                            className='fixed left-0 top-1/2 z-10 -translate-y-1/2 rounded-r-[8px] bg-[#434140] px-[8px] py-[14px] text-[18px] text-[#E7D8C6] shadow-md hover:bg-[#555250]'
                        >
                            <FiChevronsRight aria-hidden='true' />
                        </button>
                    )}
                    <div className='mb-[10px] flex items-center justify-between'>
                        <div>
                            <h1 className='text-[22px] font-bold text-[#434140]'>Həftəlik cədvəl</h1>
                            <p className='text-[13px] text-[#666]'>
                                Bu həftə: <strong>{lectureTotal} müh.</strong>, <strong>{seminarTotal} sem.</strong>
                            </p>
                        </div>
                        <div className='flex flex-col items-end gap-[5px]'>
                            <div className='flex items-stretch overflow-hidden rounded-[6px] border border-[#434140] text-[13px]'>
                                <button
                                    type='button'
                                    onClick={() => goToWeek(addWeeks(viewedWeekStart, -1))}
                                    aria-label='Əvvəlki həftə'
                                    title='Əvvəlki həftə'
                                    className='flex items-center px-[10px] py-[5px] text-[15px] text-[#434140] hover:bg-[#EEE]'
                                >
                                    <FiChevronLeft aria-hidden='true' />
                                </button>
                                {!viewedIsCurrent && (
                                    <button
                                        type='button'
                                        onClick={() => goToWeek(currentWeekStart)}
                                        className='border-x border-[#DDD] px-[12px] py-[5px] font-medium text-[#434140] hover:bg-[#EEE]'
                                    >
                                        Bu gün
                                    </button>
                                )}
                                <button
                                    type='button'
                                    onClick={() => goToWeek(addWeeks(viewedWeekStart, 1))}
                                    aria-label='Növbəti həftə'
                                    title='Növbəti həftə'
                                    className='flex items-center px-[10px] py-[5px] text-[15px] text-[#434140] hover:bg-[#EEE]'
                                >
                                    <FiChevronRight aria-hidden='true' />
                                </button>
                            </div>
                            <div className='flex items-center gap-[6px]'>
                                <div className='flex overflow-hidden rounded-[5px] border border-[#A65B46] text-[12px]'>
                                    <button type='button' onClick={() => requestWeekModeChange('upper-week')} className={`px-[10px] py-[5px] ${viewedMode === 'upper-week' ? 'bg-[#A65B46] font-bold text-[#FFF] hover:bg-[#96543F]' : 'bg-[#FFF] text-[#A65B46] hover:bg-[#F7F3EC]'}`}>Üst həftə</button>
                                    <button type='button' onClick={() => requestWeekModeChange('lower-week')} className={`px-[10px] py-[5px] ${viewedMode === 'lower-week' ? 'bg-[#A65B46] font-bold text-[#FFF] hover:bg-[#96543F]' : 'bg-[#FFF] text-[#A65B46] hover:bg-[#F7F3EC]'}`}>Alt həftə</button>
                                </div>
                                {viewedWeekType.isOverride && (
                                    <button
                                        type='button'
                                        onClick={clearWeekOverride}
                                        title='Avtomatik növbələşməyə qayıt'
                                        className='rounded-[5px] border border-[#AAA] px-[8px] py-[4px] text-[12px] text-[#434140] hover:bg-[#EEE]'
                                    >
                                        Avto
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className='mb-[10px] flex gap-[6px] overflow-x-auto rounded-[8px] bg-[#FFF] p-[8px] shadow-sm lg:hidden'>
                        {days.map((day) => (
                            <button
                                key={day}
                                type='button'
                                onClick={() => setMobileDay(day)}
                                className={`shrink-0 rounded-[5px] px-[10px] py-[6px] text-[12px] ${mobileDay === day ? 'bg-[#434140] text-[#FFF] hover:bg-[#555250]' : 'bg-[#EEE] text-[#333] hover:bg-[#DFDFDF]'}`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                    <div className='flex flex-col gap-[8px] lg:hidden'>
                        {mobileLessons.length === 0 ? (
                            <p className='rounded-[8px] bg-[#FFF] p-[12px] text-[13px] text-[#777] shadow-sm'>
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
                                />
                            ))
                        )}
                    </div>

                    <div className='hidden overflow-x-auto rounded-[8px] bg-[#FFF] shadow-sm lg:block'>
                        <div className='min-w-[1050px]'>
                            <div className='grid grid-cols-[65px_repeat(7,minmax(130px,1fr))] border-b border-[#DDD]'>
                                <div className='border-b border-[#DDD] p-[8px]' />
                                {weekDays.map(({ name, date }) => (
                                    <div key={name} className={`border-r border-[#DDD] p-[8px] text-center ${date.toDateString() === today.toDateString() ? 'bg-[#FCE5E0]' : ''}`}>
                                        <p className='text-[12px] text-[#666]'>{name}</p>
                                        <p className='font-bold text-[#434140]'>{date.getDate()}</p>
                                    </div>
                                ))}
                            </div>

                            <div className='grid grid-cols-[65px_repeat(7,minmax(130px,1fr))]'>
                                <div className='relative' style={{ height: `${hours.length * HOUR_PX}px` }}>
                                    {hours.map((hour) => (
                                        <div
                                            key={hour}
                                            className='absolute right-[8px] text-right text-[12px] text-[#777]'
                                            style={{ top: `${(hour - hours[0]) * HOUR_PX - 9}px` }}
                                        >
                                            {String(hour).padStart(2, '0')}:00
                                        </div>
                                    ))}
                                </div>
                                {weekDays.map(({ name, date }) => {
                                    const isTodayColumn = date.toDateString() === today.toDateString()
                                    const positioned = layoutDayEvents(lessonsIn(activeSubjects, name, viewedWeekNumber))
                                    const showNowLine = isTodayColumn
                                        && nowMinutes >= hours[0] * 60
                                        && nowMinutes <= (hours[hours.length - 1] + 1) * 60
                                    const nowY = ((nowMinutes - hours[0] * 60) / 60) * HOUR_PX
                                    return (
                                        <div
                                            key={name}
                                            className={`relative border-l border-[#DDD] ${isTodayColumn ? 'bg-[#FCE5E0]/50' : ''}`}
                                            style={{ height: `${hours.length * HOUR_PX}px` }}
                                        >
                                            {hours.map((hour) => (
                                                <div
                                                    key={hour}
                                                    className='absolute left-0 right-0 border-t border-[#DDD]'
                                                    style={{ top: `${(hour - hours[0]) * HOUR_PX}px` }}
                                                />
                                            ))}
                                            {positioned.map(({ subject, lesson, sequenceIndex, lane, laneCount, start, end }) => (
                                                <div
                                                    key={`${subject.id}-${sequenceIndex}`}
                                                    className='absolute'
                                                    style={{
                                                        top: `${((start - hours[0] * 60) / 60) * HOUR_PX + 3}px`,
                                                        height: `${Math.max(((end - start) / 60) * HOUR_PX - 6, 60)}px`,
                                                        left: `calc(${(lane / laneCount) * 100}% + 3px)`,
                                                        width: `calc(${100 / laneCount}% - 6px)`,
                                                    }}
                                                >
                                                    <CalendarEvent
                                                        subject={subject}
                                                        lesson={lesson}
                                                        sequenceIndex={sequenceIndex}
                                                        onRequestTypeChange={requestTypeChange}
                                                    />
                                                </div>
                                            ))}
                                            {showNowLine && (
                                                <div
                                                    className='absolute left-0 right-0 z-10 flex items-center'
                                                    style={{ top: `${nowY}px` }}
                                                    title={`İndi: ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`}
                                                >
                                                    <div className='h-[9px] w-[9px] shrink-0 rounded-full bg-red-500' />
                                                    <div className='h-[2px] w-full bg-red-500' />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    {subjects.length === 0 && (
                        <div className='mt-[15px] rounded-[8px] border border-dashed border-[#A65B46] p-[20px] text-center text-[#555]'>
                            Başlamaq üçün “+ Yeni Fənn” düyməsinə kliklə.
                        </div>
                    )}
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

            {editingSubject && (
                <NewSubjectModal
                    initialSubject={editingSubject}
                    onClose={() => setEditingSubject(null)}
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
                    onClose={() => setCopyingSubject(null)}
                    onSubmit={(copied) => {
                        onAddSubject(copied)
                        setCopyingSubject(null)
                    }}
                />
            )}
        </div>
    )
}

export default Dashboard
