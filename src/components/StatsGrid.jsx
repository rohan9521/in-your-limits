export function StatsGrid({ connectedCount, providerCount, localStatus, localModel }) {
  return (
    <section className="stats-grid">
      <div className="stat-card"><span>PROVIDERS READY</span><strong>{connectedCount} <small>/ {providerCount}</small></strong><div className="progress"><i style={{ width: `${connectedCount / providerCount * 100}%` }} /></div></div>
      <div className="stat-card"><span>ROUTING</span><strong>AUTO</strong><p>Uses any configured provider</p></div>
      <div className="stat-card"><span>LOCAL MODEL</span><strong className="model-name">{localStatus === 'connected' ? 'Online' : 'Offline'}</strong><p>{localModel}</p></div>
    </section>
  )
}
