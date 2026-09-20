import { useState } from "react";
import { getProviderName } from "../config/providers";
import { sendChatRequest } from "../services/chatService";
import {
  clearAnalytics,
  loadAnalytics,
  saveAnalytics,
} from "../services/analyticsStorage";

export function useChatRequest({
  keys,
  localUrl,
  localModel,
  connectedProviders,
  localStatus,
}) {
  const [response, setResponse] = useState("");
  const [records, setRecords] = useState(() => loadAnalytics());
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit({ prompt, provider }) {
    const requestStartedAt = new Date().toISOString();
    setNotice("");
    setResponse("");
    if (!prompt.trim()) {
      setNotice("Add a prompt before sending it.");
      return;
    }
    if (!connectedProviders.length) {
      setNotice("Add at least one provider API key in Settings.");
      return;
    }
    if (localStatus !== "connected") {
      setNotice(
        "Connect the local LLM first. Compression requires it for both request and response.",
      );
      return;
    }

    setBusy(true);
    try {
      const data = await sendChatRequest({
        provider,
        apiKeys: keys,
        localUrl,
        localModel,
        prompt,
      });
      if (typeof data.response !== "string" || !data.response) {
        throw new Error("The provider returned an empty response.");
      }
      const request = {
        original:
          typeof data.request?.original === "string"
            ? data.request.original
            : prompt,
        compressed:
          typeof data.request?.compressed === "string"
            ? data.request.compressed
            : prompt,
      };
      const tokenStats = {
        request: {
          suppressedTokens: Math.max(
            0,
            Number(data.tokenStats?.request?.suppressedTokens) || 0,
          ),
        },
        response: {
          suppressedTokens: Math.max(
            0,
            Number(data.tokenStats?.response?.suppressedTokens) || 0,
          ),
        },
      };
      setResponse(data.response);
      setNotice(
        `Request and response compressed locally. Used ${getProviderName(data.provider)}.`,
      );
      const record = {
        id:
          globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        timestamp: requestStartedAt,
        provider: data.provider,
        providerName: getProviderName(data.provider),
        request,
        response: {
          original: data.originalResponse || data.response,
          compressed: data.response,
        },
        tokenStats,
      };
      setRecords((current) => {
        const nextRecords = [...current, record].slice(-100);
        saveAnalytics(nextRecords);
        return nextRecords;
      });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  function showNotice(message) {
    setNotice(message);
  }

  function clearHistory() {
    clearAnalytics();
    setRecords([]);
  }

  return { response, records, notice, busy, submit, showNotice, clearHistory };
}
