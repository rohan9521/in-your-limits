import { CHAT_ROUTES } from '../config/providers'
import { ChatTranscript } from './ChatTranscript'

export function RequestComposer({ prompt, provider, busy, records, localModel, onPromptChange, onProviderChange, onSubmit }) {
  return (
    <section className="workspace chat-workspace">
      <ChatTranscript records={records} busy={busy} />
      <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); onSubmit() }}>
        <label className="visually-hidden" htmlFor="prompt">Message</label>
        <textarea id="prompt" value={prompt} onChange={(event) => onPromptChange(event.target.value)} onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            event.currentTarget.form?.requestSubmit()
          }
        }} placeholder="Message In Your Limits" rows="2" />
        <div className="composer-footer">
          <label className="provider-select" htmlFor="provider-route">
            <span className="route-label">Model</span>
            <select id="provider-route" value={provider} onChange={(event) => onProviderChange(event.target.value)}>
              <option value="auto">Automatic</option>
              {CHAT_ROUTES.map(({ id, name }) => <option key={id} value={id}>{id === 'local' ? `${name} (${localModel})` : name}</option>)}
            </select>
          </label>
          <span className="composer-hint">Enter a message · {prompt.length} characters</span>
          <button className="send-button" type="submit" disabled={busy || !prompt.trim()} aria-label={busy ? 'Sending message' : 'Send message'}>{busy ? '…' : '↑'}</button>
        </div>
      </form>
      <p className="composer-disclaimer">Requests and responses are compressed locally. Choose Local Ollama to use your local model for the chat reply too.</p>
    </section>
  )
}
