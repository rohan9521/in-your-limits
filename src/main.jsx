import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', hint: 'sk-...', model: 'gpt-4o-mini' },
  { id: 'anthropic', name: 'Anthropic', hint: 'sk-ant-...', model: 'claude-3-5-haiku-latest' },
  { id: 'google', name: 'Google AI', hint: 'AIza...', model: 'gemini-2.0-flash' },
]
const initialKeys = Object.fromEntries(PROVIDERS.map(({ id }) => [id, '']))

function App() {
  const [keys, setKeys] = useState(() => JSON.parse(localStorage.getItem('iYL.apiKeys') || 'null') || initialKeys)
  const [localUrl, setLocalUrl] = useState(() => localStorage.getItem('iYL.localUrl') || 'http://localhost:11434')
  const [localModel, setLocalModel] = useState(() => localStorage.getItem('iYL.localModel') || 'llama3.2:3b')
  const [localStatus, setLocalStatus] = useState('unknown')
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const connectedProviders = useMemo(() => PROVIDERS.filter(({ id }) => keys[id].trim()), [keys])

  async function checkLocalModel() {
    setLocalStatus('checking')
    try { const r = await fetch(`${localUrl.replace(/\/$/, '')}/api/tags`); if (!r.ok) throw new Error(); setLocalStatus('connected') } catch { setLocalStatus('offline') }
  }
  useEffect(() => { checkLocalModel() }, [localUrl])

  function saveSettings(event) {
    event.preventDefault(); localStorage.setItem('iYL.apiKeys', JSON.stringify(keys)); localStorage.setItem('iYL.localUrl', localUrl); localStorage.setItem('iYL.localModel', localModel); setSettingsOpen(false); setNotice('Connections saved locally. Keys are sent only for the request you start.')
  }

  async function sendRequest(event) {
    event.preventDefault(); setNotice(''); setResponse('')
    const apiKey = keys[selectedProvider]?.trim()
    if (!prompt.trim()) return setNotice('Add a prompt before sending it.')
    if (!apiKey) return setNotice(`Add a ${PROVIDERS.find(p => p.id === selectedProvider).name} API key in Settings.`)
    if (localStatus !== 'connected') return setNotice('Connect the local LLM first. Compression requires it for both request and response.')
    setBusy(true)
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: selectedProvider, apiKey, model: PROVIDERS.find(p => p.id === selectedProvider).model, localUrl, localModel, messages: [{ role: 'user', content: prompt }], compress: true, targetRatio: 0.55 }) })
      const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Request failed')
      setResponse(data.response); setNotice('Request compressed locally, sent to the provider, and response compressed locally.')
    } catch (error) { setNotice(error.message) } finally { setBusy(false) }
  }

  const statusLabel = { connected: 'Connected', checking: 'Checking…', offline: 'Not connected', error: 'Unavailable', unknown: 'Not checked' }[localStatus]
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">⌁</span><span>in your <b>limits</b></span></div><nav><button className="nav-item active">⌂ <span>Overview</span></button><button className="nav-item" onClick={() => setSettingsOpen(true)}>⚙ <span>Connections</span></button></nav><div className="sidebar-footer"><div className="tiny-label">LOCAL FIRST</div><p>Requests are compressed by your local model before and after provider calls.</p></div></aside><main className="main-content"><header className="topbar"><div><div className="eyebrow">WORKSPACE / OVERVIEW</div><h1>Make every token count.</h1></div><button className="settings-button" onClick={() => setSettingsOpen(true)}>⚙ Settings</button></header><section className="connection-banner"><div className={`status-dot ${localStatus}`}></div><div className="banner-copy"><strong>Local LLM {statusLabel.toLowerCase()}</strong><span>{localStatus === 'connected' ? `${localModel} is ready to compress requests and responses.` : `Connect Ollama at ${localUrl} to start.`}</span></div><button className="outline-button" onClick={() => { checkLocalModel() }}>Retry</button></section>{notice && <div className="notice" role="status">{notice}</div>}<section className="stats-grid"><div className="stat-card"><span>PROVIDERS READY</span><strong>{connectedProviders.length} <small>/ {PROVIDERS.length}</small></strong><div className="progress"><i style={{ width: `${connectedProviders.length / PROVIDERS.length * 100}%` }} /></div></div><div className="stat-card"><span>COMPRESSION</span><strong>2×</strong><p>Requests + responses optimized locally</p></div><div className="stat-card"><span>LOCAL MODEL</span><strong className="model-name">{localStatus === 'connected' ? 'Online' : 'Offline'}</strong><p>{localModel}</p></div></section><section className="workspace"><div className="section-heading"><div><div className="eyebrow">OPTIMIZER</div><h2>Send a compressed request</h2></div><label className="provider-select">Route to <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)}>{PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label></div><form onSubmit={sendRequest}><label className="field-label" htmlFor="prompt">Your prompt</label><textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ask anything. Your local model will reduce it before sending…" rows="7" /><div className="composer-footer"><span>{prompt.length} characters · local compression enabled</span><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Compressing…' : 'Send request'} <span>→</span></button></div></form>{response && <div className="result"><div className="result-heading"><span className="success-icon">✓</span><strong>Compressed response</strong><span className="muted">Returned from {PROVIDERS.find(p => p.id === selectedProvider).name}</span></div><p>{response}</p></div>}</section><section className="next-steps"><h2>Get started</h2><div className="step-row"><div className="step-number">1</div><div><strong>Connect your local model</strong><p>Run Ollama with the configured model. It handles both compression passes.</p></div><button className="text-button" onClick={() => setSettingsOpen(true)}>Configure →</button></div><div className="step-row"><div className="step-number">2</div><div><strong>Add a provider key</strong><p>Keys stay in this browser and are forwarded only to your local API server.</p></div><button className="text-button" onClick={() => setSettingsOpen(true)}>Add key →</button></div></section></main>{settingsOpen && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setSettingsOpen(false)}><form className="modal" onSubmit={saveSettings}><div className="modal-heading"><div><div className="eyebrow">SETTINGS</div><h2>Connections</h2></div><button type="button" className="close-button" onClick={() => setSettingsOpen(false)}>×</button></div><p className="modal-intro">The local model compresses your request before it reaches the provider and compresses the answer before displaying it.</p><label className="field-label" htmlFor="local-url">Local LLM URL</label><input id="local-url" value={localUrl} onChange={e => setLocalUrl(e.target.value)} placeholder="http://localhost:11434" /><label className="field-label" htmlFor="local-model">Local model name</label><input id="local-model" value={localModel} onChange={e => setLocalModel(e.target.value)} placeholder="llama3.2:3b" /><div className="key-list">{PROVIDERS.map(provider => <div className="key-field" key={provider.id}><label className="field-label" htmlFor={provider.id}>{provider.name} API key</label><input id={provider.id} type="password" autoComplete="off" value={keys[provider.id]} onChange={e => setKeys({ ...keys, [provider.id]: e.target.value })} placeholder={provider.hint} /></div>)}</div><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setSettingsOpen(false)}>Cancel</button><button className="primary-button" type="submit">Save connections</button></div></form></div>}</div>
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
