/**
 * useCallActions.js - Voice call state management
 */

import { toast } from "react-hot-toast";

export function stopCallLocally(rtcRef, setIsCallActive, setIsIncomingCall, setIsOutgoingCall, setIncomingStream, remoteAudioRef) {
  if (rtcRef.current && rtcRef.current.localStream) {
    rtcRef.current.localStream.getTracks().forEach((t) => t.stop());
    rtcRef.current.localStream = null;
  }
  setIsCallActive(false);
  setIsIncomingCall(false);
  setIsOutgoingCall(false);
  setIncomingStream(null);
  if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
}

export async function acceptCall(incomingStream, remoteAudioRef, rtcRef, setIsCallActive, setIsIncomingCall, setIsOutgoingCall) {
  if (incomingStream && remoteAudioRef.current) {
    toast("Activating Local Feed...", { icon: "🎙️" });
    
    // Safety: ensure we are in incoming state before activating
    if (rtcRef.current?.call) {
      rtcRef.current.call.isIncoming = true;
    }
    
    const micSuccess = await rtcRef.current?.toggleAudio();

    if (!micSuccess) {
      toast.error("Link Failed: Mic Access Denied", { icon: "🚫" });
      return;
    }

    setIsCallActive(true);
    setIsIncomingCall(false);
    setIsOutgoingCall(false);
    // Note: toggleAudio already handles the signaling ACCEPT if it isIncoming
  }
}

export function rejectCall(rtcRef, stopCallLocallyFn) {
  rtcRef.current?.sendCallSignal("REJECT");
  stopCallLocallyFn();
}

export async function toggleCall(rtcRef, isCallActive, isOutgoingCall, setIsOutgoingCall, stopCallLocallyFn) {
  if (rtcRef.current) {
    if (isCallActive || isOutgoingCall) {
      rtcRef.current.sendCallSignal(isOutgoingCall ? "CANCEL" : "END");
      stopCallLocallyFn();
    } else {
      toast("Requesting Microphone Permission...", { icon: "🎙️" });
      const success = await rtcRef.current.toggleAudio();
      if (success) {
        setIsOutgoingCall(true);
        toast.success("Voice Handshake Synchronized", { icon: "📟" });
      } else {
        toast.error("Bridge Offline: Voice Hardware Denied");
      }
    }
  }
}
