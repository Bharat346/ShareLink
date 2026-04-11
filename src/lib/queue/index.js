/**
 * MessageQueue - Reliable delivery system for Web
 * Sync'd with mobile version 2.0
 */

export class MessageQueue {
  constructor(sendFn) {
    this.queue = [];
    this.sendFn = sendFn;
    this.isProcessing = false;
    this.onProcessed = null;
    this.isPaused = false;
    this.maxRetries = 3;
    this.retryDelay = 500;
  }

  enqueue(data, priority = "normal") {
    const item = {
      id: data.id || crypto.randomUUID(),
      data,
      priority,
      status: "pending",
      retries: 0,
      createdAt: Date.now(),
    };

    if (priority === "high") {
      const idx = this.queue.findIndex(q => q.status !== "processing" && q.priority !== "high");
      if (idx === -1) this.queue.push(item);
      else this.queue.splice(idx, 0, item);
    } else {
      this.queue.push(item);
    }

    if (!this.isProcessing) this.processQueue();
    return item.id;
  }

  markAsAcknowledged(id) {
    const item = this.queue.find(q => q.id === id);
    if (item && item.status === "processing") {
      item.status = "completed";
      if (this.queue[0]?.id === id) {
        this.queue.shift();
        if (this.onProcessed) this.onProcessed(item);
        this.processQueue();
      } else {
        this.queue = this.queue.filter(q => q.id !== id);
        if (this.onProcessed) this.onProcessed(item);
      }
    }
  }

  async processQueue() {
    if (this.isProcessing || this.isPaused || !this.sendFn) return;
    this.isProcessing = true;

    while (this.queue.length > 0 && !this.isPaused) {
      const item = this.queue[0];
      if (!item || ["completed", "failed"].includes(item.status)) {
        this.queue.shift();
        continue;
      }

      if (item.status === "processing" && item.data.requiresAck) {
        this.isProcessing = false;
        return;
      }

      item.status = "processing";
      try {
        const success = await this.sendFn(item.data);
        if (success) {
          if (!item.data.requiresAck) {
            item.status = "completed";
            this.queue.shift();
            if (this.onProcessed) this.onProcessed(item);
          } else {
            this.isProcessing = false;
            setTimeout(() => {
              if (item.status === "processing") {
                item.status = "pending";
                this.processQueue();
              }
            }, 5000);
            return;
          }
        } else {
          throw new Error("Send failed");
        }
      } catch (err) {
        item.retries++;
        if (item.retries >= this.maxRetries) {
          item.status = "failed";
          this.queue.shift();
        } else {
          item.status = "pending";
          this.isProcessing = false;
          setTimeout(() => this.processQueue(), this.retryDelay * Math.pow(2, item.retries - 1));
          return;
        }
      }
    }
    this.isProcessing = false;
  }
}
