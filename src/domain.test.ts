import { describe, expect, it } from 'vitest'
import { events } from './data'
import { explainAnomaly } from './agent'
import { formatExchangeDateTime, mapEventToTradingDate, mappedEvents } from './domain'
import { tradingDays } from './data'

describe('event-to-trading-day mapping', () => {
  it('maps a post-close event to the next trading day', () => {
    const event = events.find((item) => item.id === 'evt-announcement-001')!
    expect(mapEventToTradingDate(event, tradingDays).mappedTradingDate).toBe('2026-09-11')
  })

  it('maps a weekend event to Monday, the next trading day', () => {
    const event = events.find((item) => item.id === 'evt-weekend-001')!
    expect(mapEventToTradingDate(event, tradingDays).mappedTradingDate).toBe('2026-09-14')
  })

  it('converts a non-Asia/Shanghai timestamp before mapping it', () => {
    const event = {
      ...events[0],
      id: 'evt-cross-timezone',
      publishedAt: '2026-09-10T03:30:00-04:00',
      timezone: 'America/New_York',
    }
    expect(formatExchangeDateTime(event.publishedAt)).toEqual({ date: '2026-09-10', time: '15:30' })
    expect(mapEventToTradingDate(event, tradingDays).mappedTradingDate).toBe('2026-09-11')
  })

  it('keeps an event at exactly 15:00 on the same trading day', () => {
    const event = { ...events[0], id: 'evt-close-boundary', publishedAt: '2026-09-10T15:00:00+08:00' }
    const mapped = mapEventToTradingDate(event, tradingDays)
    expect(mapped.mappedTradingDate).toBe('2026-09-10')
    expect(mapped.mappingReason).toContain('开盘前/交易时段')
  })

  it('maps an event at 15:01 to the next trading day', () => {
    const event = { ...events[0], id: 'evt-after-close-boundary', publishedAt: '2026-09-10T15:01:00+08:00' }
    const mapped = mapEventToTradingDate(event, tradingDays)
    expect(mapped.mappedTradingDate).toBe('2026-09-11')
    expect(mapped.mappingReason).toContain('收盘后')
  })

  it('marks a causal hypothesis with insufficient evidence and low confidence', () => {
    const factor = explainAnomaly('2026-09-11', mappedEvents(events, tradingDays)).find((item) => item.id === 'factor-flow-rumor')
    expect(factor?.classification).toBe('causal-hypothesis')
    expect(factor?.confidence).toBeLessThan(0.3)
    expect(factor?.uncertainty).toContain('证据不足')
  })
})
