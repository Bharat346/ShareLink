/**
 * webrtc.call.js - Voice call management
 *
 * FIXES:
 * - Single active call enforcement (prevents duplicate mic streams)
 * - Proper stream cleanup (stops ALL tracks on disconnect)
 * - Device selection guard (catches mic-in-use errors)
 * - Race condition prevention via isActivating flag
 */

export class CallHandler {
  constructor(pc, sendSignal, onLog, onStatus) {
    this.pc = pc;
    this.sendSignal = sendSignal;
    this.onLog = onLog;
    this.onStatus = onStatus;
    this.localStream = null;
    this.callTimeout = null;
    this.isIncoming = false;
    this.isActivating = false; // Prevents concurrent activate() calls
  }

  /**
   * Initiate an outgoing call
   * Guards against duplicate initiation
   */
  async initiate() {
    if (this.isActivating || this.localStream) {
      this.onLog("Call already in progress or activating", "warning");
      return false;
    }

    this.onLog("Provisioning voice link...", "info");
    this.isIncoming = false;
    this.sendSignal({ callAction: "CALL_INITIATE" });
    this.startTTL("CANCEL", 20000);
    return true;
  }

  /**
   * Activate microphone and add tracks to peer connection
   * FIXED: Prevents duplicate getUserMedia calls via isActivating flag
   */
  /**
   * Activate microphone and add tracks to peer connection
   * FIXED: Prevents duplicate getUserMedia calls via isActivating flag
   * FIXED: Added high-quality audio constraints for echo/noise cancellation
   */
  async activate() {
    if (this.isActivating) {
      this.onLog("Mic activation already in progress", "warning");
      return false;
    }

    this.isActivating = true;

    try {
      // Clean up any existing stream before starting new one
      this._stopLocalTracks();

      // production-grade audio constraints for noise/echo reduction
      const constraints = {
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          // Chrome-specific constraints for improved noise handling
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true,
          googAudioMirroring: false,
          sampleRate: { ideal: 48000 },
          channelCount: { ideal: 1 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;

      const existing = this.pc
        .getSenders()
        .find((s) => s.track && s.track.kind === "audio");

      if (existing) {
        this.onLog("Audio sender already exists", "warning");
        return false;
      }
      
      stream.getTracks().forEach((t) => this.pc.addTrack(t, stream));

      // If we are answering an incoming call, send ACCEPT signal
      if (this.isIncoming) {
        this.sendSignal({ callAction: "ACCEPT" });
      }

      // if (this.pc.signalingState === "stable") {
      //   const offer = await this.pc.createOffer();
      //   await this.pc.setLocalDescription(offer);
      //   this.sendSignal({ description: this.pc.localDescription });
      // }
      return true;
    } catch (err) {
      // ... same error handling ...
      if (err.name === "NotAllowedError") {
        this.onLog("Microphone permission denied", "error");
      } else if (err.name === "NotFoundError") {
        this.onLog("No microphone found on device", "error");
      } else if (err.name === "NotReadableError") {
        this.onLog("Microphone already in use by another application", "error");
      } else {
        this.onLog(
          `Voice Hardware Error: ${err.name} - ${err.message}`,
          "error",
        );
      }
      this.clearTTL();
      return false;
    } finally {
      this.isActivating = false;
    }
  }

  handleIncomingCall(data) {
    if (this.localStream || this.isActivating) {
      this.onLog("Already in a call, auto-rejecting incoming", "warning");
      this.sendSignal({ callAction: "REJECT" });
      return;
    }
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

  /**
   * Stop all audio tracks and remove senders
   * FIXED: Thorough cleanup of both local stream and PC senders
   */
  stop() {
    this.clearTTL();
    this._stopLocalTracks();
    this._removeAudioSenders();
    this.isActivating = false;
  }

  /**
   * Stop local media tracks
   */
  _stopLocalTracks() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (e) {
          /* track already stopped */
        }
      });
      this.localStream = null;
    }
  }

  /**
   * Remove audio senders from peer connection
   */
  _removeAudioSenders() {
    if (!this.pc) return;
    try {
      this.pc.getSenders().forEach((s) => {
        if (s.track?.kind === "audio") {
          try {
            this.pc.removeTrack(s);
          } catch (e) {
            /* sender already removed */
          }
        }
      });
    } catch (e) {
      // PC might be closed
    }
  }

  startTTL(autoAction, duration = 20000) {
    this.clearTTL();
    this.callTimeout = setTimeout(() => {
      this.onLog(
        `Signal Link Timeout: ${duration / 1000}s Threshold Reached`,
        "warning",
      );
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
      case "ACCEPT":
        this.accept();
        break;
      case "REJECT":
        this.reject();
        break;
      case "CANCEL":
        this.cancel();
        break;
      case "END":
        this.stop();
        this.sendSignal({ callAction: "END" });
        break;
    }
  }

  clearTTL() {
    if (this.callTimeout) {
      clearTimeout(this.callTimeout);
      this.callTimeout = null;
    }
  }
}
