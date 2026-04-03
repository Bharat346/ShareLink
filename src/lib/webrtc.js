export class FileTransferManager {
  constructor(onLog, onStatus, onProgress) {
    this.onLog = onLog;
    this.onStatus = onStatus;
    this.onProgress = onProgress;
    this.pc = null;
    this.dataChannel = null;
    this.makingOffer = false;
    this.ignoreOffer = false;
    this.polite = false;
    this.sendSignal = null;

    // File transfer state
    this.pendingFile = null;
    this.isSending = false;
    this.isReceiving = false;
    this.receivedBytes = 0;
    this.totalBytes = 0;
    this.fileName = "";

    // Audio state
    this.localStream = null;

    this.config = {
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
  }

  setVpn(enabled) {
    this.onLog(`VPN Tunnel ${enabled ? "Enabled" : "Disabled"}`, "info");
  }

  initPeerConnection(sendSignal, polite = false) {
    this.polite = polite;
    this.sendSignal = sendSignal;
    this.pc = new RTCPeerConnection(this.config);

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({ candidate: event.candidate });
      }
    };

    this.pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
        await this.pc.setLocalDescription();
        this.sendSignal({ description: this.pc.localDescription });
      } catch (err) {
        console.error("Negotiation Error:", err);
      } finally {
        this.makingOffer = false;
      }
    };

    this.pc.onconnectionstatechange = () => {
      this.onLog(
        `Link State: ${this.pc.connectionState.toUpperCase()}`,
        "info",
      );
      if (
        this.pc.connectionState === "disconnected" ||
        this.pc.connectionState === "failed"
      ) {
        this.onStatus("disconnected");
      }
    };

    this.pc.ondatachannel = (event) => {
      this.onLog("Incoming Data Stream Detected", "success");
      this.setupDataChannel(event.channel);
    };

    // Create DataChannel unconditionally only on the impolite peer
    if (!this.polite) {
      this.onLog("Provisioning Data Channel...", "info");
      const channel = this.pc.createDataChannel("fileTransfer", {
        ordered: true,
      });
      this.setupDataChannel(channel);
    }
  }

  setupDataChannel(channel) {
    this.dataChannel = channel;
    this.dataChannel.binaryType = "arraybuffer";

    this.dataChannel.onopen = () => {
      this.onLog("P2P Data Link: SECURE", "success");
      this.onStatus("connected");
    };

    this.dataChannel.onmessage = async (event) => {
      // console.log("L102 : webrtc.js : event : ", event, typeof event);
      if (typeof event.data === "string") {
        const metadata = JSON.parse(event.data);

        if (metadata.type === "START_TRANSFER") {
          this.pendingFile = metadata;
          this.onLog(`Incoming payload: ${metadata.fileName}`, "info");
          this.onStatus("awaiting-acceptance");
        } else if (metadata.type === "AUDIO_MSG") {
          this.pendingFile = metadata;
          this.onLog(`Incoming audio signal: ${metadata.fileName}`, "info");
          this.prepareForAudioReceive(metadata);
          this.onStatus("audio-start", metadata);
        } else if (metadata.type === "ACCEPT_TRANSFER") {
          if (this.acceptanceResolve) {
            this.acceptanceResolve(true);
            this.acceptanceResolve = null;
          }
          this.onStatus("transferring");
        } else if (metadata.type === "REJECT_TRANSFER") {
          if (this.acceptanceResolve) {
            this.acceptanceResolve(false);
            this.acceptanceResolve = null;
          }
        } else if (metadata.type === "CHAT") {
          this.onStatus("chat-message", metadata);
        } else if (metadata.type === "END_TRANSFER") {
          await this.finishDownload();
        }
      } else {
        await this.handleChunk(event.data);
      }
    };

    this.dataChannel.onclose = () => {
      this.onLog("P2P Link Suspended", "warning");
      this.onStatus("disconnected");
    };

    this.dataChannel.onerror = (error) => {
      console.error("DataChannel Error:", error);
      // Silent suppress of background close errors, only log fatal Link errors
      if (this.dataChannel?.readyState !== "closed") {
        this.onLog(
          `Link Interface Error: ${error.message || "Negotiation Stall"}`,
          "error",
        );
      }
    };
  }

  async sendFile(file) {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      this.onLog("Link not ready for binary expression", "error");
      return;
    }

    this.isSending = true;
    this.onLog(`Injecting Payload: ${file.name}`, "info");

    this.dataChannel.send(
      JSON.stringify({
        type: file.name.startsWith("VoiceNote_") ? "AUDIO_MSG" : "START_TRANSFER",
        fileName: file.name,
        fileSize: file.size,
      }),
    );

    this.onLog("Waiting for node acceptance...", "info");
    this.onStatus("waiting-for-peer");

    const accepted = await new Promise((resolve) => {
      this.acceptanceResolve = resolve;
    });

    if (!accepted) {
      this.onLog("Node rejected payload", "warning");
      this.onStatus("connected");
      return;
    }

    this.onLog("Link synced. Streaming binary...", "success");
    this.onStatus("transferring");

    const reader = file.stream().getReader();
    const CHUNK_SIZE = 16 * 1024;
    let loaded = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        let offset = 0;
        while (offset < value.byteLength) {
          if (this.dataChannel.readyState !== "open")
            throw new Error("Link Lost");

          if (this.dataChannel.bufferedAmount > 4 * 1024 * 1024) {
            await new Promise((r) => {
              const onLow = () => {
                this.dataChannel.removeEventListener(
                  "bufferedamountlow",
                  onLow,
                );
                r();
              };
              this.dataChannel.addEventListener("bufferedamountlow", onLow);
              setTimeout(r, 50); // Fallback
            });
          }

          const chunk = value.slice(offset, offset + CHUNK_SIZE);
          this.dataChannel.send(chunk);
          offset += chunk.byteLength;
          loaded += chunk.byteLength;
          this.onProgress((loaded / file.size) * 100);
        }
      }
      this.dataChannel.send(JSON.stringify({ type: "END_TRANSFER" }));
      this.onLog("File dispersal complete", "success");
      this.isSending = false;
      this.onStatus("connected");
      this.onProgress(0);
    } catch (err) {
      this.onLog(`Transfer Failed: ${err.message}`, "error");
      this.isSending = false;
      this.onStatus("connected");
    } finally {
      reader.releaseLock();
    }
  }

  sendChat(message, alias) {
    // console.log("L225 : webrtc.js : sendChat : ", message, alias);
    if (this.dataChannel?.readyState === "open") {
      this.dataChannel.send(
        JSON.stringify({
          type: "CHAT",
          message,
          alias,
          time: new Date().toLocaleTimeString(),
        }),
      );
      this.onLog(
        `Injected local expression: ${message.slice(0, 10)}...`,
        "info",
      );
      return true;
    } else {
      this.onLog("Data Link Closed: Expresson dropped", "error");
    }
  }

  async prepareForAudioReceive(metadata) {
    if (!metadata) return;
    this.fileName = metadata.fileName;
    this.totalBytes = metadata.fileSize;
    this.receivedBytes = 0;
    this.isReceiving = true;
    this.audioChunks = [];

    this.onLog(`Buffering Audio Link: ${this.fileName}`, "info");
    this.onStatus("transferring");
    this.dataChannel.send(JSON.stringify({ type: "ACCEPT_TRANSFER" }));
  }

  async prepareForDownload(metadata) {
    if (!metadata) return;
    this.totalBytes = metadata.fileSize;
    this.receivedBytes = 0;
    this.isReceiving = true;
    this.currentFileStream = null;
    this.receivedChunks = null;
    this.fileName = metadata.fileName;

    const hasFilePicker = typeof window.showSaveFilePicker === "function" && window.isSecureContext;
    let pickerSuccess = false;

    // 1. Try Native Picker FIRST (Preserves User Activation in Chrome)
    if (hasFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: this.fileName,
        });
        this.currentFileStream = await handle.createWritable();
        this.fileName = handle.name; // Use the name from the picker
        this.onLog(`Direct link established: ${this.fileName}`, "success");
        pickerSuccess = true;
      } catch (err) {
        if (err.name === "AbortError") {
          this.onLog("Save cancelled by node", "warning");
          this.rejectTransfer();
          this.isReceiving = false;
          return;
        }
        this.onLog(`Native Picker bypassed: ${err.name}`, "info");
      }
    }

    // 2. Fallback for Firefox/Mobile/Safari
    if (!pickerSuccess) {
      const customName = prompt("Save file as:", this.fileName);
      if (customName === null) {
        this.onLog("Download rejected by user", "warning");
        this.rejectTransfer();
        this.isReceiving = false;
        return;
      }
      this.fileName = customName || this.fileName;
      this.onLog("Using Browser Memory Relay", "info");
      this.receivedChunks = [];
    }

    this.onStatus("downloading");
    this.dataChannel.send(JSON.stringify({ type: "ACCEPT_TRANSFER" }));
    
    if (this.acceptanceResolve) {
      this.acceptanceResolve(true);
      this.acceptanceResolve = null;
    }
  }

  rejectTransfer() {
    if (this.dataChannel?.readyState === "open") {
      this.dataChannel.send(JSON.stringify({ type: "REJECT_TRANSFER" }));
    }
    if (this.acceptanceResolve) {
      this.acceptanceResolve(false);
      this.acceptanceResolve = null;
    }
    this.pendingFile = null;
    this.onStatus("connected");
  }

  async handleChunk(data) {
    if (!this.isReceiving) return;
    if (this.currentFileStream) {
      await this.currentFileStream.write(data);
    } else if (this.audioChunks) {
      this.audioChunks.push(new Uint8Array(data));
    } else if (this.receivedChunks) {
      this.receivedChunks.push(new Uint8Array(data));
    }
    this.receivedBytes += data.byteLength;
    this.onProgress((this.receivedBytes / this.totalBytes) * 100);
  }

  async finishDownload() {
    if (this.currentFileStream) {
      await this.currentFileStream.close();
      this.currentFileStream = null;
      this.onLog("File saved via stream", "success");
    } else if (this.audioChunks) {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(audioBlob);
      this.onStatus("audio-received", { url, fileName: this.fileName });
      this.audioChunks = null;
    } else if (this.receivedChunks) {
      const blob = new Blob(this.receivedChunks);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = this.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.receivedChunks = null;
      this.onLog("File downloaded via memory buffer", "success");
    }
    this.onLog("Binary payload reconstructed successfully", "success");
    this.isReceiving = false;
    this.onProgress(0);
    this.onStatus("connected");
  }

  async handleDescription(description) {
    try {
      const offerCollision =
        description.type === "offer" &&
        (this.makingOffer || this.pc.signalingState !== "stable");

      this.ignoreOffer = !this.polite && offerCollision;
      if (this.ignoreOffer) {
        return;
      }

      await this.pc.setRemoteDescription(description);

      if (description.type === "offer") {
        await this.pc.setLocalDescription();
        this.sendSignal({ description: this.pc.localDescription });
      }
    } catch (err) {
      console.error("Handle Description Error:", err);
    }
  }

  async addIceCandidate(candidate) {
    try {
      await this.pc.addIceCandidate(candidate);
    } catch (err) {
      if (!this.ignoreOffer) {
        console.error("Ice Candidate Error:", err);
      }
    }
  }

  async toggleAudioCall(enabled, onRemoteStream) {
    if (enabled) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.localStream = stream;
      stream.getTracks().forEach((t) => this.pc.addTrack(t, stream));
      this.pc.ontrack = (e) => onRemoteStream(e.streams[0]);
    } else {
      if (this.localStream)
        this.localStream.getTracks().forEach((t) => t.stop());
      this.pc
        .getSenders()
        .forEach((s) => s.track?.kind === "audio" && this.pc.removeTrack(s));
    }
  }

  close() {
    if (this.localStream) this.localStream.getTracks().forEach((t) => t.stop());
    if (this.dataChannel) this.dataChannel.close();
    if (this.pc) this.pc.close();
    this.onStatus("disconnected");
  }
}
