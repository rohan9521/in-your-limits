export function Sidebar({ activeView, onViewChange, onOpenSettings }) {
  return (
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">~</span><span>in your <b>limits</b></span></div>
      <nav aria-label="Primary navigation">
        <button className={`nav-item ${activeView === 'overview' ? 'active' : ''}`} type="button" onClick={() => onViewChange('overview')}>⌂ <span>Overview</span></button>
        <button className={`nav-item ${activeView === 'analytics' ? 'active' : ''}`} type="button" onClick={() => onViewChange('analytics')}>◌ <span>Analytics</span></button>
        <button className="nav-item" type="button" onClick={onOpenSettings}>⚙ <span>Connections</span></button>
      </nav>
      <div className="sidebar-footer">
        <div className="tiny-label">LOCAL FIRST</div>
        <p>Requests are compressed locally before and after any available provider call.</p>
      </div>
    </aside>
  )
}
