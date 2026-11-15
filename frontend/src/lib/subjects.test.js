import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  getSequenceIndex,
  normalizeSubject,
  resolveLessonType,
  withOnceOverride,
  withShiftedOffset,
} from './subjects.js'

const makeSubject = (overrides = {}) => normalizeSubject({
  id: 's1',
  name: 'Test fənni',
  lectureCount: 2,
  seminarCount: 1,
  frequency: 'every-week',
  schedule: [
    { day: 'Bazar ertəsi', startTime: '10:00', endTime: '11:00' },
    { day: 'Çərşənbə', startTime: '10:00', endTime: '11:00' },
  ],
  overrides,
})

describe('normalizeSubject', () => {
  it('saylar əsasdır, slotdakı tip nəzərə alınmır', () => {
    const subject = normalizeSubject({
      name: 'X',
      lectureCount: 2,
      seminarCount: 1,
      schedule: [
        { day: 'A', startTime: '10:00', endTime: '11:00', type: 'seminar' },
        { day: 'B', startTime: '10:00', endTime: '11:00', type: 'lecture' },
      ],
    })
    assert.equal(subject.lectureCount, 2)
    assert.equal(subject.seminarCount, 1)
    assert.deepEqual(subject.schedule.map((lesson) => lesson.type), [undefined, undefined])
  })

  it('səhv məlumatları rədd edir', () => {
    assert.throws(() => normalizeSubject({}), /Fənn adı/)
    assert.throws(
      () => normalizeSubject({ name: 'X', lectureCount: 1, seminarCount: 0, schedule: [] }),
      /ən azı bir dərs günü/,
    )
    assert.throws(
      () => normalizeSubject({
        name: 'X',
        lectureCount: 1,
        seminarCount: 0,
        schedule: [{ day: 'A', startTime: '11:00', endTime: '10:00' }],
      }),
      /bitiş saatı/,
    )
  })

  it('overrides təmizlənir, offset və metadata saxlanılır', () => {
    const subject = normalizeSubject({
      name: 'X',
      lectureCount: 1,
      seminarCount: 1,
      teacher: 'A',
      room: '301',
      sequenceOffset: 1,
      overrides: { 5: 'seminar', x: 'lecture', 7: 'pis' },
      schedule: [{ day: 'A', startTime: '10:00', endTime: '11:00' }],
    })
    assert.deepEqual(subject.overrides, { 5: 'seminar' })
    assert.equal(subject.sequenceOffset, 1)
    assert.equal(subject.teacher, 'A')
  })
})

describe('nisbət mühərriki (2 mühazirə + 1 seminar)', () => {
  it('ardıcıllıq L,L,S təkrarlanır', () => {
    const subject = makeSubject()
    const types = [0, 1, 2, 3, 4, 5].map((seq) => resolveLessonType(subject, seq))
    assert.deepEqual(types, ['lecture', 'lecture', 'seminar', 'lecture', 'lecture', 'seminar'])
  })

  it('getSequenceIndex həftə rejiminə görə artır', () => {
    const subject = makeSubject()
    assert.equal(getSequenceIndex(subject, 1, 10), 10 * 2 + 1)
    const alt = { ...subject, frequency: 'upper-week' }
    assert.equal(getSequenceIndex(alt, 1, 10), Math.floor(10 / 2) * 2 + 1)
  })

  it('birdəfəlik: fərqlidirsə yazılır, qaydaya bərabərdirsə silinir', () => {
    const subject = makeSubject()
    const changed = withOnceOverride(subject, 3, 'seminar')
    assert.equal(changed.overrides['3'], 'seminar')
    assert.equal(resolveLessonType(changed, 3), 'seminar')
    assert.equal(resolveLessonType(changed, 4), 'lecture')
    const reverted = withOnceOverride(changed, 3, 'lecture')
    assert.ok(!('3' in reverted.overrides))
  })

  it('həmişəlik: hədəf düzəlir, nisbət pozulmur (seminarlar arda-arda düşmür)', () => {
    const subject = makeSubject()
    const shifted = withShiftedOffset(subject, 3, 'seminar')
    assert.equal(resolveLessonType(shifted, 3), 'seminar')
    const types = [3, 4, 5, 6, 7, 8].map((seq) => resolveLessonType(shifted, seq))
    assert.deepEqual(types, ['seminar', 'lecture', 'lecture', 'seminar', 'lecture', 'lecture'])
  })

  it('həmişəlik ikinci dəfə də işləyir (offset sıfır olmayanda)', () => {
    const once = withShiftedOffset(makeSubject(), 3, 'seminar')
    const twice = withShiftedOffset(once, 4, 'seminar')
    assert.equal(resolveLessonType(twice, 4), 'seminar')
    const types = [3, 4, 5, 6, 7, 8].map((seq) => resolveLessonType(twice, seq))
    assert.deepEqual(types, ['lecture', 'seminar', 'lecture', 'lecture', 'seminar', 'lecture'])
  })

  it('həmişəlik həmin halın birdəfəlik istisnasını təmizləyir', () => {
    const withOverride = withOnceOverride(makeSubject(), 3, 'seminar')
    assert.equal(resolveLessonType(withOverride, 3), 'seminar')
    const shifted = withShiftedOffset(withOverride, 3, 'lecture')
    assert.ok(!('3' in shifted.overrides))
    assert.equal(resolveLessonType(shifted, 3), 'lecture')
  })
})
