import { FormattedResponse } from './FormattedResponse'

export function ChatTranscript({ records, busy }) {
  return <div className="chat-transcript" aria-live="polite">
    {records.length === 0 && !busy && <div className="chat-empty"><span className="chat-empty-mark">↗</span><strong>Your compressed conversation starts here</strong><p>Send a prompt to see the request and formatted response together.</p></div>}
    {records.flatMap((record) => [
      <div className="chat-message user-message" key={`${record.id}-request`}><div className="message-label">YOU <time>{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div><p>{record.request.original}</p></div>,
      <div className="chat-message assistant-message" key={`${record.id}-response`}><div className="message-label"><span className="success-icon">✓</span> COMPRESSED RESPONSE <span className="muted">{record.providerName}</span></div><FormattedResponse content={record.response.compressed} /></div>,
    ])}
    {busy && <div className="chat-message assistant-message is-loading"><div className="message-label">COMPRESSING LOCALLY</div><p>Preparing your response...</p></div>}
  </div>
}