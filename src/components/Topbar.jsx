export function Topbar({ activeView, onOpenSettings }) {
  return (
    <header className="topbar">
      <div><div className="eyebrow">WORKSPACE / {activeView.toUpperCase()}</div><h1>Make every token count.</h1></div>
      <button className="settings-button" type="button" onClick={onOpenSettings}>⚙ Settings</button>
    </header>
  )
}
