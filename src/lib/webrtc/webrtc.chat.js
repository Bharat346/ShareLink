/**
 * webrtc.chat.js - Chat message handling with delivery acknowledgments
 *
 * FIXES:
 * - Added ACK (acknowledgment) support for reliable message delivery
 * - Sender receives confirmation when peer processes the message
 * - Actually performs the send operation (was omitted)
 */

export class ChatHandler {
  constructor(dataChannel, onLog, onStatus) {
    this.dataChannel = dataChannel;
    this.onLog = onLog;
    this.onStatus = onStatus;
  }

  /**
   * Send a chat message over the data channel
   */
  send(message, alias, id) {
    if (this.dataChannel?.readyState === "open") {
      const msgId = id || crypto.randomUUID();
      const payload = {
        type: "CHAT",
        id: msgId,
        message,
        alias,
        time: new Date().toLocaleTimeString(),
      };

      try {
        this.dataChannel.send(JSON.stringify(payload));
        this.onLog(`Sent Expressive: ${message.slice(0, 15)}...`, "info");
        return { success: true, id: msgId };
      } catch (err) {
        this.onLog(`Chat transmit failure: ${err.message}`, "error");
        return { success: false };
      }
    }
    this.onLog("Chat Link Offline: Buffer dropped", "warning");
    return { success: false };
  }

  /**
   * Handle incoming chat message and send ACK back
   */
  handleIncoming(metadata) {
    this.onStatus("chat-received", metadata);

    // Send ACK back to sender for delivery confirmation
    if (this.dataChannel?.readyState === "open" && metadata.id) {
      try {
        // Use 'id' to match mobile/queue expectations
        this.dataChannel.send(JSON.stringify({
          type: "ACK",
          id: metadata.id,
          timestamp: Date.now(),
        }));
      } catch (err) {
        console.warn("Failed to send ACK:", err);
      }
    }
  }

  /**
   * Handle incoming ACK
   */
  handleAck(data) {
    // Both 'id' and 'messageId' supported for cross-compat
    const msgId = data.id || data.messageId;
    this.onStatus("message-ack", { messageId: msgId });
  }
}
