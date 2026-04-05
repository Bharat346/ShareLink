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
      const state = this.pc.connectionState;
      this.onLog(`Link Interface State: ${state.toUpperCase()}`, "info");
      
      if (state === "connected") {
        this.onStatus("connected");
      } else if (state === "disconnected" || state === "failed" || state === "closed") {
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

  handleSignal(data) {
    if (data.description) {
      this.handleDescription(data.description);
    } else if (data.candidate) {
      this.addIceCandidate(data.candidate);
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
      if (typeof event.data === "string") {
        const metadata = JSON.parse(event.data);

        if (metadata.type === "START_TRANSFER") {
          this.pendingFile = metadata;
          this.onLog(`Incoming payload: ${metadata.fileName}`, "info");
          this.onStatus("file-request-received", metadata);
        } else if (metadata.type === "AUDIO_MSG") {
          this.pendingFile = metadata;
          this.onLog(`Incoming audio signal: ${metadata.fileName}`, "info");
          this.prepareForAudioReceive(metadata);
          this.onStatus("audio-received", metadata);
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
          this.onStatus("connected");
        } else if (metadata.type === "CHAT") {
          this.onStatus("chat-received", metadata);
        } else if (metadata.type === "CALL_SIGNAL") {
          this.onStatus("call-signal-received", metadata);
        } else if (metadata.type === "END_TRANSFER") {
          await this.finishDownload();
        }
      } else {
        await this.handleChunk(event.data);
      }
    };

    this.dataChannel.onclose = () => {
      this.onLog("Data Link Suspended", "warning");
      // Only set disconnected if the overall peer connection is also failing
      if (this.pc.connectionState !== "connected") {
        this.onStatus("disconnected");
      }
    };

    this.dataChannel.onerror = (error) => {
      // RTCErrorEvents sometimes contain little detail; log generically if closed
      if (this.dataChannel?.readyState !== "closed") {
         this.onLog(`Link Interface Signal: High Latency/Negotiation Overhead`, "info");
      }
    };
  }

  async sendFile(file) {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      this.onLog("Link Interface NOT_READY: Expression dropped", "error");
      return false;
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
    this.onStatus("transferring");

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
      return true;
    } catch (err) {
      this.onLog(`Transfer Failed: ${err.message}`, "error");
      this.isSending = false;
      this.onStatus("connected");
      return false;
    } finally {
      reader.releaseLock();
    }
  }

  sendChat(message, alias, id) {
    if (this.dataChannel?.readyState === "open") {
      try {
        this.dataChannel.send(
          JSON.stringify({
            type: "CHAT",
            id: id || crypto.randomUUID(),
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
      } catch (err) {
        this.onLog(`Signal Drop: ${err.message}`, "error");
        return false;
      }
    } else {
      this.onLog("Data Link Closed: Message dropped", "error");
      return false;
    }
  }

  async acceptFile(fileName) {
      if (this.pendingFile && this.pendingFile.fileName === fileName) {
           await this.prepareForDownload(this.pendingFile);
      }
  }

  async rejectFile(fileName) {
      if (this.pendingFile && this.pendingFile.fileName === fileName) {
          this.rejectTransfer();
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

    if (hasFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: this.fileName,
        });
        this.currentFileStream = await handle.createWritable();
        this.fileName = handle.name;
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

    if (!pickerSuccess) {
      const customName = prompt("PROTOCOL_SAVE_NODE: Save file as:", this.fileName);
      if (customName === null) {
        this.onLog("Download REJECTED by user", "warning");
        this.rejectTransfer();
        this.isReceiving = false;
        return;
      }
      this.fileName = customName || this.fileName;
      // Sanitize fileName just in case browser or user stripped it
      if (!this.fileName.includes('.') && metadata.fileName.includes('.')) {
         this.fileName += '.' + metadata.fileName.split('.').pop();
      }
      this.onLog(`Using Relay Buffer: ${this.fileName}`, "info");
      this.receivedChunks = [];
    }

    this.onStatus("transferring");
    this.dataChannel.send(JSON.stringify({ type: "ACCEPT_TRANSFER" }));
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

  async toggleAudio() {
    try {
      if (this.localStream) {
        this.onLog("Severing voice link...", "warning");
        
        // Notify peer via signaling server (more reliable during renegotiation)
        this.sendSignal({ type: "CALL_SIGNAL", action: "END" });

        this.localStream.getTracks().forEach((t) => t.stop());
        this.localStream = null;
        
        this.pc.getSenders().forEach((s) => {
          if (s.track?.kind === "audio") {
            this.pc.removeTrack(s);
          }
        });

        if (this.pc.signalingState === 'stable') {
           const offer = await this.pc.createOffer();
           await this.pc.setLocalDescription(offer);
           this.sendSignal({ description: this.pc.localDescription });
        }

        return true;
      } else {
        this.onLog("Initializing voice capture...", "info");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.localStream = stream;
        stream.getTracks().forEach((t) => this.pc.addTrack(t, stream));
        
        if (this.pc.signalingState === 'stable') {
           const offer = await this.pc.createOffer();
           await this.pc.setLocalDescription(offer);
           this.sendSignal({ description: this.pc.localDescription });
        }
        return true;
      }
    } catch (err) {
      this.onLog(`Voice Hardware Error: ${err.name}`, "error");
      return false;
    }
  }

  sendCallSignal(action) {
     this.sendSignal({ callAction: action });
  }

  close() {
    if (this.localStream) this.localStream.getTracks().forEach((t) => t.stop());
    if (this.dataChannel) this.dataChannel.close();
    if (this.pc) this.pc.close();
    this.onStatus("disconnected");
  }
}
