export function Topbar({ onOpenSettings }) {
  return (
    <header className="topbar">
      <div><div className="eyebrow">WORKSPACE / OVERVIEW</div><h1>Make every token count.</h1></div>
      <button className="settings-button" type="button" onClick={onOpenSettings}>⚙ Settings</button>
    </header>
  )
}
