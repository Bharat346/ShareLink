/**
 * useSessionActions.js - Session create/join/terminate
 */

import { toast } from "react-hot-toast";

export function startSession(wsRef) {
  if (wsRef.current?.readyState === 1) {
    wsRef.current.send(JSON.stringify({ type: "CREATE_SESSION" }));
  } else {
    toast.error("Signaling Server Unreachable");
  }
}

export function joinSession(wsRef, id) {
  if (wsRef.current?.readyState === 1 && id) {
    wsRef.current.send(
      JSON.stringify({ type: "JOIN_SESSION", sessionId: id.toUpperCase() }),
    );
  }
}

export function terminateConnection() {
  sessionStorage.removeItem("vault_session");
  sessionStorage.removeItem("vault_node_alias");
  sessionStorage.removeItem("vault_node_id");
  window.location.href = "/";
}
