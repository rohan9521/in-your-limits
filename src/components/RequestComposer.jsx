import { PROVIDERS } from '../config/providers'

export function RequestComposer({ prompt, provider, busy, response, onPromptChange, onProviderChange, onSubmit }) {
  return (
    <section className="workspace">
      <div className="section-heading">
        <div><div className="eyebrow">OPTIMIZER</div><h2>Send a compressed request</h2></div>
        <label className="provider-select">Route to <select value={provider} onChange={(event) => onProviderChange(event.target.value)}><option value="auto">Automatic (any available key)</option>{PROVIDERS.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}</select></label>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); onSubmit() }}>
        <label className="field-label" htmlFor="prompt">Your prompt</label>
        <textarea id="prompt" value={prompt} onChange={(event) => onPromptChange(event.target.value)} placeholder="Ask anything. Your local model will reduce it before sending..." rows="7" />
        <div className="composer-footer"><span>{prompt.length} characters · request + response compression enabled</span><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Compressing...' : 'Send request'} <span>→</span></button></div>
      </form>
      {response && <div className="result"><div className="result-heading"><span className="success-icon">✓</span><strong>Compressed response</strong><span className="muted">Returned by the selected provider</span></div><p>{response}</p></div>}
    </section>
  )
}
