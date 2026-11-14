import { useEffect, useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'

const STORAGE_KEY = 'academic-schedule-subjects'

function App() {
  const [subjects, setSubjects] = useState(() => {
    try {
      const savedSubjects = localStorage.getItem(STORAGE_KEY)
      return savedSubjects ? JSON.parse(savedSubjects) : []
    } catch (error) {
      console.error('Fənlər localStorage-dan oxunmadı:', error)
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects))
  }, [subjects])

  const addSubject = (subject) => {
    setSubjects((currentSubjects) => [...currentSubjects, subject])
  }

  const removeSubject = (subjectId) => {
    setSubjects((currentSubjects) => (
      currentSubjects.filter((subject) => subject.id !== subjectId)
    ))
  }

  const updateLessonType = (subjectId, sequenceIndex, type) => {
    setSubjects((currentSubjects) => currentSubjects.map((subject) => {
      if (subject.id !== subjectId) {
        return subject
      }

      const cycleLength = subject.lectureCount + subject.seminarCount
      if (!cycleLength) {
        return subject
      }

      const typeIndex = type === 'lecture' ? 0 : subject.lectureCount
      const currentOffset = subject.sequenceOffset || 0
      const offset = (typeIndex - (sequenceIndex + currentOffset)) % cycleLength

      return { ...subject, sequenceOffset: (offset + cycleLength) % cycleLength }
    }))
  }

  return (
    <div className='container mx-auto px-[20px] sm:px-[40px] lg:px-[60px]'>
      <Navbar subjects={subjects} onAddSubject={addSubject} />
      <Dashboard
        subjects={subjects}
        onRemoveSubject={removeSubject}
        onUpdateLessonType={updateLessonType}
      />
    </div>
  )
}

export default App
