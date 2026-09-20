import { FormattedResponse } from './FormattedResponse'

function formatTokens(value) { return value.toLocaleString() }

export function AnalyticsPanel({ records, onClear }) {
  return <section className="analytics-panel">
    <div className="section-heading analytics-heading"><div><div className="eyebrow">OBSERVABILITY</div><h2>Request analytics</h2><p className="section-description">A local history of what was compressed before and after each provider call.</p></div>{records.length > 0 && <button className="text-button" type="button" onClick={onClear}>Clear history</button>}</div>
    {records.length === 0 ? <div className="analytics-empty"><strong>No requests yet</strong><p>Completed requests will appear here with estimated token suppression.</p></div> : <div className="analytics-list">{[...records].reverse().map((record) => <article className="analytics-card" key={record.id}><div className="analytics-card-header"><div><span className="analytics-provider">{record.providerName}</span><time>{new Date(record.timestamp).toLocaleString()}</time></div><span className="suppression-total">{formatTokens(record.tokenStats.request.suppressedTokens + record.tokenStats.response.suppressedTokens)} est. tokens saved</span></div><div className="analytics-grid"><div><span className="metric-label">REQUEST</span><p>{record.request.original}</p><small>{formatTokens(record.tokenStats.request.suppressedTokens)} estimated tokens suppressed</small></div><div><span className="metric-label">RESPONSE</span><FormattedResponse content={record.response.compressed} /><small>{formatTokens(record.tokenStats.response.suppressedTokens)} estimated tokens suppressed</small></div></div></article>)}</div>}
  </section>
}