import { describe, expect, it } from 'vitest'
import { events } from './data'
import { explainAnomaly } from './agent'
import { mapEventToTradingDate, mappedEvents } from './domain'
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

  it('marks a causal hypothesis with insufficient evidence and low confidence', () => {
    const factor = explainAnomaly('2026-09-11', mappedEvents(events, tradingDays)).find((item) => item.id === 'factor-flow-rumor')
    expect(factor?.classification).toBe('causal-hypothesis')
    expect(factor?.confidence).toBeLessThan(0.3)
    expect(factor?.uncertainty).toContain('证据不足')
  })
})
