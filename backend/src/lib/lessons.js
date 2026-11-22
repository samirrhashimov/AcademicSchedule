// frontend/src/lib/subjects.js-in server portu (tip həlli hissəsi).
// Dəyişəndə hər iki faylı sinxron saxla.
const VALID_FREQUENCIES = ['every-week', 'upper-week', 'lower-week']

export const lessonFrequency = (subject, lesson) => {
  if (VALID_FREQUENCIES.includes(lesson?.frequency)) {
    return lesson.frequency
  }
  if (VALID_FREQUENCIES.includes(subject?.frequency)) {
    return subject.frequency
  }
  return 'every-week'
}

export const getSequenceIndex = (subject, lesson, lessonIndex, weekNumber) => {
  const weekIndex = lessonFrequency(subject, lesson) === 'every-week'
    ? weekNumber
    : Math.floor(weekNumber / 2)
  return (weekIndex * subject.schedule.length) + lessonIndex
}

export const isLessonVisible = (subject, lesson, mode) => {
  const frequency = lessonFrequency(subject, lesson)
  return frequency === 'every-week' || frequency === mode
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
