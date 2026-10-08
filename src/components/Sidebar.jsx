export function Sidebar({ activeView, onViewChange, onOpenSettings }) {
  return (
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">~</span><span>in your <b>limits</b></span></div>
      <nav aria-label="Primary navigation">
        <button className={`nav-item ${activeView === 'overview' ? 'active' : ''}`} type="button" onClick={() => onViewChange('overview')}><span className="nav-icon">◌</span><span>Chat</span></button>
        <button className={`nav-item ${activeView === 'analytics' ? 'active' : ''}`} type="button" onClick={() => onViewChange('analytics')}><span className="nav-icon">◷</span><span>Analytics</span></button>
        <button className="nav-item" type="button" onClick={onOpenSettings}><span className="nav-icon">⚙</span><span>Connections</span></button>
      </nav>
      <div className="sidebar-footer">
        <div className="tiny-label">LOCAL FIRST</div>
        <p>Prompts and responses are compressed locally around each provider call.</p>
      </div>
    </aside>
  )
}
