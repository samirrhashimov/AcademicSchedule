const VALID_FREQUENCIES = ['every-week', 'upper-week', 'lower-week']
const VALID_TYPES = ['lecture', 'seminar']

const toCleanString = (value) => (typeof value === 'string' ? value.trim() : '')

// Tip yalnız say nisbətindən (mühazirə + seminar sayı) hesablanır.
// Cədvəl günlərinin ayrıca tipi yoxdur; düzəliş cədvəldən edilir:
// birdəfəlik istisna (overrides) və ya həmişəlik (ardıcıllığın sürüşməsi).
// Hər dərsin effektiv tezliyi: dərsinki varsa o, yoxdursa köhnə fənn səviyyəli (miqrasiya).
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

// Birdəfəlik: yalnız həmin hala istisna yazılır, ardıcıllıq toxunulmur.
// Seçilən tip qaydaya bərabərdirsə, köhnə istisna silinir.
export const withOnceOverride = (subject, sequenceIndex, type) => {
  const key = String(sequenceIndex)
  const overrides = { ...(subject.overrides || {}) }
  if (getRuleType(subject, sequenceIndex) === type) {
    delete overrides[key]
  } else {
    overrides[key] = type
  }
  return { ...subject, overrides }
}

// Həmişəlik: ardıcıllıq elə sürüşür ki, həmin hal seçilən tip olsun,
// qalanlar da eyni nisbətlə davam etsin (seminarlar arda-arda düşməsin).
// Köhnə offset və həmin halın birdəfəlik istisnası təmizlənir.
export const withShiftedOffset = (subject, sequenceIndex, type) => {
  const lectureCount = Number(subject.lectureCount) || 0
  const seminarCount = Number(subject.seminarCount) || 0
  const cycleLength = lectureCount + seminarCount
  if (!cycleLength) {
    return subject
  }

  const typeIndex = type === 'lecture' ? 0 : lectureCount
  const shifted = (typeIndex - sequenceIndex) % cycleLength
  const overrides = { ...(subject.overrides || {}) }
  delete overrides[String(sequenceIndex)]
  return { ...subject, sequenceOffset: (shifted + cycleLength) % cycleLength, overrides }
}

export const normalizeSubject = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Fənn obyekti yanlış formatdadır.')
  }

  const name = toCleanString(raw.name)
  if (!name) {
    throw new Error('Fənn adı boş ola bilməz.')
  }

  const lectureCount = Math.max(0, Math.floor(Number(raw.lectureCount) || 0))
  const seminarCount = Math.max(0, Math.floor(Number(raw.seminarCount) || 0))
  if (lectureCount + seminarCount === 0) {
    throw new Error(`"${name}": mühazirə və ya seminar sayı ən azı 1 olmalıdır.`)
  }

  if (!Array.isArray(raw.schedule) || raw.schedule.length === 0) {
    throw new Error(`"${name}": ən azı bir dərs günü olmalıdır.`)
  }

  const frequency = VALID_FREQUENCIES.includes(raw.frequency) ? raw.frequency : 'every-week'
  const schedule = raw.schedule.map((lesson, index) => {
    const day = toCleanString(lesson?.day)
    const startTime = toCleanString(lesson?.startTime || lesson?.time)
    const endTime = toCleanString(lesson?.endTime)
    if (!day || !startTime || !endTime) {
      throw new Error(`"${name}": ${index + 1}-ci dərsin günü/saatı natamamdır.`)
    }
    if (endTime <= startTime) {
      throw new Error(`"${name}" (${day}): bitiş saatı başlanğıcdan sonra olmalıdır.`)
    }
    return {
      day,
      startTime,
      endTime,
      frequency: VALID_FREQUENCIES.includes(lesson?.frequency) ? lesson.frequency : frequency,
    }
  })

  const overrides = {}
  if (raw.overrides && typeof raw.overrides === 'object' && !Array.isArray(raw.overrides)) {
    for (const [key, value] of Object.entries(raw.overrides)) {
      if (VALID_TYPES.includes(value) && key.trim() !== '' && !Number.isNaN(Number(key))) {
        overrides[String(Number(key))] = value
      }
    }
  }

  return {
    id: toCleanString(raw.id) || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    lectureCount,
    seminarCount,
    frequency,
    schedule,
    teacher: toCleanString(raw.teacher),
    room: toCleanString(raw.room),
    sequenceOffset: Number(raw.sequenceOffset) || 0,
    overrides,
  }
}

