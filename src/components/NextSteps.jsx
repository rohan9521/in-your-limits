export function NextSteps({ onOpenSettings }) {
  return (
    <section className="next-steps">
      <h2>Get started</h2>
      <div className="step-row"><div className="step-number">1</div><div><strong>Connect your local model</strong><p>Run Ollama with the configured model for both compression passes.</p></div><button className="text-button" type="button" onClick={onOpenSettings}>Configure →</button></div>
      <div className="step-row"><div className="step-number">2</div><div><strong>Add any provider key</strong><p>Automatic routing prioritizes Gemini, then OpenAI, then Anthropic.</p></div><button className="text-button" type="button" onClick={onOpenSettings}>Add key →</button></div>
    </section>
  )
}
