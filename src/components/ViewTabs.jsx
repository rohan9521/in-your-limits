export function ViewTabs({ activeView, onViewChange }) {
  return <div className="mobile-view-tabs" role="tablist" aria-label="Workspace views">
    <button className={activeView === 'overview' ? 'active' : ''} type="button" role="tab" aria-selected={activeView === 'overview'} onClick={() => onViewChange('overview')}>Overview</button>
    <button className={activeView === 'analytics' ? 'active' : ''} type="button" role="tab" aria-selected={activeView === 'analytics'} onClick={() => onViewChange('analytics')}>Analytics</button>
  </div>
}