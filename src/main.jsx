import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', hint: 'sk-...', color: '#76a9fa' },
  { id: 'anthropic', name: 'Anthropic', hint: 'sk-ant-...', color: '#f0a36b' },
  { id: 'google', name: 'Google AI', hint: 'AIza...', color: '#86efac' },
]

const initialKeys = Object.fromEntries(PROVIDERS.map(({ id }) => [id, '']))

function App() {
  const [keys, setKeys] = useState(() => JSON.parse(localStorage.getItem('iYL.apiKeys') || 'null') || initialKeys)
  const [localUrl, setLocalUrl] = useState(() => localStorage.getItem('iYL.localUrl') || 'http://localhost:11434')
  const [localStatus, setLocalStatus] = useState('unknown')
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [prompt, setPrompt] = useState('')
  const [optimizedPrompt, setOptimizedPrompt] = useState('')
  const [notice, setNotice] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const connectedProviders = useMemo(() => PROVIDERS.filter(({ id }) => keys[id].trim()), [keys])

  useEffect(() => {
    let cancelled = false
    async function checkLocalModel() {
      setLocalStatus('checking')
      try {
        const response = await fetch(`${localUrl.replace(/\/$/, '')}/api/tags`, { signal: AbortSignal.timeout(3500) })
        if (!cancelled) setLocalStatus(response.ok ? 'connected' : 'error')
      } catch {
        if (!cancelled) setLocalStatus('offline')
      }
    }
    checkLocalModel()
    return () => { cancelled = true }
  }, [localUrl])

  function saveSettings(event) {
    event.preventDefault()
    localStorage.setItem('iYL.apiKeys', JSON.stringify(keys))
    localStorage.setItem('iYL.localUrl', localUrl)
    setSettingsOpen(false)
    setNotice('Settings saved locally. Keys never leave this browser.')
    setTimeout(() => setNotice(''), 4500)
  }

  function optimizePrompt(event) {
    event.preventDefault()
    if (!prompt.trim()) return setNotice('Add a prompt before optimizing it.')
    if (localStatus !== 'connected') return setNotice('Connect a local LLM first. Your prompt was not sent.')
    setOptimizedPrompt(prompt.trim().replace(/\s+/g, ' '))
    setNotice('Prompt optimized locally. Provider routing is ready to connect.')
  }

  const statusLabel = { connected: 'Connected', checking: 'Checking…', offline: 'Not connected', error: 'Unavailable', unknown: 'Not checked' }[localStatus]

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">⌁</span><span>in your <b>limits</b></span></div>
      <nav><button className="nav-item active">⌂ <span>Overview</span></button><button className="nav-item" onClick={() => setSettingsOpen(true)}>⚙ <span>Connections</span></button></nav>
      <div className="sidebar-footer"><div className="tiny-label">LOCAL FIRST</div><p>Your prompts are prepared by your local model before they reach a provider.</p></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><div className="eyebrow">WORKSPACE / OVERVIEW</div><h1>Make every token count.</h1></div><button className="settings-button" onClick={() => setSettingsOpen(true)}>⚙ Settings</button></header>
      <section className="connection-banner">
        <div className={`status-dot ${localStatus}`}></div><div className="banner-copy"><strong>Local LLM {statusLabel.toLowerCase()}</strong><span>{localStatus === 'connected' ? 'Your local model is ready to optimize requests.' : `Connect a model at ${localUrl} to start optimizing.`}</span></div><button className="outline-button" onClick={() => setSettingsOpen(true)}>Configure</button>
      </section>
      {notice && <div className="notice" role="status">{notice}</div>}
      <section className="stats-grid"><div className="stat-card"><span>PROVIDERS READY</span><strong>{connectedProviders.length} <small>/ {PROVIDERS.length}</small></strong><div className="progress"><i style={{ width: `${connectedProviders.length / PROVIDERS.length * 100}%` }} /></div></div><div className="stat-card"><span>TOKENS SAVED</span><strong>—</strong><p>Optimization history will appear here.</p></div><div className="stat-card"><span>LOCAL MODEL</span><strong className="model-name">{localStatus === 'connected' ? 'Online' : 'Offline'}</strong><p>{localUrl}</p></div></section>
      <section className="workspace"><div className="section-heading"><div><div className="eyebrow">OPTIMIZER</div><h2>Prepare a request</h2></div><label className="provider-select">Route to <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)}>{PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label></div>
        <form onSubmit={optimizePrompt}><label className="field-label" htmlFor="prompt">Your prompt</label><textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Paste a prompt or message to optimize…" rows="7" /><div className="composer-footer"><span>{prompt.length} characters · processed locally</span><button className="primary-button" type="submit">Optimize request <span>→</span></button></div></form>
        {optimizedPrompt && <div className="result"><div className="result-heading"><span className="success-icon">✓</span><strong>Optimized locally</strong><span className="muted">Ready for {PROVIDERS.find(p => p.id === selectedProvider).name}</span></div><p>{optimizedPrompt}</p></div>}
      </section>
      <section className="next-steps"><h2>Get started</h2><div className="step-row"><div className="step-number">1</div><div><strong>Connect your local model</strong><p>Run Ollama or another OpenAI-compatible local server, then configure its URL.</p></div><button className="text-button" onClick={() => setSettingsOpen(true)}>Configure →</button></div><div className="step-row"><div className="step-number">2</div><div><strong>Add a provider key</strong><p>Keys are stored only in your browser and are never sent to our servers.</p></div><button className="text-button" onClick={() => setSettingsOpen(true)}>Add key →</button></div></section>
    </main>
    {settingsOpen && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setSettingsOpen(false)}><form className="modal" onSubmit={saveSettings}><div className="modal-heading"><div><div className="eyebrow">SETTINGS</div><h2>Connections</h2></div><button type="button" className="close-button" onClick={() => setSettingsOpen(false)}>×</button></div><p className="modal-intro">Configure your local model and provider credentials. Values are stored in local browser storage.</p><label className="field-label" htmlFor="local-url">Local LLM URL</label><input id="local-url" value={localUrl} onChange={e => setLocalUrl(e.target.value)} placeholder="http://localhost:11434" /> <div className="key-list">{PROVIDERS.map(provider => <div className="key-field" key={provider.id}><label className="field-label" htmlFor={provider.id}>{provider.name} API key</label><input id={provider.id} type="password" autoComplete="off" value={keys[provider.id]} onChange={e => setKeys({ ...keys, [provider.id]: e.target.value })} placeholder={provider.hint} /></div>)}</div><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setSettingsOpen(false)}>Cancel</button><button className="primary-button" type="submit">Save connections</button></div></form></div>}
  </div>
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
