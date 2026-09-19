import { eventsForDate } from './domain'
import type { Event, ExplanationFactor } from './types'

export function explainAnomaly(date: string, allEvents: Event[]): ExplanationFactor[] {
  const related = eventsForDate(allEvents, date)
  const byId = (id: string) => related.some((event) => event.id === id)
  const factors: ExplanationFactor[] = []

  if (byId('evt-announcement-001')) {
    factors.push({
      id: 'factor-contract',
      title: '合作框架公告改善预期',
      summary: '盘后公告与次日上涨在时间上相邻，可能成为市场重新评估公司业务空间的触发信息。',
      relatedEventIds: ['evt-announcement-001'],
      classification: 'causal-hypothesis',
      confidence: 0.74,
      evidence: '公告是可核验的一手事实；但合作框架尚未披露订单金额，无法单独证明收入影响。',
      uncertainty: '仍需等待订单、交付或财务数据验证，当前仅是较高可信度的解释假设。',
    })
  }

  if (byId('evt-news-001') || byId('evt-industry-001')) {
    factors.push({
      id: 'factor-industry',
      title: '行业规范与产业消息形成共振',
      summary: '盘前产业消息和盘中行业规范共同指向边缘算力需求，可能放大了当日主题关注度。',
      relatedEventIds: ['evt-news-001', 'evt-industry-001'].filter((id) => byId(id)),
      classification: 'temporal-correlation',
      confidence: 0.61,
      evidence: '两条独立来源在同一交易日出现，且内容与公司公告主题一致。',
      uncertainty: '主题一致不等于公司实际获益，尚无公司订单或业绩数据确认。',
    })
  }

  if (byId('evt-insufficient-001')) {
    factors.push({
      id: 'factor-flow-rumor',
      title: '成交量放大与资金传闻',
      summary: '公开讨论把放量与“提前获知利好”联系起来，但现有材料不足以支持该解释。',
      relatedEventIds: ['evt-insufficient-001'],
      classification: 'causal-hypothesis',
      confidence: 0.18,
      evidence: '仅有匿名讨论和成交量同时变化，缺少资金流向、信息传播链或监管披露证据。',
      uncertainty: '证据不足，不能据此判断存在信息提前泄露或内幕交易。',
    })
  }

  if (factors.length === 0 && related.length > 0) {
    factors.push({
      id: 'factor-observation',
      title: '已关联事件，但尚无预设解释',
      summary: '当前日期存在事件记录，系统暂不基于弱证据生成因果结论。',
      relatedEventIds: related.slice(0, 1).map((event) => event.id),
      classification: 'fact',
      evidence: '请先查看事件详情中的原始摘要与证据强度。',
    })
  }

  return factors.slice(0, 3)
}
