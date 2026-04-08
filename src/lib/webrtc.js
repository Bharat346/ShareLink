/**
 * FileTransferManager - Central orchestrator
 * Composes all webrtc/* modules into a single manager.
 * No logic has been changed — only import paths updated.
 */

import { createPeerConnection } from "./webrtc/webrtc.init";
import { setupIceCandidateHandler, addIceCandidate } from "./webrtc/webrtc.iceCandidate";
import { setupNegotiation, handleDescription } from "./webrtc/webrtc.signal";
import { createDataChannel, setupDataChannel } from "./webrtc/webrtc.channel";
import { CallHandler } from "./webrtc/webrtc.call";

export class FileTransferManager {
  constructor(onLog, onStatus, onProgress) {
    this.onLog = onLog;
    this.onStatus = onStatus;
    this.onProgress = onProgress;
    this.pc = null;
    this.dataChannel = null;
    this.sendSignal = null;

    // Negotiation state (shared with signal module)
    this._state = { makingOffer: false, ignoreOffer: false, polite: false };

    // Sub-handler refs
    this._chatRef = { current: null };
    this._fileRef = { current: null };
    this.call = null;
  }

  get chat() { return this._chatRef.current; }
  get audio() { return this._fileRef.current; }

  setVpn(enabled) {
    this.onLog(`VPN Tunnel ${enabled ? "Enabled" : "Disabled"}`, "info");
  }

  initPeerConnection(sendSignal, polite = false) {
    this._state.polite = polite;
    this.sendSignal = sendSignal;

    // 1. Create PC
    this.pc = createPeerConnection(this.onLog);

    // 2. Call handler (needs pc before tracks)
    this.call = new CallHandler(this.pc, this.sendSignal, this.onLog, this.onStatus);

    // 3. ICE
    setupIceCandidateHandler(this.pc, this.sendSignal);

    // 4. Negotiation
    setupNegotiation(this.pc, this.sendSignal, this._state);

    // 5. Connection state
    this.pc.onconnectionstatechange = () => {
      const state = this.pc.connectionState;
      this.onLog(`Link Interface State: ${state.toUpperCase()}`, "info");
      if (state === "connected") this.onStatus("connected");
      else if (["disconnected", "failed", "closed"].includes(state)) this.onStatus("disconnected");
    };

    // 6. Incoming data channel
    this.pc.ondatachannel = (event) => {
      this.onLog("Incoming Data Stream Detected", "success");
      this._setupChannel(event.channel);
    };

    // 7. Impolite peer creates channel
    if (!polite) {
      const channel = createDataChannel(this.pc, this.onLog);
      this._setupChannel(channel);
    }
  }

  _setupChannel(channel) {
    this.dataChannel = channel;
    setupDataChannel(channel, this.onLog, this.onStatus, this.onProgress, this._chatRef, this._fileRef);
  }

  // --- Signal routing ---
  async handleSignal(data) {
    try {
      if (data.callAction) {
        switch (data.callAction) {
          case "CALL_INITIATE": this.call.handleIncomingCall(data); break;
          case "ACCEPT": this.call.handleAccepted(); break;
          case "REJECT": case "CANCEL": this.call.handleRejected(); break;
          case "END": this.call.stop(); this.onStatus("call-ended"); break;
        }
        return;
      }
      if (data.description) await handleDescription(this.pc, data.description, this.sendSignal, this._state);
      else if (data.candidate) await addIceCandidate(this.pc, data.candidate, this._state.ignoreOffer);
    } catch (err) {
      console.error("Signal Processing Error:", err);
    }
  }

  // --- Public API (unchanged) ---
  sendChat(m, a, i) { return this.chat?.send(m, a, i); }
  sendFile(f) { return this.audio?.send(f); }
  acceptFile() { this.audio?.accept(); }
  rejectFile() { this.audio?.handleReject(); }

  async toggleAudio() {
    if (this.call.localStream) {
      this.call.stop();
      this.sendSignal({ callAction: "END" });
      return true;
    } else {
      return this.call.isIncoming ? await this.call.activate() : await this.call.initiate();
    }
  }

  sendCallSignal(a) { this.call.sendCallSignal(a); }

  close() {
    this.call?.stop();
    this.dataChannel?.close();
    this.pc?.close();
    this.onStatus("disconnected");
  }
}
