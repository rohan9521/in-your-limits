function normalizeUrl(url) {
  const value = url.trim();
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(value)
    ? value
    : `http://${value}`;
  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error(`Invalid Ollama URL: ${value || "(empty)"}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Ollama URL must use http:// or https://.");
  }
  return parsed.href.replace(/\/+$/, "");
}

export async function checkLocalModel(localUrl) {
  const response = await fetch(`${normalizeUrl(localUrl)}/api/tags`);
  if (!response.ok) {
    throw new Error(`Local LLM returned ${response.status}`);
  }
  return true;
}
