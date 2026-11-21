// frontend/src/lib/subjects.js-in server portu (tip həlli hissəsi).
// Dəyişəndə hər iki faylı sinxron saxla.
export const getSequenceIndex = (subject, lessonIndex, weekNumber) => {
  const weekIndex = subject.frequency === 'every-week'
    ? weekNumber
    : Math.floor(weekNumber / 2)
  return (weekIndex * subject.schedule.length) + lessonIndex
}

const getRuleType = (subject, sequenceIndex) => {
  const lectureCount = Number(subject.lectureCount) || 0
  const seminarCount = Number(subject.seminarCount) || 0
  const cycleLength = lectureCount + seminarCount
  if (!cycleLength) {
    return 'lecture'
  }

  const cycleIndex = (sequenceIndex + (Number(subject.sequenceOffset) || 0)) % cycleLength
  return cycleIndex < lectureCount ? 'lecture' : 'seminar'
}

export const resolveLessonType = (subject, sequenceIndex) => {
  const key = String(sequenceIndex)
  if (subject.overrides && subject.overrides[key]) {
    return subject.overrides[key]
  }
  return getRuleType(subject, sequenceIndex)
}
