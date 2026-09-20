function normalizeUrl(url) {
  return url.trim().replace(/\/$/, "");
}

export async function checkLocalModel(localUrl) {
  const response = await fetch(`${normalizeUrl(localUrl)}/api/tags`);
  if (!response.ok) {
    throw new Error(`Local LLM returned ${response.status}`);
  }
  return true;
}
