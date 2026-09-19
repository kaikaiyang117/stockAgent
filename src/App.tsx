import { useEffect, useMemo, useRef, useState } from 'react'
import { explainAnomaly } from './agent'
import { events, marketData, tradingDays } from './data'
import { detectAnomalies, eventsForDate, formatPublishedAt, mappedEvents } from './domain'
import { CLASSIFICATION_LABELS, EVENT_TYPE_LABELS, STRENGTH_LABELS } from './types'
import type { Classification, Event, MarketData } from './types'

type DemoState = 'ready' | 'empty' | 'out-of-range' | 'invalid'

const dateFormatter = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
const mapped = mappedEvents(events, tradingDays)
const preparedMarket = detectAnomalies(marketData)

function formatVolume(value: number) {
  return `${(value / 10000).toFixed(0)} 万`
}

function classificationClass(classification: Classification) {
  return `tag tag-${classification}`
}

function App() {
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('2026-09-11')
  const [selectedEventId, setSelectedEventId] = useState('evt-announcement-001')
  const [demoState, setDemoState] = useState<DemoState>('ready')
  const eventRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 420)
    return () => window.clearTimeout(timer)
  }, [])

  const selectedMarket = preparedMarket.find((item) => item.date === selectedDate) ?? preparedMarket[0]
  const relatedEvents = useMemo(() => eventsForDate(mapped, selectedDate), [selectedDate])
  const factors = useMemo(() => explainAnomaly(selectedDate, mapped), [selectedDate])
  const selectedEvent = mapped.find((event) => event.id === selectedEventId) ?? relatedEvents[0] ?? mapped[0]

  const selectEvent = (id: string) => {
    setSelectedEventId(id)
    window.setTimeout(() => eventRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
  }

  const selectFactor = (eventId: string) => selectEvent(eventId)

  if (loading) {
    return (
      <main className="loading-screen">
        <div className="loading-mark">S</div>
        <div>
          <strong>正在载入 SignalTrace</strong>
          <p>校验交易日历 · 映射事件时间 · 准备解释上下文</p>
        </div>
        <span className="loader" />
      </main>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">S<span /></div>
          <div>
            <div className="brand-name">SignalTrace</div>
            <div className="brand-subtitle">市场异动解释工作台</div>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="data-status"><i /> 模拟数据 · 可复现</span>
          <label className="demo-select-label">
            状态演示
            <select value={demoState} onChange={(event) => setDemoState(event.target.value as DemoState)}>
              <option value="ready">正常视图</option>
              <option value="empty">空数据</option>
              <option value="out-of-range">范围外事件</option>
              <option value="invalid">异常数据</option>
            </select>
          </label>
        </div>
      </header>

      <main className="main-content">
        <section className="hero-row">
          <div>
            <p className="eyebrow">MARKET EVENT INTELLIGENCE <span>·</span> 01</p>
            <h1>股价异动解释 <em>时间线</em></h1>
            <p className="hero-copy">把价格变化放回事件发生的上下文里。每一个结论都标记来源与证据边界。</p>
          </div>
          <div className="hero-meta">
            <span>研究标的</span>
            <strong>THS · 同花顺模拟</strong>
            <small>数据范围 2026.09.07 — 2026.09.18</small>
          </div>
        </section>

        <section className="notice-bar">
          <span className="notice-icon">✦</span>
          <div><strong>解释范围：</strong> 当前仅展示时间上相关的可验证信息，不构成投资建议。</div>
          <div className="notice-stats"><span><b>{preparedMarket.length}</b> 个交易日</span><span><b>{mapped.filter((event) => event.mappingStatus === 'mapped').length}</b> 条已映射事件</span><span><b>{preparedMarket.filter((item) => item.isAnomaly).length}</b> 个重点异动日</span></div>
        </section>

        <section className="dashboard-grid">
          <div className="primary-column">
            <section className="panel chart-panel">
              <div className="panel-heading">
                <div><p className="panel-kicker">PRICE ACTION</p><h2>收盘价与异动标记</h2></div>
                <div className="chart-legend"><span className="legend-line" /> 收盘价 <span className="legend-dot" /> 异动日</div>
              </div>
              <div className="chart-summary">
                <div><span>当前选中</span><strong>{selectedMarket.date}</strong><small>{dateFormatter.format(new Date(`${selectedMarket.date}T00:00:00`))}</small></div>
                <div className="summary-close"><span>收盘价</span><strong>{selectedMarket.close.toFixed(2)}</strong><small className={selectedMarket.change >= 0 ? 'positive' : 'negative'}>{selectedMarket.change >= 0 ? '▲' : '▼'} {Math.abs(selectedMarket.changePercent).toFixed(2)}%</small></div>
                <div><span>成交量</span><strong>{formatVolume(selectedMarket.volume)}</strong><small>较近 5 日均值 +142%</small></div>
              </div>
              <PriceChart data={preparedMarket} selectedDate={selectedDate} onSelect={setSelectedDate} />
              <div className="chart-footnote"><span className="anomaly-pill">↗ 异动阈值 ≥ 8%</span><span>点击图中节点切换交易日 · 共 {preparedMarket.length} 个交易日</span></div>
            </section>

            <section className="panel timeline-panel">
              <div className="panel-heading timeline-heading">
                <div><p className="panel-kicker">EVENT TIMELINE</p><h2>{selectedDate} <span>· {dateFormatter.format(new Date(`${selectedDate}T00:00:00`))}</span></h2></div>
                <div className="timeline-filter"><span className="filter-dot" /> 已定位 {relatedEvents.length} 条事件</div>
              </div>
              {demoState === 'empty' ? (
                <EmptyState title="当前时间范围暂无事件" detail="切换到 2026-09-11 查看内置演示数据。" />
              ) : demoState === 'out-of-range' ? (
                <StateCard tone="amber" icon="↗" title="事件超出当前分析范围" detail="2026-12-31 的事件无法映射到当前交易日历；系统保留原始记录，但不会参与当日解释。" />
              ) : demoState === 'invalid' ? (
                <StateCard tone="red" icon="!" title="检测到异常数据" detail="evt-invalid-001 的发布时间无法解析，已从时间线与 Agent 解释中排除。" />
              ) : relatedEvents.length === 0 ? (
                <EmptyState title="该交易日没有相关事件" detail="时间线保持为空，不对价格变化做无依据的解释。" />
              ) : (
                <div className="timeline-list">
                  {relatedEvents.map((event, index) => (
                    <EventRow key={event.id} event={event} index={index} selected={event.id === selectedEvent?.id} onSelect={selectEvent} buttonRef={(node) => { eventRefs.current[event.id] = node }} />
                  ))}
                </div>
              )}
              <div className="timeline-footer"><span>交易所时区 · Asia/Shanghai</span><span>映射规则 <i>开盘前/盘中 → 当日</i> <i>盘后/非交易日 → 下一交易日</i></span></div>
            </section>
          </div>

          <aside className="side-column">
            <section className="panel detail-panel">
              <div className="panel-heading compact-heading"><div><p className="panel-kicker">EVENT DETAIL</p><h2>事件详情</h2></div><span className="detail-count">{selectedEvent ? '01' : '—'}</span></div>
              {selectedEvent ? <EventDetail event={selectedEvent} /> : <EmptyState title="尚未选择事件" detail="点击时间线中的事件查看证据。" />}
            </section>
            <section className="panel methodology-panel">
              <div className="panel-heading compact-heading"><div><p className="panel-kicker">TRACEABILITY</p><h2>解释边界</h2></div><span className="lock-icon">⌁</span></div>
              <div className="boundary-list"><div><span className="boundary-symbol fact-symbol">F</span><p><strong>事实</strong><small>来自公告、报道或文件本身</small></p></div><div><span className="boundary-symbol opinion-symbol">O</span><p><strong>观点</strong><small>研究者对信息的解释</small></p></div><div><span className="boundary-symbol causal-symbol">?</span><p><strong>因果假设</strong><small>必须伴随依据与不确定性</small></p></div></div>
            </section>
          </aside>
        </section>
      </main>

      <AgentAssistant factors={factors} onSelectFactor={selectFactor} selectedDate={selectedDate} />
      <footer className="page-footer"><span>SignalTrace / interview assignment</span><span>本页面所有数据均为内置模拟数据 · v1.0.0</span></footer>
    </div>
  )
}

function PriceChart({ data, selectedDate, onSelect }: { data: MarketData[]; selectedDate: string; onSelect: (date: string) => void }) {
  const width = 760
  const height = 278
  const pad = { left: 44, right: 18, top: 20, bottom: 38 }
  const allPrices = data.flatMap((item) => [item.high, item.low])
  const min = Math.floor(Math.min(...allPrices) - 2)
  const max = Math.ceil(Math.max(...allPrices) + 2)
  const x = (index: number) => pad.left + (index * (width - pad.left - pad.right)) / Math.max(data.length - 1, 1)
  const y = (price: number) => pad.top + ((max - price) * (height - pad.top - pad.bottom)) / Math.max(max - min, 1)
  const polyline = data.map((item, index) => `${x(index)},${y(item.close)}`).join(' ')
  const gridPrices = [min, Math.round((min + max) / 2), max]

  return <div className="chart-wrap"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="收盘价趋势图">
    <defs><linearGradient id="price-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#79ead0" stopOpacity=".25" /><stop offset="1" stopColor="#79ead0" stopOpacity="0" /></linearGradient></defs>
    {gridPrices.map((price) => <g key={price}><line className="grid-line" x1={pad.left} x2={width - pad.right} y1={y(price)} y2={y(price)} /><text className="axis-label" x="6" y={y(price) + 4}>{price}</text></g>)}
    <polygon points={`${polyline} ${x(data.length - 1)},${height - pad.bottom} ${x(0)},${height - pad.bottom}`} fill="url(#price-fill)" />
    <polyline points={polyline} fill="none" stroke="#70e2ca" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    {data.map((item, index) => <g key={item.date} className={`chart-point ${item.isAnomaly ? 'is-anomaly' : ''} ${item.date === selectedDate ? 'is-selected' : ''}`} role="button" tabIndex={0} aria-label={`选择 ${item.date}`} onClick={() => onSelect(item.date)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(item.date) }}>
      {item.isAnomaly && <circle className="anomaly-halo" cx={x(index)} cy={y(item.close)} r="15" />}
      <line className="range-line" x1={x(index)} x2={x(index)} y1={y(item.high)} y2={y(item.low)} />
      <circle cx={x(index)} cy={y(item.close)} r={item.date === selectedDate ? 5 : 3.5} />
      {item.isAnomaly && <text className="anomaly-label" x={x(index) - 27} y={y(item.high) - 12}>+12.87%</text>}
      <text className="date-label" x={x(index)} y={height - 13} textAnchor="middle">{item.date.slice(5)}</text>
    </g>)}
  </svg></div>
}

