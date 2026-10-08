const STORAGE_KEYS = {
  apiKeys: "iYL.apiKeys",
  localUrl: "iYL.localUrl",
  localModel: "iYL.localModel",
};

const DEFAULTS = {
  localUrl: "http://localhost:11434",
  localModel: "llama3:8b",
};

function readJson(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export function loadSettings(initialKeys) {
  const storedKeys = readJson(STORAGE_KEYS.apiKeys, {});
  const keys = Object.fromEntries(
    Object.keys(initialKeys).map((providerId) => [
      providerId,
      typeof storedKeys?.[providerId] === "string"
        ? storedKeys[providerId]
        : initialKeys[providerId],
    ]),
  );

  const storedLocalModel = localStorage.getItem(STORAGE_KEYS.localModel);
  const localModel =
    !storedLocalModel || storedLocalModel === "llama3.2:3b"
      ? DEFAULTS.localModel
      : storedLocalModel;
  if (localModel !== storedLocalModel) {
    localStorage.setItem(STORAGE_KEYS.localModel, localModel);
  }

  return {
    keys,
    localUrl: localStorage.getItem(STORAGE_KEYS.localUrl) || DEFAULTS.localUrl,
    localModel,
  };
}

export function saveSettings({ keys, localUrl, localModel }) {
  localStorage.setItem(STORAGE_KEYS.apiKeys, JSON.stringify(keys));
  localStorage.setItem(STORAGE_KEYS.localUrl, localUrl);
  localStorage.setItem(STORAGE_KEYS.localModel, localModel);
}
