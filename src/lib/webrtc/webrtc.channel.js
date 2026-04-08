/**
 * webrtc.channel.js - DataChannel management
 * Handles creation, incoming detection, and message routing.
 */

import { ChatHandler } from "./webrtc.chat";
import { FileHandler } from "./webrtc.file";

export function createDataChannel(pc, onLog) {
  onLog("Provisioning Data Channel...", "info");
  return pc.createDataChannel("fileTransfer", { ordered: true });
}

export function setupDataChannel(channel, onLog, onStatus, onProgress, chatRef, fileRef) {
  channel.binaryType = "arraybuffer";

  const chat = new ChatHandler(channel, onLog, onStatus);
  const file = new FileHandler(channel, onLog, onStatus, onProgress);

  chatRef.current = chat;
  fileRef.current = file;

  channel.onopen = () => {
    onLog("P2P Data Link: SECURE", "success");
    onStatus("connected");
  };

  channel.onmessage = async (event) => {
    if (typeof event.data === "string") {
      const metadata = JSON.parse(event.data);
      switch (metadata.type) {
        case "CHAT": chat.handleIncoming(metadata); break;
        case "START_TRANSFER": file.handleStart(metadata); break;
        case "AUDIO_MSG": file.handleAudioStart(metadata); break;
        case "ACCEPT_TRANSFER": file.handleAccept(); break;
        case "REJECT_TRANSFER": file.handleReject(); break;
        case "END_TRANSFER": await file.finish(); break;
      }
    } else {
      await file.handleChunk(event.data);
    }
  };

  channel.onclose = () => {
    onLog("Data Link Suspended", "warning");
  };

  return { chat, file };
}
