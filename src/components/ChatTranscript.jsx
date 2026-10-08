import { useEffect, useRef } from 'react'
import { FormattedResponse } from './FormattedResponse'

export function ChatTranscript({ records, busy }) {
  const transcriptRef = useRef(null)

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [records, busy])

  return <div className="chat-transcript" aria-live="polite" ref={transcriptRef}>
    {records.length === 0 && !busy && <div className="chat-empty"><span className="chat-empty-mark">✳</span><strong>What can I help with?</strong><p>Ask a question or start with an idea. Your conversation is compressed locally.</p></div>}
    {records.flatMap((record) => [
      <div className="chat-message user-message" key={`${record.id}-request`}><p>{record.request.original}</p></div>,
      <div className="chat-message assistant-message" key={`${record.id}-response`}><div className="message-label"><span className="success-icon">✳</span> {record.providerName}</div><FormattedResponse content={record.response.compressed} /></div>,
    ])}
    {busy && <div className="chat-message assistant-message is-loading"><div className="message-label">THINKING</div><p>Preparing your response. If this model is at its limit, another connected model will take over with the same conversation context.</p></div>}
  </div>
}