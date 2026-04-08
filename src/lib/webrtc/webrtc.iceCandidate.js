/**
 * webrtc.iceCandidate.js - ICE candidate handling
 * Manages ICE candidate generation and remote candidate addition.
 */

export function setupIceCandidateHandler(pc, sendSignal) {
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      sendSignal({ candidate: event.candidate });
    }
  };
}

export async function addIceCandidate(pc, candidate, ignoreOffer) {
  try {
    await pc.addIceCandidate(candidate);
  } catch (err) {
    if (!ignoreOffer) console.error("Ice Candidate Error:", err);
  }
}
