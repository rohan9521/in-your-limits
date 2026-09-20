import { useEffect, useRef } from 'react'
import { PROVIDERS } from '../config/providers'

export function SettingsModal({ settings, onChangeSetting, onChangeKey, onSave, onClose }) {
  const firstInputRef = useRef(null)

  useEffect(() => {
    firstInputRef.current?.focus()
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onSubmit={(event) => { event.preventDefault(); onSave() }}>
        <div className="modal-heading"><div><div className="eyebrow">SETTINGS</div><h2 id="settings-title">Connections</h2></div><button type="button" className="close-button" aria-label="Close settings" onClick={onClose}>×</button></div>
        <p className="modal-intro">Automatic routing uses any saved key. Gemini is tried first because it commonly has a free tier; failed providers are skipped.</p>
        <label className="field-label" htmlFor="local-url">Local LLM URL</label>
        <input ref={firstInputRef} id="local-url" value={settings.localUrl} onChange={(event) => onChangeSetting('localUrl', event.target.value)} placeholder="http://localhost:11434" />
        <label className="field-label" htmlFor="local-model">Local model name</label>
        <input id="local-model" value={settings.localModel} onChange={(event) => onChangeSetting('localModel', event.target.value)} placeholder="llama3.2:3b" />
        <div className="key-list">{PROVIDERS.map(({ id, name, hint }) => <div className="key-field" key={id}><label className="field-label" htmlFor={id}>{name} API key</label><input id={id} type="password" autoComplete="off" value={settings.keys[id] || ''} onChange={(event) => onChangeKey(id, event.target.value)} placeholder={hint} /></div>)}</div>
        <div className="modal-actions"><button type="button" className="outline-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button">Save connections</button></div>
      </form>
    </div>
  )
}
