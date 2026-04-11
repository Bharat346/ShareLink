/**
 * webrtc.init.js - RTCPeerConnection factory
 * Creates and configures the peer connection with ICE servers.
 * Supports VPN relay-only mode via getRTCConfig().
 */

import { getRTCConfig } from "../constants";

export function createPeerConnection(onLog, vpnEnabled = false) {
  const config = getRTCConfig(vpnEnabled);
  const pc = new RTCPeerConnection(config);
  onLog(
    `RTCPeerConnection Initialized${vpnEnabled ? " [RELAY-ONLY / VPN]" : ""}`,
    "info",
  );
  return pc;
}
