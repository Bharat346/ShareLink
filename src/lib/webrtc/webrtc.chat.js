export class ChatHandler {
  constructor(dataChannel, onLog, onStatus) {
    this.dataChannel = dataChannel;
    this.onLog = onLog;
    this.onStatus = onStatus;
  }

  send(message, alias, id) {
    if (this.dataChannel?.readyState === "open") {
      try {
        const payload = {
          type: "CHAT",
          id: id || crypto.randomUUID(),
          message,
          alias,
          time: new Date().toLocaleTimeString(),
        };
        this.dataChannel.send(JSON.stringify(payload));
        this.onLog(`Injected local expression: ${message.slice(0, 10)}...`, "info");
        return true;
      } catch (err) {
        this.onLog(`Signal Drop: ${err.message}`, "error");
        return false;
      }
    } else {
      this.onLog("Data Link Closed: Message dropped", "error");
      return false;
    }
  }

  handleIncoming(metadata) {
    this.onStatus("chat-received", metadata);
  }
}
