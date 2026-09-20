import { useCallback, useEffect, useState } from "react";
import { checkLocalModel } from "../services/localLlmService";

export function useLocalModelStatus(localUrl) {
  const [status, setStatus] = useState("unknown");

  const retry = useCallback(async () => {
    setStatus("checking");
    try {
      await checkLocalModel(localUrl);
      setStatus("connected");
    } catch {
      setStatus("offline");
    }
  }, [localUrl]);

  useEffect(() => {
    retry();
  }, [retry]);

  return { status, retry };
}
