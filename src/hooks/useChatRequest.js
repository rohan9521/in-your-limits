import { useState } from "react";
import { getProviderName } from "../config/providers";
import { sendChatRequest } from "../services/chatService";

export function useChatRequest({
  keys,
  localUrl,
  localModel,
  connectedProviders,
  localStatus,
}) {
  const [response, setResponse] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit({ prompt, provider }) {
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
      setResponse(data.response);
      setNotice(
        `Request and response compressed locally. Used ${getProviderName(data.provider)}.`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  function showNotice(message) {
    setNotice(message);
  }

  return { response, notice, busy, submit, showNotice };
}
