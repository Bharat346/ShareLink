/**
 * useRTCHandler.js - RTC status normalization and message routing
 *
 * FIXES:
 * - Message deduplication (prevents duplicate messages on reconnect)
 * - ACK handling (updates message status to 'delivered')
 * - Consistent status normalization
 */

import { toast } from "react-hot-toast";

// useRTCHandler.js - RTC status normalization and message routing

export function handleRTCStatus(s, details, setStatus, setMessages, peerAlias, onAck) {
  let normalized = s.replace("rtc-", "");
  setStatus(normalized);

  if (normalized === "connected") {
    toast.success("E2EE Connection Secured");
  }

  if (normalized === "chat-received") {
    setMessages((prev) => {
      // Pure deduplication (Safe for React concurrent/strict mode)
      if (details.id && prev.some((m) => m.id === details.id)) {
        console.warn(`[P2P] UI Drop (Dedupe): ${details.id.slice(0, 6)}`);
        return prev;
      }
      
      console.log(`[P2P] UI Commit: CHAT [${details.id?.slice(0, 6) || "NO_ID"}]`);
      return [...prev, { ...details, side: "remote", sender: details.alias || peerAlias }];
    });
  }

  // Handle delivery acknowledgments
  if (normalized === "message-ack") {
    const msgId = details.id || details.messageId;
    if (onAck && msgId) onAck(msgId);
    
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.side === "local"
          ? { ...m, delivered: true }
          : m,
      ),
    );
  }

  if (normalized === "file-request-received") {
    setMessages((prev) => [
      ...prev,
      { ...details, type: "file-request", side: "remote", sender: details.alias || peerAlias },
    ]);
    toast(`Incoming File: ${details.fileName}`, { icon: "📂" });
  }

  if (normalized === "file-received") {
    setMessages((prev) => {
      const index = prev.findLastIndex((m) => m.fileName === details.fileName);
      if (index !== -1) {
        const newMessages = [...prev];
        newMessages[index] = { ...newMessages[index], url: details.url, isTransferring: false };
        return newMessages;
      }
      return prev;
    });
    toast.success(`Received: ${details.fileName}`);
  }

  if (normalized === "audio-received") {
    setMessages((prev) => {
      const index = prev.findLastIndex((m) => m.fileName === details.fileName);
      if (index !== -1) {
        const newMessages = [...prev];
        newMessages[index] = { ...newMessages[index], url: details.url, isTransferring: false };
        return newMessages;
      }
      return [
        ...prev,
        {
          type: "audio-note",
          url: details.url,
          fileName: details.fileName,
          side: "remote",
          sender: details.alias || peerAlias,
          time: new Date().toLocaleTimeString(),
        },
      ];
    });
  }

  if (normalized === "transfer-complete") {
    toast.success("Transfer Completed");
  }
}

export function waitForConnection(rtcRef) {
  return new Promise((resolve, reject) => {
    const pc = rtcRef.current?.pc;
    if (!pc) return reject(new Error("RTC_NOT_INIT"));

    if (pc.connectionState === "connected") return resolve();
    if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
      return reject(new Error(`Handshake aborted: ${pc.connectionState}`));
    }

    const checkState = () => {
      const state = pc.connectionState;
      if (state === "connected") {
        pc.removeEventListener("connectionstatechange", checkState);
        resolve();
      } else if (["failed", "closed", "disconnected"].includes(state)) {
        pc.removeEventListener("connectionstatechange", checkState);
        reject(new Error(`Handshake failed: ${state}`));
      }
    };

    pc.addEventListener("connectionstatechange", checkState);
    setTimeout(() => {
      pc.removeEventListener("connectionstatechange", checkState);
      if (pc.connectionState !== "connected") reject(new Error("Handshake Timeout"));
    }, 15000);
  });
}

/**
 * Clear seen message IDs (call on session reset)
 */
export function clearMessageDedup() {
  // Pure array check is now used.
}
