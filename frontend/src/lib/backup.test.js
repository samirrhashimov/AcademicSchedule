import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  BACKUP_APP,
  BACKUP_VERSION,
  backupFileName,
  buildBackup,
  parseBackup,
} from './backup.js'

const sampleSubjects = () => ([
  {
    id: 's1',
    name: 'Test fənni',
    lectureCount: 2,
    seminarCount: 1,
    frequency: 'upper-week',
    schedule: [{ day: 'Bazar ertəsi', startTime: '10:00', endTime: '11:20' }],
    teacher: 'A',
    room: '301',
    sequenceOffset: 1,
    overrides: { 5: 'seminar' },
  },
])

const sampleWeekState = () => ({
  anchorWeekStart: '2026-11-09',
  anchorMode: 'lower-week',
  overrides: { '2026-11-16': 'lower-week' },
  system: 'double',
})

describe('backup round-trip', () => {
  it('build → JSON → parse eyni məlumatı qaytarır', () => {
    const backup = buildBackup(sampleSubjects(), sampleWeekState())
    assert.equal(backup.app, BACKUP_APP)
    assert.equal(backup.version, BACKUP_VERSION)
    const restored = parseBackup(JSON.parse(JSON.stringify(backup)))
    assert.deepEqual(restored.subjects, backup.subjects)
    assert.deepEqual(restored.weekState, backup.weekState)
  })

  it('fayl adı tarixlidir', () => {
    assert.equal(backupFileName(new Date(2026, 10, 17)), 'academic-schedule-2026-11-17.json')
  })

  it('yanlış backup rədd edilir', () => {
    assert.throws(() => parseBackup(null), /yanlış format/)
    assert.throws(() => parseBackup({ ...buildBackup([], sampleWeekState()), app: 'başqa' }), /başqa tətbiq/)
    assert.throws(() => parseBackup({ ...buildBackup([], sampleWeekState()), version: 99 }), /dəstəklənmir/)
    assert.throws(() => parseBackup({ app: BACKUP_APP, version: BACKUP_VERSION }), /siyahı/)
    assert.throws(
      () => parseBackup({ app: BACKUP_APP, version: BACKUP_VERSION, subjects: [{}] }),
      /Fənn adı/,
    )
  })
})
