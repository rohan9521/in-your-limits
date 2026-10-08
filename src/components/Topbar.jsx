export function Topbar({ activeView, onOpenSettings }) {
  return (
    <header className="topbar chat-topbar">
      <div><div className="chat-title">{activeView === 'overview' ? 'In Your Limits' : 'Analytics'}</div><span className="chat-subtitle">{activeView === 'overview' ? 'A private, context-aware AI chat' : 'Your request history and token savings'}</span></div>
      <button className="settings-button" type="button" onClick={onOpenSettings}>Settings</button>
    </header>
  )
}
