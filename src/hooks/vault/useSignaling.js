/**
 * useSignaling.js - WebSocket signaling connection management
 * Handles connect, reconnect, keep-alive, and message dispatch.
 *
 * FIXES:
 * - Exponential backoff for reconnection (2s, 4s, 8s... up to 30s)
 * - Max reconnection attempts (10) before giving up
 * - Proper ping interval cleanup on close
 * - Guard against SSR (typeof window check)
 */

const MAX_RECONNECT_ATTEMPTS = 10;
let reconnectAttempts = 0;

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

  // Clean up existing connection
  if (wsRef.current) {
    if (wsRef.current.pingInterval) {
      clearInterval(wsRef.current.pingInterval);
      wsRef.current.pingInterval = null;
    }
    wsRef.current.onclose = null;
    wsRef.current.close();
  }

  try {
    wsRef.current = new WebSocket(url);
  } catch (err) {
    addLog(`Failed to create WebSocket: ${err.message}`, "error");
    setStatus("disconnected");
    return;
  }

  wsRef.current.onopen = () => {
    console.log("useSignaling :: Link Established");
    addLog("Link established with signaling node", "success");
    setStatus("ready");
    reconnectAttempts = 0; // Reset on successful connection

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === 1) {
        wsRef.current.send(JSON.stringify({ type: "PING" }));
      }
    }, 30000);
    wsRef.current.pingInterval = pingInterval;
  };

  wsRef.current.onclose = () => {
    console.log("useSignaling :: Link Severed");
    if (wsRef.current?.pingInterval) {
      clearInterval(wsRef.current.pingInterval);
      wsRef.current.pingInterval = null;
    }
    setStatus("disconnected");

    // Exponential backoff reconnection
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      const delay = Math.min(2000 * Math.pow(2, reconnectAttempts - 1), 30000);
      addLog(`Signaling link severed. Retrying in ${delay / 1000}s (attempt ${reconnectAttempts})...`, "warning");
      setTimeout(() => connectToSignalling(wsRef, addLog, setStatus, onMessage), delay);
    } else {
      addLog("Max reconnection attempts reached. Please reconnect manually.", "error");
    }
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

/**
 * Reset reconnection counter (call when user manually reconnects)
 */
export function resetReconnectCounter() {
  reconnectAttempts = 0;
}
