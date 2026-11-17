import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { getToken } from './lib/auth'
import {
  normalizeSubject,
  withOnceOverride,
  withShiftedOffset,
} from './lib/subjects'
import {
  createSubject as apiCreateSubject,
  deleteSubject as apiDeleteSubject,
  fetchSubjects as apiFetchSubjects,
  fetchWeekState as apiFetchWeekState,
  importSubjects as apiImportSubjects,
  saveWeekState as apiSaveWeekState,
  updateSubject as apiUpdateSubject,
} from './lib/api'
import { defaultWeekState, getWeekNumber, mondayOfWeek, normalizeWeekState } from './lib/weeks'

// Köhnə localStorage açarları — yalnız ilk açılışda MongoDB-yə köçürmək üçün oxunur.
const LEGACY_SUBJECTS_KEY = 'academic-schedule-subjects'
const LEGACY_WEEK_KEY = 'academic-schedule-week-mode'

const readLegacySubjects = () => {
  try {
    const saved = localStorage.getItem(LEGACY_SUBJECTS_KEY)
    if (!saved) {
      return []
    }
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .map((subject) => {
        try {
          return normalizeSubject(subject)
        } catch {
          return null
        }
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

const readLegacyWeekState = (monday) => {
  try {
    const saved = localStorage.getItem(LEGACY_WEEK_KEY)
    if (!saved) {
      return null
    }
    return normalizeWeekState(
      JSON.parse(saved),
      monday,
      getWeekNumber(monday) % 2 === 0 ? 'upper-week' : 'lower-week',
    )
  } catch {
    return null
  }
}

const THEME_KEY = 'academic-schedule-theme'

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') {
      return saved
    }
  } catch {
    // yaddaş əlçatan deyilsə sistem rənginə baxılır
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function ScheduleApp() {
  const [subjects, setSubjects] = useState([])
  const [jump, setJump] = useState(null)
  const [theme, setTheme] = useState(getInitialTheme)
  const [isDayInfoOpen, setIsDayInfoOpen] = useState(false)
  const [weekState, setWeekState] = useState(() => {
    const monday = mondayOfWeek(new Date())
    return defaultWeekState(monday, getWeekNumber(monday) % 2 === 0 ? 'upper-week' : 'lower-week')
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const subjectsRef = useRef([])
  const weekStateRef = useRef(weekState)
  const loadedRef = useRef(false)

  // İlk açılış: servərdən yüklə, boşdursa localStorage-dakıları köçür.
  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      try {
        const [serverSubjects, serverWeek] = await Promise.all([
          apiFetchSubjects(),
          apiFetchWeekState(),
        ])
        if (cancelled) {
          return
        }
        const valid = serverSubjects
          .map((subject) => {
            try {
              return normalizeSubject(subject)
            } catch {
              return null
            }
          })
          .filter(Boolean)
        if (valid.length === 0) {
          const legacy = readLegacySubjects()
          if (legacy.length > 0) {
            const imported = await apiImportSubjects(legacy)
            localStorage.removeItem(LEGACY_SUBJECTS_KEY)
            setSubjects(imported.map((subject) => normalizeSubject(subject)))
          } else {
            setSubjects([])
          }
        } else {
          setSubjects(valid)
        }
        if (serverWeek) {
          const monday = mondayOfWeek(new Date())
          setWeekState(normalizeWeekState(
            serverWeek,
            monday,
            getWeekNumber(monday) % 2 === 0 ? 'upper-week' : 'lower-week',
          ))
        } else {
          const monday = mondayOfWeek(new Date())
          const fallback = defaultWeekState(
            monday,
            getWeekNumber(monday) % 2 === 0 ? 'upper-week' : 'lower-week',
          )
          const migrated = readLegacyWeekState(monday) || fallback
          await apiSaveWeekState(migrated)
          localStorage.removeItem(LEGACY_WEEK_KEY)
          if (!cancelled) {
            setWeekState(migrated)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Məlumat yüklənmədi.')
        }
      } finally {
        if (!cancelled) {
          loadedRef.current = true
          setLoading(false)
        }
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    subjectsRef.current = subjects
  }, [subjects])

  useEffect(() => {
    weekStateRef.current = weekState
    if (!loadedRef.current) {
      return
    }
    apiSaveWeekState(weekState).catch((err) => {
      setError(err.message || 'Həftə rejimi yadda saxlanmadı.')
    })
  }, [weekState])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // yaddaş əlçatan deyilsə sessiya ilə qalır
    }
  }, [theme])

  // Çap həmişə açıq rejimdə çıxır.
  useEffect(() => {
    const handleBeforePrint = () => document.documentElement.classList.remove('dark')
    const handleAfterPrint = () => {
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [theme])



  const addSubject = async (subject) => {
    try {
      const created = await apiCreateSubject(normalizeSubject(subject))
      setSubjects((currentSubjects) => [...currentSubjects, normalizeSubject(created)])
    } catch (error) {
      setError(error.message || 'Fənn əlavə edilmədi.')
    }
  }

  const updateSubject = async (updatedSubject) => {
    try {
      const normalized = normalizeSubject(updatedSubject)
      const saved = await apiUpdateSubject(normalized.id, normalized)
      const fresh = normalizeSubject(saved)
      setSubjects((currentSubjects) => (
        currentSubjects.map((subject) => (subject.id === fresh.id ? fresh : subject))
      ))
    } catch (error) {
      setError(error.message || 'Fənn yenilənmədi.')
    }
  }

  const removeSubject = async (subjectId) => {
    try {
      await apiDeleteSubject(subjectId)
      setSubjects((currentSubjects) => (
        currentSubjects.filter((subject) => subject.id !== subjectId)
      ))
    } catch (error) {
      setError(error.message || 'Fənn silinmədi.')
    }
  }

  // mode === 'once': yalnız bu hala istisna yazılır, ardıcıllıq toxunulmur.
  // mode === 'always': ardıcıllıq sürüşür, qalanlar eyni nisbətlə davam edir.
  const applyLessonType = (subjectId, sequenceIndex, type, mode) => {
    if (type !== 'lecture' && type !== 'seminar') {
      return
    }
    const subject = subjectsRef.current.find((item) => item.id === subjectId)
    if (!subject) {
      return
    }
    const next = mode === 'always'
      ? withShiftedOffset(subject, sequenceIndex, type)
      : withOnceOverride(subject, sequenceIndex, type)
    setSubjects((currentSubjects) => (
      currentSubjects.map((item) => (item.id === subjectId ? next : item))
    ))
    apiUpdateSubject(subjectId, next).catch((error) => {
      setError(error.message || 'Dəyişiklik yadda saxlanmadı.')
    })
  }

  const handleWeekStateChange = (updater) => {
    const next = typeof updater === 'function' ? updater(weekStateRef.current) : updater
    setWeekState(next)
  }

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <p className='text-[15px] text-[#777] dark:text-[#A8A29E]'>Yüklənir…</p>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-[20px] sm:px-[40px] lg:px-[60px]'>
      {error && (
        <div className='mt-[15px] flex items-center justify-between gap-[10px] rounded-[8px] border border-[#A65B46] bg-[#FCE5E0] p-[12px] text-[13px] text-[#6E3A2C]'>
          <span>{error}</span>
          <button
            type='button'
            onClick={() => window.location.reload()}
            className='shrink-0 rounded-[5px] bg-[#A65B46] px-[10px] py-[5px] font-medium text-[#FFF] hover:bg-[#96543F]'
          >
            Yenidən cəhd et
          </button>
        </div>
      )}
      <Navbar
        subjects={subjects}
        onAddSubject={addSubject}
        onSelectLesson={(selection) => setJump({ ...selection, n: Date.now() })}
        theme={theme}
        onSelectTheme={setTheme}
        weekSystem={weekState.system}
        weekState={weekState}
        onWeekSystemChange={(system) => handleWeekStateChange((current) => ({ ...current, system }))}
        onOpenDayInfo={() => setIsDayInfoOpen(true)}
      />
      <Dashboard
        subjects={subjects}
        onAddSubject={addSubject}
        onRemoveSubject={removeSubject}
        onUpdateSubject={updateSubject}
        onApplyLessonType={applyLessonType}
        jump={jump}
        weekState={weekState}
        onWeekStateChange={handleWeekStateChange}
        isDayInfoOpen={isDayInfoOpen}
        onDayInfoOpenChange={setIsDayInfoOpen}
      />
    </div>
  )
}

const RequireAuth = ({ children }) => (getToken() ? children : <Navigate to='/login' replace />)

const RequireGuest = ({ children }) => (getToken() ? <Navigate to='/' replace /> : children)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<RequireAuth><ScheduleApp /></RequireAuth>} />
        <Route path='/login' element={<RequireGuest><LoginPage /></RequireGuest>} />
        <Route path='/register' element={<RequireGuest><RegisterPage /></RequireGuest>} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
