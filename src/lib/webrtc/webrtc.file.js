export class FileHandler {
  constructor(dataChannel, onLog, onStatus, onProgress) {
    this.dataChannel = dataChannel;
    this.onLog = onLog;
    this.onStatus = onStatus;
    this.onProgress = onProgress;
    this.isSending = false;
    this.isReceiving = false;
    this.audioChunks = null;
    this.receivedChunks = null;
    this.currentFileStream = null;
    this.fileName = "";
    this.totalBytes = 0;
    this.receivedBytes = 0;
    this.pendingMetadata = null;
    this.writeQueue = [];
    this.isWriting = false;
    this.unackedBytes = 0;
    this.lastAckedBytes = 0;
    this.ackResolve = null;
    this.writtenBytes = 0;
    this.unackedWrittenBytes = 0;
  }

  async send(file) {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      this.onLog("Link Interface NOT_READY: Expression dropped", "error");
      return false;
    }

    this.isSending = true;
    this.unackedBytes = 0;
    this.lastAckedBytes = 0;
    this.ackResolve = null;
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
      this.isSending = false;
      return false;
    }

    this.onLog("Link synced. Streaming binary...", "success");
    const reader = file.stream().getReader();
    const CHUNK_SIZE = 64 * 1024; // Increased chunk size to 64KB for better throughput
    let loaded = 0;

    // Set threshold so the bufferedamountlow event fires when buffer drops below 2MB
    this.dataChannel.bufferedAmountLowThreshold = 2 * 1024 * 1024; 

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        let offset = 0;
        while (offset < value.byteLength) {
          while (this.dataChannel.bufferedAmount > 4 * 1024 * 1024) {
            if (this.dataChannel.readyState !== "open") throw new Error("Link Lost");
            await new Promise((resolve) => {
              let timeoutId;
              const onLow = () => {
                this.dataChannel.removeEventListener("bufferedamountlow", onLow);
                clearTimeout(timeoutId);
                resolve();
              };
              this.dataChannel.addEventListener("bufferedamountlow", onLow);
              
              // Fallback to prevent deadlocks, check again after 1s
              timeoutId = setTimeout(() => {
                this.dataChannel.removeEventListener("bufferedamountlow", onLow);
                resolve();
              }, 1000); 
            });
          }

          // Application-level flow control (Sliding Window)
          while (this.unackedBytes > 32 * 1024 * 1024) {
            if (this.dataChannel.readyState !== "open") throw new Error("Link Lost");
            await new Promise((resolve) => {
              this.ackResolve = resolve;
              setTimeout(() => {
                if (this.ackResolve) {
                  this.ackResolve();
                  this.ackResolve = null;
                }
              }, 3000); // 3s fallback if ACK is lost
            });
          }

          if (this.dataChannel.readyState !== "open") throw new Error("Link Lost");
          const chunk = value.slice(offset, offset + CHUNK_SIZE);
          this.dataChannel.send(chunk);
          offset += chunk.byteLength;
          loaded += chunk.byteLength;
          this.unackedBytes += chunk.byteLength;
          this.onProgress((loaded / file.size) * 100);
        }
      }
      this.dataChannel.send(JSON.stringify({ type: "END_TRANSFER" }));
      this.onLog("File dispersal complete", "success");
      this.onStatus("connected");
      this.onProgress(0);
      return true;
    } catch (err) {
      this.onLog(`Transfer Failed: ${err.message}`, "error");
      this.onStatus("connected");
      return false;
    } finally {
      this.isSending = false;
      reader.releaseLock();
    }
  }

  handleStart(metadata) {
    this.pendingMetadata = metadata;
    this.onLog(`Incoming payload: ${metadata.fileName}`, "info");
    this.onStatus("file-request-received", metadata);
  }

  handleAudioStart(metadata) {
    this.fileName = metadata.fileName;
    this.totalBytes = metadata.fileSize;
    this.receivedBytes = 0;
    this.writtenBytes = 0;
    this.unackedWrittenBytes = 0;
    this.isReceiving = true;
    this.audioChunks = [];
    this.onLog(`Buffering Audio Link: ${this.fileName}`, "info");
    this.onStatus("transferring");
    this.dataChannel.send(JSON.stringify({ type: "ACCEPT_TRANSFER" }));
  }

  async accept() {
    if (!this.pendingMetadata) return;
    const metadata = this.pendingMetadata;
    this.totalBytes = metadata.fileSize;
    this.receivedBytes = 0;
    this.writtenBytes = 0;
    this.unackedWrittenBytes = 0;
    this.isReceiving = true;
    this.fileName = metadata.fileName;
    this.receivedChunks = [];

    if (typeof window.showSaveFilePicker === "function" && window.isSecureContext) {
      try {
        const handle = await window.showSaveFilePicker({ suggestedName: this.fileName });
        this.currentFileStream = await handle.createWritable();
        this.fileName = handle.name;
        this.receivedChunks = null;
        this.onLog("Streaming directly to disk enabled", "success");
      } catch (e) {
        this.onLog("Save cancelled or failed. Buffering in memory instead (may crash on large files)", "warning");
        console.warn("Picker failed, using memory buffer", e);
      }
    } else {
      this.onLog("Direct disk write not supported by browser or HTTP. Buffering in memory...", "warning");
    }

    this.onStatus("transferring");
    this.dataChannel.send(JSON.stringify({ type: "ACCEPT_TRANSFER" }));
  }

  handleAccept() {
    if (this.acceptanceResolve) {
      this.acceptanceResolve(true);
      this.acceptanceResolve = null;
    }
    this.onStatus("transferring");
  }

  handleReject() {
    if (this.acceptanceResolve) {
      this.acceptanceResolve(false);
      this.acceptanceResolve = null;
    }
    this.onStatus("connected");
  }

  handleFileAck(metadata) {
    if (metadata.bytes > this.lastAckedBytes) {
      this.unackedBytes -= (metadata.bytes - this.lastAckedBytes);
      this.lastAckedBytes = metadata.bytes;
    }
    if (this.unackedBytes <= 32 * 1024 * 1024 && this.ackResolve) {
      this.ackResolve();
      this.ackResolve = null;
    }
  }

  async handleChunk(data) {
    if (!this.isReceiving) return;
    if (this.currentFileStream) {
      this.writeQueue.push(data);
      this.processWriteQueue();
    } else if (this.audioChunks || this.receivedChunks) {
      if (this.audioChunks) this.audioChunks.push(new Uint8Array(data));
      else this.receivedChunks.push(new Uint8Array(data));
      
      this.writtenBytes += data.byteLength;
      this.unackedWrittenBytes += data.byteLength;
      if (this.unackedWrittenBytes > 8 * 1024 * 1024) {
        if (this.dataChannel.readyState === "open") {
          this.dataChannel.send(JSON.stringify({ type: "FILE_ACK", bytes: this.writtenBytes }));
        }
        this.unackedWrittenBytes = 0;
      }
    }
    this.receivedBytes += data.byteLength;
    this.onProgress((this.receivedBytes / this.totalBytes) * 100);
  }

  async processWriteQueue() {
    if (this.isWriting || this.writeQueue.length === 0) return;
    this.isWriting = true;
    try {
      while (this.writeQueue.length > 0) {
        const chunk = this.writeQueue.shift();
        await this.currentFileStream.write(chunk);
        
        this.writtenBytes += chunk.byteLength;
        this.unackedWrittenBytes += chunk.byteLength;
        
        if (this.unackedWrittenBytes > 8 * 1024 * 1024) {
          if (this.dataChannel.readyState === "open") {
            this.dataChannel.send(JSON.stringify({ type: "FILE_ACK", bytes: this.writtenBytes }));
          }
          this.unackedWrittenBytes = 0;
        }
      }
    } catch (e) {
      this.onLog(`Disk Write Error: ${e.message}`, "error");
    } finally {
      this.isWriting = false;
    }
  }

  async finish() {
    if (this.currentFileStream) {
      while (this.isWriting || this.writeQueue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      await this.currentFileStream.close();
      this.currentFileStream = null;
    } else if (this.audioChunks) {
      const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
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
    }
    this.onLog("Binary payload reconstructed", "success");
    this.isReceiving = false;
    this.onProgress(0);
    this.onStatus("connected");
    this.pendingMetadata = null;
  }
}
