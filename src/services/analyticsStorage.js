const STORAGE_KEY = "iYL.analytics.v1";
const MAX_RECORDS = 100;

function isValidRecord(record) {
  return Boolean(
    record &&
    typeof record.id === "string" &&
    typeof record.timestamp === "string" &&
    typeof record.providerName === "string" &&
    typeof record.request?.original === "string" &&
    typeof record.response?.compressed === "string" &&
    Number.isFinite(record.tokenStats?.request?.suppressedTokens) &&
    record.tokenStats.request.suppressedTokens >= 0 &&
    Number.isFinite(record.tokenStats?.response?.suppressedTokens) &&
    record.tokenStats.response.suppressedTokens >= 0,
  );
}

export function loadAnalytics() {
  try {
    const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(records)
      ? records.filter(isValidRecord).slice(-MAX_RECORDS)
      : [];
  } catch {
    return [];
  }
}

export function saveAnalytics(records) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records.slice(-MAX_RECORDS)),
    );
  } catch {
    // Analytics should never interrupt a completed chat request.
  }
}

export function clearAnalytics() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private browsing contexts.
  }
}
