import { useEffect, useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import {
  normalizeSubject,
  withOnceOverride,
  withShiftedOffset,
} from './lib/subjects'

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

function App() {
  const [subjects, setSubjects] = useState(loadSubjects)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects))
  }, [subjects])

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
      />
      <Dashboard
        subjects={subjects}
        onAddSubject={addSubject}
        onRemoveSubject={removeSubject}
        onUpdateSubject={updateSubject}
        onApplyLessonType={applyLessonType}
      />
    </div>
  )
}

export default App
