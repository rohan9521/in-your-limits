import { useEffect, useRef, useState } from 'react'
import { PROVIDERS } from '../config/providers'

export function SettingsModal({ settings, onChangeSetting, onChangeKey, onSave, onClose }) {
  const firstInputRef = useRef(null)
  const [visibleKeys, setVisibleKeys] = useState({})
  const keySetupLinks = {
    google: 'https://aistudio.google.com/apikey',
    openai: 'https://platform.openai.com/api-keys',
    anthropic: 'https://console.anthropic.com/settings/keys',
  }

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
        <div className="modal-heading"><div><div className="eyebrow">SETTINGS</div><h2 id="settings-title">Connect a model</h2></div><button type="button" className="close-button" aria-label="Close settings" onClick={onClose}>×</button></div>
        <p className="modal-intro">Add one or more provider API keys. Keys are saved in this browser. Your selected provider is tried first, with automatic failover to the others you connect.</p>
        <section className="settings-section" aria-labelledby="provider-keys-title">
          <div className="settings-section-heading"><h3 id="provider-keys-title">AI providers</h3><span>Connect at least one</span></div>
          <div className="key-list">{PROVIDERS.map(({ id, name, hint }) => {
            const isConnected = Boolean(settings.keys[id]?.trim())
            return <div className="key-field" key={id}>
              <div className="key-field-heading">
                <label className="field-label" htmlFor={`api-key-${id}`}>{name}</label>
                <span className={`key-status ${isConnected ? 'connected' : ''}`}>{isConnected ? 'Added' : 'Optional'}</span>
              </div>
              <div className="api-key-control">
                <input ref={id === PROVIDERS[0].id ? firstInputRef : undefined} id={`api-key-${id}`} type={visibleKeys[id] ? 'text' : 'password'} autoComplete="off" spellCheck="false" value={settings.keys[id] || ''} onChange={(event) => onChangeKey(id, event.target.value)} placeholder={hint} />
                <button type="button" className="key-visibility" aria-label={`${visibleKeys[id] ? 'Hide' : 'Show'} ${name} API key`} onClick={() => setVisibleKeys((current) => ({ ...current, [id]: !current[id] }))}>{visibleKeys[id] ? 'Hide' : 'Show'}</button>
              </div>
              <a className="provider-key-link" href={keySetupLinks[id]} target="_blank" rel="noreferrer">Get an API key ↗</a>
            </div>
          })}</div>
        </section>
        <details className="local-model-settings">
          <summary>Local compression model</summary>
          <p>Your local Ollama model compresses prompts and responses before they are shown.</p>
          <label className="field-label" htmlFor="local-url">Ollama URL</label>
          <input id="local-url" value={settings.localUrl} onChange={(event) => onChangeSetting('localUrl', event.target.value)} placeholder="http://localhost:11434" />
          <label className="field-label" htmlFor="local-model">Model name</label>
          <input id="local-model" value={settings.localModel} onChange={(event) => onChangeSetting('localModel', event.target.value)} placeholder="llama3:8b" />
        </details>
        <div className="modal-actions"><button type="button" className="outline-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button">Save connections</button></div>
      </form>
    </div>
  )
}
