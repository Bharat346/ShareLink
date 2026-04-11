/**
 * webrtc.signal.js - Signaling / Perfect Negotiation
 * Handles offer/answer exchange with collision detection.
 */

export function setupNegotiation(pc, sendSignal, state) {
  pc.onnegotiationneeded = async () => {
    try {
      state.makingOffer = true;
      const offer = await pc.createOffer();
      
      // Munge SDP for better audio quality
      let sdp = offer.sdp;
      sdp = sdp.replace(/a=fmtp:111 (.*)/g, 'a=fmtp:111 $1;maxaveragebitrate=65536;useinbandfec=1;usedtx=0');
      
      await pc.setLocalDescription({ type: 'offer', sdp });
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
      const answer = await pc.createAnswer();
      
      // Munge SDP for better audio quality
      let sdp = answer.sdp;
      sdp = sdp.replace(/a=fmtp:111 (.*)/g, 'a=fmtp:111 $1;maxaveragebitrate=65536;useinbandfec=1;usedtx=0');
      
      await pc.setLocalDescription({ type: 'answer', sdp });
      sendSignal({ description: pc.localDescription });
    }
  } catch (err) {
    console.error("Handle Description Error:", err);
  }
}
