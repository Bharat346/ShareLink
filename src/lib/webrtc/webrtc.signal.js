/**
 * webrtc.signal.js - Signaling / Perfect Negotiation
 * Handles offer/answer exchange with collision detection.
 */

export function setupNegotiation(pc, sendSignal, state) {
  pc.onnegotiationneeded = async () => {
    try {
      state.makingOffer = true;
      await pc.setLocalDescription();
      sendSignal({ description: pc.localDescription });
    } catch (err) {
      console.error("Negotiation Error:", err);
    } finally {
      state.makingOffer = false;
    }
  };
}

export async function handleDescription(pc, description, sendSignal, state) {
  try {
    const offerCollision =
      description.type === "offer" &&
      (state.makingOffer || pc.signalingState !== "stable");

    state.ignoreOffer = !state.polite && offerCollision;
    if (state.ignoreOffer) return;

    await pc.setRemoteDescription(description);
    if (description.type === "offer") {
      await pc.setLocalDescription();
      sendSignal({ description: pc.localDescription });
    }
  } catch (err) {
    console.error("Handle Description Error:", err);
  }
}
