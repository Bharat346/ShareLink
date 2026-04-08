/**
 * useSignaling.js - WebSocket signaling connection management
 * Handles connect, reconnect, keep-alive, and message dispatch.
 */

export function connectToSignalling(wsRef, addLog, setStatus, onMessage) {
  let url = process.env.NEXT_PUBLIC_WS_URL;

  if (
    !url ||
    (typeof window !== "undefined" &&
      window.location.hostname === "localhost" &&
      !url.includes("localhost"))
  ) {
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    url = `ws://${host}:4000/signaling`;
  }

  const savedId = typeof window !== "undefined" ? sessionStorage.getItem("vault_node_id") : null;
  const savedAlias = typeof window !== "undefined" ? sessionStorage.getItem("vault_node_alias") : null;

  if (savedId) url += (url.includes("?") ? "&" : "?") + `clientId=${savedId}`;
  if (savedAlias && savedAlias !== "SEARCHING...") {
    url += (url.includes("?") ? "&" : "?") + `alias=${encodeURIComponent(savedAlias)}`;
  }

  console.log("useSignaling :: Connecting to:", url);
  if (wsRef.current) {
    wsRef.current.onclose = null;
    wsRef.current.close();
  }
  wsRef.current = new WebSocket(url);

  wsRef.current.onopen = () => {
    console.log("useSignaling :: Link Established");
    addLog("Link established with signaling node", "success");
    setStatus("ready");

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === 1) {
        wsRef.current.send(JSON.stringify({ type: "PING" }));
      }
    }, 30000);
    wsRef.current.pingInterval = pingInterval;
  };

  wsRef.current.onclose = () => {
    console.log("useSignaling :: Link Severed");
    addLog("Signaling link severed. Retrying in 5s...", "warning");
    setStatus("disconnected");
    if (wsRef.current.pingInterval) clearInterval(wsRef.current.pingInterval);
    setTimeout(() => connectToSignalling(wsRef, addLog, setStatus, onMessage), 5000);
  };

  wsRef.current.onerror = (err) => {
    addLog("WebSocket link error. Check node accessibility.", "error");
    console.error("WS Error:", err);
  };

  wsRef.current.onmessage = onMessage;
}

export function sendWsMessage(wsRef, payload) {
  if (wsRef.current?.readyState === 1) {
    wsRef.current.send(JSON.stringify(payload));
  }
}
