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
  }

  async send(file) {
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
      this.isSending = false;
      return false;
    }

    this.onLog("Link synced. Streaming binary...", "success");
    const reader = file.stream().getReader();
    const CHUNK_SIZE = 16 * 1024;
    let loaded = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        let offset = 0;
        while (offset < value.byteLength) {
          if (this.dataChannel.readyState !== "open") throw new Error("Link Lost");

          if (this.dataChannel.bufferedAmount > 4 * 1024 * 1024) {
            await new Promise((r) => {
              const onLow = () => {
                this.dataChannel.removeEventListener("bufferedamountlow", onLow);
                r();
              };
              this.dataChannel.addEventListener("bufferedamountlow", onLow);
              setTimeout(r, 50);
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
    this.isReceiving = true;
    this.fileName = metadata.fileName;
    this.receivedChunks = [];

    if (typeof window.showSaveFilePicker === "function" && window.isSecureContext) {
      try {
        const handle = await window.showSaveFilePicker({ suggestedName: this.fileName });
        this.currentFileStream = await handle.createWritable();
        this.fileName = handle.name;
        this.receivedChunks = null;
      } catch (e) {
        console.warn("Picker failed, using memory buffer");
      }
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

  async finish() {
    if (this.currentFileStream) {
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
