function renderInline(text) {
  return text.split(/(`[^`]+`)/g).map((part, index) => part.startsWith('`') && part.endsWith('`') ? <code key={index}>{part.slice(1, -1)}</code> : part)
}

export function FormattedResponse({ content }) {
  const blocks = content.split(/```([\s\S]*?)```/g)
  return <div className="formatted-response">{blocks.map((block, index) => index % 2 === 1 ? <pre key={index}><code>{block.trim()}</code></pre> : block.split(/\n\n+/).filter(Boolean).map((paragraph, paragraphIndex) => {
    const lines = paragraph.split('\n')
    if (lines.every((line) => /^[-*] /.test(line))) return <ul key={`${index}-${paragraphIndex}`}>{lines.map((line, lineIndex) => <li key={`${line}-${lineIndex}`}>{renderInline(line.slice(2))}</li>)}</ul>
    if (/^#{1,3} /.test(paragraph)) return <h3 key={`${index}-${paragraphIndex}`}>{renderInline(paragraph.replace(/^#{1,3} /, ''))}</h3>
    return <p key={`${index}-${paragraphIndex}`}>{lines.map((line, lineIndex) => <span key={lineIndex}>{line}{lineIndex < lines.length - 1 && <br />}</span>)}</p>
  }))}</div>
}