export class CallHandler {
  constructor(pc, sendSignal, onLog, onStatus) {
    this.pc = pc;
    this.sendSignal = sendSignal;
    this.onLog = onLog;
    this.onStatus = onStatus;
    this.localStream = null;
    this.callTimeout = null;
    this.isIncoming = false;
  }

  async initiate() {
    this.onLog("Provisioning voice link...", "info");
    this.isIncoming = false;
    this.sendSignal({ callAction: "CALL_INITIATE" });
    this.startTTL("CANCEL", 20000);
    return await this.activate();
  }

  async activate() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.localStream = stream;
      stream.getTracks().forEach((t) => this.pc.addTrack(t, stream));

      if (this.pc.signalingState === "stable") {
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this.sendSignal({ description: this.pc.localDescription });
      }
      return true;
    } catch (err) {
      this.onLog(`Voice Hardware Error: ${err.name}`, "error");
      this.clearTTL();
      return false;
    }
  }

  handleIncomingCall(data) {
    this.isIncoming = true;
    this.onStatus("incoming-call", data);
    this.startTTL("REJECT", 20000);
  }

  handleAccepted() {
    this.clearTTL();
    this.onStatus("call-accepted");
  }

  handleRejected() {
    this.clearTTL();
    this.onStatus("call-rejected");
    this.stop();
  }

  accept() {
    this.clearTTL();
    this.sendSignal({ callAction: "ACCEPT" });
  }

  reject() {
    this.clearTTL();
    this.sendSignal({ callAction: "REJECT" });
    this.stop();
  }

  stop() {
    this.clearTTL();
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    this.pc.getSenders().forEach((s) => {
      if (s.track?.kind === "audio") {
        try { this.pc.removeTrack(s); } catch (e) {}
      }
    });
  }

  startTTL(autoAction, duration = 20000) {
    this.clearTTL();
    this.callTimeout = setTimeout(() => {
      this.onLog(`Signal Link Timeout: ${duration / 1000}s Threshold Reached`, "warning");
      if (autoAction === "CANCEL") this.cancel();
      else if (autoAction === "REJECT") this.reject();
      this.onStatus("call-timeout");
    }, duration);
  }

  cancel() {
    this.clearTTL();
    this.sendSignal({ callAction: "CANCEL" });
    this.stop();
  }

  sendCallSignal(a) {
    switch (a) {
      case "ACCEPT": this.accept(); break;
      case "REJECT": this.reject(); break;
      case "CANCEL": this.cancel(); break;
      case "END": this.stop(); this.sendSignal({ callAction: "END" }); break;
    }
  }

  clearTTL() {
    if (this.callTimeout) {
      clearTimeout(this.callTimeout);
      this.callTimeout = null;
    }
  }
}