function EventRow({ event, index, selected, onSelect, buttonRef }: { event: Event; index: number; selected: boolean; onSelect: (id: string) => void; buttonRef: (node: HTMLButtonElement | null) => void }) {
  const local = formatPublishedAt(event.publishedAt).split(' ')[1] ?? '—'
  return <button ref={buttonRef} className={`event-row ${selected ? 'selected' : ''}`} onClick={() => onSelect(event.id)}>
    <span className="event-index">0{index + 1}</span><span className="event-time">{local}<small>{event.mappingReason?.includes('收盘后') ? '盘后 → 次日' : '当日映射'}</small></span><span className={`event-type type-${event.type}`}>{EVENT_TYPE_LABELS[event.type]}</span><span className="event-content"><strong>{event.title}</strong><small>{event.source} · {event.summary}</small></span><span className="event-arrow">↗</span>
  </button>
}

function EventDetail({ event }: { event: Event }) {
  return <div className="event-detail"><div className="detail-topline"><span className={`event-type type-${event.type}`}>{EVENT_TYPE_LABELS[event.type]}</span><span className={classificationClass(event.classification)}>{CLASSIFICATION_LABELS[event.classification]}</span></div><h3>{event.title}</h3><div className="detail-meta"><span>发布时间</span><strong>{formatPublishedAt(event.publishedAt)}</strong><span>来源</span><strong>{event.source}</strong></div><p className="detail-summary">{event.summary}</p><div className="evidence-heading"><span>证据链</span><small>{event.evidence.length ? `${event.evidence.length} 条记录` : '无证据记录'}</small></div>{event.evidence.length ? <div className="evidence-list">{event.evidence.map((evidence) => <div className="evidence-card" key={evidence.text}><div className="evidence-card-top"><span className={`strength strength-${evidence.strength}`}>{STRENGTH_LABELS[evidence.strength]}</span><span>{evidence.source}</span></div><p>{evidence.text}</p></div>)}</div> : <StateCard tone="red" icon="!" title="证据不足" detail="这条记录不包含可核验的证据，不能支撑因果结论。" />}<div className="mapping-note"><span>↳</span><p><strong>交易日映射</strong><small>{event.mappingReason ?? '尚未完成映射'} · {event.mappedTradingDate ?? '不可用'}</small></p></div></div>
}

