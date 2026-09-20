import { useMemo, useState } from "react";
import { INITIAL_KEYS, PROVIDERS } from "../config/providers";
import {
  loadSettings,
  saveSettings as persistSettings,
} from "../services/settingsStorage";

export function useConnectionSettings() {
  const [settings, setSettings] = useState(() => loadSettings(INITIAL_KEYS));
  const connectedProviders = useMemo(
    () => PROVIDERS.filter(({ id }) => settings.keys[id]?.trim()),
    [settings.keys],
  );

  function updateSetting(name, value) {
    setSettings((current) => ({ ...current, [name]: value }));
  }

  function updateKey(providerId, value) {
    setSettings((current) => ({
      ...current,
      keys: { ...current.keys, [providerId]: value },
    }));
  }

  function saveSettings(nextSettings = settings) {
    persistSettings(nextSettings);
    setSettings(nextSettings);
  }

  return {
    ...settings,
    connectedProviders,
    updateSetting,
    updateKey,
    saveSettings,
  };
}
