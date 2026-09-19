export type EventType = 'announcement' | 'news' | 'industry' | 'financial'

export type Classification = 'fact' | 'opinion' | 'temporal-correlation' | 'causal-hypothesis'

export type EvidenceStrength = 'strong' | 'medium' | 'weak' | 'insufficient'

export interface TradingDay {
  date: string
  isTradingDay: boolean
}

export interface MarketData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  change: number
  changePercent: number
  isAnomaly: boolean
  anomalyLabel?: string
}

export interface Evidence {
  text: string
  source: string
  strength: EvidenceStrength
}

export interface Event {
  id: string
  title: string
  publishedAt: string
  timezone: string
  type: EventType
  source: string
  summary: string
  evidence: Evidence[]
  classification: Classification
  mappedTradingDate?: string
  mappingReason?: string
  mappingStatus: 'mapped' | 'out-of-range' | 'invalid'
}

export interface ExplanationFactor {
  id: string
  title: string
  summary: string
  relatedEventIds: string[]
  classification: Classification
  confidence?: number
  evidence: string
  uncertainty?: string
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  announcement: '公司公告',
  news: '媒体新闻',
  industry: '行业事件',
  financial: '财务数据',
}

export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  fact: '事实',
  opinion: '观点',
  'temporal-correlation': '时间相关性',
  'causal-hypothesis': '因果假设',
}

export const STRENGTH_LABELS: Record<EvidenceStrength, string> = {
  strong: '强证据',
  medium: '中证据',
  weak: '弱证据',
  insufficient: '证据不足',
}
