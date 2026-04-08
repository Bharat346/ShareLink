/**
 * webrtc.init.js - RTCPeerConnection factory
 * Creates and configures the peer connection with ICE servers.
 */

const DEFAULT_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: [
        "turn:free.expressturn.com:3478?transport=udp",
        "turn:free.expressturn.com:3478?transport=tcp",
      ],
      username: "000000002089815248",
      credential: "ZO2117X0CMGGf53bq88y6k+jRQ4=",
    },
  ],
};

export function createPeerConnection(onLog, config = DEFAULT_CONFIG) {
  const pc = new RTCPeerConnection(config);
  onLog("RTCPeerConnection Initialized", "info");
  return pc;
}
