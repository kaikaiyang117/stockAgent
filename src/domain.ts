import { EXCHANGE_TIMEZONE } from './data'
import type { Event, MarketData, TradingDay } from './types'

const exchangeDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: EXCHANGE_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const exchangeTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: EXCHANGE_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function formatExchangeDateTime(value: string): { date: string; time: string } | null {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return { date: exchangeDateFormatter.format(parsed), time: exchangeTimeFormatter.format(parsed) }
}

export function nextTradingDate(date: string, calendar: TradingDay[]): string | undefined {
  return calendar.find((day) => day.isTradingDay && day.date > date)?.date
}

export function mapEventToTradingDate(event: Event, calendar: TradingDay[]): Event {
  const local = formatExchangeDateTime(event.publishedAt)
  if (!local) return { ...event, mappingStatus: 'invalid', mappedTradingDate: undefined, mappingReason: '发布时间无法解析' }

  const sameDay = calendar.find((day) => day.date === local.date)
  if (!sameDay) {
    return {
      ...event,
      mappingStatus: 'out-of-range',
      mappedTradingDate: nextTradingDate(local.date, calendar),
      mappingReason: '事件日期不在当前交易日历范围内',
    }
  }

  if (!sameDay.isTradingDay) {
    const mappedTradingDate = nextTradingDate(local.date, calendar)
    return {
      ...event,
      mappedTradingDate,
      mappingStatus: mappedTradingDate ? 'mapped' : 'out-of-range',
      mappingReason: mappedTradingDate ? '非交易日事件 → 下一交易日' : '非交易日之后没有可用交易日',
    }
  }

  const mappedTradingDate = local.time > '15:00' ? nextTradingDate(local.date, calendar) : local.date
  return {
    ...event,
    mappedTradingDate,
    mappingStatus: mappedTradingDate ? 'mapped' : 'out-of-range',
    mappingReason: local.time > '15:00' ? '收盘后事件 → 下一交易日' : '开盘前/交易时段事件 → 当日',
  }
}

export function mappedEvents(rawEvents: Event[], calendar: TradingDay[]): Event[] {
  return rawEvents.map((event) => mapEventToTradingDate(event, calendar))
}

export function detectAnomalies(data: MarketData[], threshold = 8): MarketData[] {
  return data.map((item) => ({ ...item, isAnomaly: item.isAnomaly || Math.abs(item.changePercent) >= threshold }))
}

export function eventsForDate(allEvents: Event[], date: string): Event[] {
  return allEvents.filter((event) => event.mappingStatus === 'mapped' && event.mappedTradingDate === date)
}

export function formatPublishedAt(value: string): string {
  const local = formatExchangeDateTime(value)
  return local ? `${local.date} ${local.time}（交易所时间）` : '时间无效'
}