function AgentAssistant({ factors, onSelectFactor, selectedDate }: { factors: ReturnType<typeof explainAnomaly>; onSelectFactor: (eventId: string) => void; selectedDate: string }) {
  return <section className="agent-float"><div className="agent-head"><div className="agent-avatar"><span /> <span /> <span /></div><div><strong>Trace Agent</strong><small>解释上下文已同步 · {selectedDate}</small></div><span className="agent-live">LIVE</span></div><div className="agent-intro"><span>✦</span><p>基于当前异动日，我找到 <strong>{factors.length}</strong> 个可能影响因素。它们是解释线索，不是确定性归因。</p></div><div className="factor-list">{factors.length ? factors.map((factor) => <button className="factor-card" key={factor.id} onClick={() => factor.relatedEventIds[0] && onSelectFactor(factor.relatedEventIds[0])}><div className="factor-top"><span className={classificationClass(factor.classification)}>{CLASSIFICATION_LABELS[factor.classification]}</span>{factor.confidence !== undefined && <span className="confidence">置信度 {Math.round(factor.confidence * 100)}%</span>}</div><strong>{factor.title}</strong><p>{factor.summary}</p><small className="factor-link">查看关联事件 <span>↗</span></small>{factor.uncertainty && <div className="uncertainty"><span>!</span>{factor.uncertainty}</div>}</button>) : <div className="agent-empty">当前日期没有足够事件，Agent 不生成解释。</div>}</div><div className="agent-footer">模拟 Agent · 规则与预设解释 · <span>不构成投资建议</span></div></section>
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><div className="empty-orbit">∅</div><strong>{title}</strong><p>{detail}</p></div>
}

function StateCard({ tone, icon, title, detail }: { tone: 'amber' | 'red'; icon: string; title: string; detail: string }) {
  return <div className={`state-card state-${tone}`}><span className="state-icon">{icon}</span><div><strong>{title}</strong><p>{detail}</p></div></div>
}

export default App
