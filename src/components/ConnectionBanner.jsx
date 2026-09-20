const STATUS_LABELS = { connected: 'Connected', checking: 'Checking...', offline: 'Not connected', unknown: 'Not checked' }

export function ConnectionBanner({ localModel, localUrl, status, onRetry }) {
  const statusLabel = STATUS_LABELS[status]
  return (
    <section className="connection-banner">
      <div className={`status-dot ${status}`} />
      <div className="banner-copy">
        <strong>Local LLM {statusLabel.toLowerCase()}</strong>
        <span>{status === 'connected' ? `${localModel} is ready to compress requests and responses.` : `Connect Ollama at ${localUrl} to start.`}</span>
      </div>
      <button className="outline-button" type="button" onClick={onRetry}>Retry</button>
    </section>
  )
}
