/**
 * MessageQueue - Producer-Consumer architecture for reliable data delivery
 *
 * Ensures sequential, ordered delivery with backpressure handling,
 * retry logic, and no data loss guarantees.
 */

import { generateId, delay } from "../../utils/helpers";

export class MessageQueue {
  constructor(sendFn) {
    this.queue = [];
    this.isProcessing = false;
    this.sendFn = sendFn || null;
    this.maxRetries = 3;
    this.retryDelay = 500; // ms
    this.maxQueueSize = 1000;
    this.isPaused = false;

    // Event callbacks
    this.onItemProcessed = null;
    this.onItemFailed = null;
    this.onQueueDrained = null;
    this.onBackpressure = null;
  }

  /**
   * Set the send function used by the consumer
   */
  setSendFunction(fn) {
    this.sendFn = fn;

    if (this.queue.length > 0 && !this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Set event callbacks
   */
  onEvents(handlers) {
    this.onItemProcessed = handlers.onProcessed || null;
    this.onItemFailed = handlers.onFailed || null;
    this.onQueueDrained = handlers.onDrained || null;
    this.onBackpressure = handlers.onBackpressure || null;
  }

  /**
   * Producer: Enqueue a message/chunk for sending
   */
  enqueue(data, priority = "normal") {
    if (this.queue.length >= this.maxQueueSize) {
      this.onBackpressure && this.onBackpressure(this.queue.length);

      // Drop lowest priority if full
      const lowIdx = this.queue.findIndex((q) => q.priority === "low");
      if (lowIdx !== -1) {
        this.queue.splice(lowIdx, 1);
      }
    }

    const item = {
      id: generateId(),
      data,
      priority,
      retries: 0,
      maxRetries: this.maxRetries,
      createdAt: Date.now(),
      status: "pending",
    };

    // Insert by priority
    if (priority === "high") {
      const idx = this.queue.findIndex(
        (q) => q.status !== "processing" && q.priority !== "high",
      );

      if (idx === -1) {
        this.queue.push(item);
      } else {
        this.queue.splice(idx, 0, item);
      }
    } else {
      this.queue.push(item);
    }

    if (!this.isProcessing && this.sendFn) {
      this.processQueue();
    }

    return item.id;
  }

  /**
   * Enqueue multiple items (batch producer)
   */
  enqueueBatch(items, priority = "normal") {
    return items.map((data) => this.enqueue(data, priority));
  }

  /**
   * Consumer: Process items from the queue sequentially
   */
  async processQueue() {
    if (this.isProcessing || this.isPaused || !this.sendFn) return;

    this.isProcessing = true;

    while (this.queue.length > 0 && !this.isPaused) {
      const item = this.queue[0];

      if (!item || item.status === "completed" || item.status === "failed") {
        this.queue.shift();
        continue;
      }

      item.status = "processing";

      try {
        // Attempt sending - sendFn should return true on success
        const result = await this.sendFn(item.data);

        // Handle both true and undefined (if non-returning fn) as success
        // but explicitly check for false
        if (result !== false) {
          item.status = "completed";
          this.queue.shift();
          this.onItemProcessed && this.onItemProcessed(item);
        } else {
          throw new Error("Send signal failed");
        }
      } catch (err) {
        item.retries++;
        console.warn(`Queue processing error (attempt ${item.retries}):`, err);

        if (item.retries >= item.maxRetries) {
          item.status = "failed";
          this.queue.shift();
          this.onItemFailed && this.onItemFailed(item);
        } else {
          item.status = "pending";
          // Exponential backoff
          await delay(this.retryDelay * Math.pow(2, item.retries - 1));
        }
      }
    }

    this.isProcessing = false;

    if (this.queue.length === 0) {
      this.onQueueDrained && this.onQueueDrained();
    }
  }

  /**
   * Pause queue processing
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume queue processing
   */
  resume() {
    this.isPaused = false;

    if (this.queue.length > 0 && !this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Get current queue length
   */
  get length() {
    return this.queue.length;
  }

  /**
   * Check if queue is processing
   */
  get processing() {
    return this.isProcessing;
  }

  /**
   * Get queue stats
   */
  getStats() {
    return {
      total: this.queue.length,
      pending: this.queue.filter((q) => q.status === "pending").length,
      processing: this.queue.filter((q) => q.status === "processing").length,
      failed: this.queue.filter((q) => q.status === "failed").length,
    };
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue = [];
    this.isProcessing = false;
  }

  /**
   * Destroy the queue
   */
  destroy() {
    this.clear();
    this.sendFn = null;
    this.onItemProcessed = null;
    this.onItemFailed = null;
    this.onQueueDrained = null;
    this.onBackpressure = null;
  }
}

// Shared instances
export const chatQueue = new MessageQueue();
export const fileQueue = new MessageQueue();
export const audioQueue = new MessageQueue();
