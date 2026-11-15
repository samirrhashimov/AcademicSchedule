import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  addWeeks,
  baseModeForWeek,
  defaultWeekState,
  mondayOfWeek,
  normalizeWeekState,
  parseDayKey,
  reanchorWeekState,
  resolveWeekType,
  toDayKey,
  withWeekOverride,
} from './weeks.js'

const monday = (y, m, d) => {
  const date = new Date(y, m - 1, d)
  date.setHours(0, 0, 0, 0)
  return date
}

describe('gün açarı', () => {
  it('toDayKey/parseDayKey cütlüyü işləyir', () => {
    const date = monday(2026, 11, 9)
    assert.equal(toDayKey(date), '2026-11-09')
    assert.equal(parseDayKey('2026-11-09').getTime(), date.getTime())
    assert.equal(parseDayKey('pis-açar'), null)
  })

  it('mondayOfWeek bazar günündən də bazar ertəsini tapır', () => {
    assert.equal(toDayKey(mondayOfWeek(new Date(2026, 10, 15))), '2026-11-09')
  })
})

describe('baza növbələşmə (anchor: 2026-11-09 Alt)', () => {
  const anchor = monday(2026, 11, 9)

  it('irəli və geri düzgün növbələşir', () => {
    assert.equal(baseModeForWeek(anchor, 'lower-week', anchor), 'lower-week')
    assert.equal(baseModeForWeek(anchor, 'lower-week', addWeeks(anchor, 1)), 'upper-week')
    assert.equal(baseModeForWeek(anchor, 'lower-week', addWeeks(anchor, 2)), 'lower-week')
    assert.equal(baseModeForWeek(anchor, 'lower-week', addWeeks(anchor, -1)), 'upper-week')
  })

  it('istisna bazanı üstələyir, silinəndə baza qayıdır', () => {
    const next = addWeeks(anchor, 1)
    const state = withWeekOverride(defaultWeekState(anchor, 'lower-week'), next, 'lower-week')
    assert.deepEqual(resolveWeekType(state, next), { mode: 'lower-week', isOverride: true })
    assert.deepEqual(resolveWeekType(state, anchor), { mode: 'lower-week', isOverride: false })
    const cleared = withWeekOverride(state, next, null)
    assert.deepEqual(resolveWeekType(cleared, next), { mode: 'upper-week', isOverride: false })
  })

  it('həmişəlik: anchor köçür, sıra yeni həftədən davam edir', () => {
    const next = addWeeks(anchor, 1)
    const state = reanchorWeekState(defaultWeekState(anchor, 'lower-week'), next, 'lower-week')
    assert.deepEqual(resolveWeekType(state, next), { mode: 'lower-week', isOverride: false })
    assert.equal(resolveWeekType(state, addWeeks(anchor, 2)).mode, 'upper-week')
    assert.equal(resolveWeekType(state, addWeeks(anchor, 3)).mode, 'lower-week')
  })
})

describe('normalizeWeekState', () => {
  const fallback = monday(2026, 11, 9)

  it('yeni formatı təmizləyib saxlayır', () => {
    const state = normalizeWeekState({
      anchorWeekStart: '2026-11-09',
      anchorMode: 'lower-week',
      overrides: { '2026-11-16': 'lower-week', pis: 'upper-week', '2026-11-23': 'pis' },
    }, fallback, 'upper-week')
    assert.deepEqual(state, {
      anchorWeekStart: '2026-11-09',
      anchorMode: 'lower-week',
      overrides: { '2026-11-16': 'lower-week' },
    })
  })

  it('köhnə {weekStart, mode} formatından miqrasiya edir', () => {
    const state = normalizeWeekState({ weekStart: new Date(2026, 10, 9).toISOString(), mode: 'upper-week' }, fallback, 'lower-week')
    assert.equal(state.anchorWeekStart, '2026-11-09')
    assert.equal(state.anchorMode, 'upper-week')
    assert.deepEqual(state.overrides, {})
  })

  it('yararsız məlumatda baza dəyər qaytarır', () => {
    assert.deepEqual(normalizeWeekState(null, fallback, 'lower-week'), defaultWeekState(fallback, 'lower-week'))
    assert.deepEqual(normalizeWeekState('səhv', fallback, 'lower-week'), defaultWeekState(fallback, 'lower-week'))
  })
})
