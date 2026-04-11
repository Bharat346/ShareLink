/**
 * Protocol Constants - Centralized message types and status values
 * Prevents typo-based bugs and provides a single source of truth.
 */

// ─── Signaling Message Types ─────────────────────────────────────────────────
export const SIGNAL = {
  PING: "PING",
  PONG: "PONG",
  ASSIGNED_IP: "ASSIGNED_IP",
  CREATE_SESSION: "CREATE_SESSION",
  SESSION_CREATED: "SESSION_CREATED",
  JOIN_SESSION: "JOIN_SESSION",
  SESSION_JOINED: "SESSION_JOINED",
  SESSION_ERROR: "SESSION_ERROR",
  PEER_READY: "PEER_READY",
  PEER_DISCONNECTED: "PEER_DISCONNECTED",
  SIGNAL: "SIGNAL",
};

// ─── Data Channel Message Types ──────────────────────────────────────────────
export const CHANNEL = {
  CHAT: "CHAT",
  START_TRANSFER: "START_TRANSFER",
  AUDIO_MSG: "AUDIO_MSG",
  ACCEPT_TRANSFER: "ACCEPT_TRANSFER",
  REJECT_TRANSFER: "REJECT_TRANSFER",
  END_TRANSFER: "END_TRANSFER",
  ACK: "ACK",
  KEY_EXCHANGE: "KEY_EXCHANGE",
};

// ─── Call Actions ────────────────────────────────────────────────────────────
export const CALL_ACTION = {
  INITIATE: "CALL_INITIATE",
  ACCEPT: "ACCEPT",
  REJECT: "REJECT",
  CANCEL: "CANCEL",
  END: "END",
};

// ─── Connection Status ───────────────────────────────────────────────────────
export const STATUS = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  READY: "ready",
  CONNECTED: "connected",
  TRANSFERRING: "transferring",
  FAILED: "failed",
};

// ─── RTC Config ──────────────────────────────────────────────────────────────
export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: [
      "turn:free.expressturn.com:3478?transport=udp",
      "turn:free.expressturn.com:3478?transport=tcp",
    ],
    username: "000000002089815248",
    credential: "ZO2117X0CMGGf53bq88y6k+jRQ4=",
  },
];

/**
 * Get RTC config with optional VPN relay-only mode
 * When VPN is enabled, force all traffic through TURN relay
 * to simulate a secure tunnel (no direct peer-to-peer leaks)
 */
export function getRTCConfig(vpnEnabled = false) {
  return {
    iceServers: ICE_SERVERS,
    ...(vpnEnabled ? { iceTransportPolicy: "relay" } : {}),
  };
}

// ─── Timing Constants ────────────────────────────────────────────────────────
export const CALL_TTL_MS = 20000;
export const PING_INTERVAL_MS = 30000;
export const RECONNECT_DELAY_MS = 5000;
export const HANDSHAKE_TIMEOUT_MS = 15000;
export const CHUNK_SIZE = 16 * 1024;
export const MAX_BUFFER_SIZE = 4 * 1024 * 1024;
