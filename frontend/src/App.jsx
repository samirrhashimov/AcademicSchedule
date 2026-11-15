import { useEffect, useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import {
  normalizeSubject,
  withOnceOverride,
  withShiftedOffset,
} from './lib/subjects'
import { loadWeekState, mondayOfWeek, saveWeekState } from './lib/weeks'

const STORAGE_KEY = 'academic-schedule-subjects'

const loadSubjects = () => {
  try {
    const savedSubjects = localStorage.getItem(STORAGE_KEY)
    if (!savedSubjects) {
      return []
    }
    const parsed = JSON.parse(savedSubjects)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .map((subject) => {
        try {
          return normalizeSubject(subject)
        } catch (error) {
          console.warn('Köhnə fənn keçirilmədi:', error)
          return null
        }
      })
      .filter(Boolean)
  } catch (error) {
    console.error('Fənlər localStorage-dan oxunmadı:', error)
    return []
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

function App() {
  const [subjects, setSubjects] = useState(loadSubjects)
  const [jump, setJump] = useState(null)
  const [theme, setTheme] = useState(getInitialTheme)
  const [weekState, setWeekState] = useState(() => loadWeekState(mondayOfWeek(new Date())))

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects))
  }, [subjects])

  useEffect(() => {
    try {
      saveWeekState(weekState)
    } catch {
      // yaddaş əlçatan deyilsə sessiya ilə qalır
    }
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



  const addSubject = (subject) => {
    try {
      setSubjects((currentSubjects) => [...currentSubjects, normalizeSubject(subject)])
    } catch (error) {
      console.error('Fənn əlavə edilmədi:', error)
    }
  }

  const updateSubject = (updatedSubject) => {
    try {
      const normalized = normalizeSubject(updatedSubject)
      setSubjects((currentSubjects) => (
        currentSubjects.map((subject) => (subject.id === normalized.id ? normalized : subject))
      ))
    } catch (error) {
      console.error('Fənn yenilənmədi:', error)
    }
  }

  const removeSubject = (subjectId) => {
    setSubjects((currentSubjects) => (
      currentSubjects.filter((subject) => subject.id !== subjectId)
    ))
  }

  // mode === 'once': yalnız bu hala istisna yazılır, ardıcıllıq toxunulmur.
  // mode === 'always': ardıcıllıq sürüşür, qalanlar eyni nisbətlə davam edir.
  const applyLessonType = (subjectId, sequenceIndex, type, mode) => {
    if (type !== 'lecture' && type !== 'seminar') {
      return
    }
    setSubjects((currentSubjects) => currentSubjects.map((subject) => {
      if (subject.id !== subjectId) {
        return subject
      }
      return mode === 'always'
        ? withShiftedOffset(subject, sequenceIndex, type)
        : withOnceOverride(subject, sequenceIndex, type)
    }))
  }

  return (
    <div className='container mx-auto px-[20px] sm:px-[40px] lg:px-[60px]'>
      <Navbar
        subjects={subjects}
        onAddSubject={addSubject}
        onSelectLesson={(selection) => setJump({ ...selection, n: Date.now() })}
        theme={theme}
        onSelectTheme={setTheme}
        weekSystem={weekState.system}
        onWeekSystemChange={(system) => setWeekState((current) => ({ ...current, system }))}
      />
      <Dashboard
        subjects={subjects}
        onAddSubject={addSubject}
        onRemoveSubject={removeSubject}
        onUpdateSubject={updateSubject}
        onApplyLessonType={applyLessonType}
        jump={jump}
        weekState={weekState}
        onWeekStateChange={setWeekState}
      />
    </div>
  )
}

export default App
