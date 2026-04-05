// Simple UUID alternative since uuid may not work in RN without crypto polyfill
export function generateId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 10)
  );
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatTime(timestamp) {
  const d = new Date(timestamp);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function truncateString(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
}

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

// Chunk an ArrayBuffer into smaller pieces
export function chunkArrayBuffer(buffer, chunkSize) {
  const chunks = [];
  const view = new Uint8Array(buffer);

  for (let i = 0; i < view.byteLength; i += chunkSize) {
    chunks.push(view.slice(i, i + chunkSize).buffer);
  }

  return chunks;
}

// Reassemble chunks back
export function reassembleChunks(chunks) {
  const totalLength = chunks.reduce((acc, c) => acc + c.byteLength, 0);
  const result = new Uint8Array(totalLength);

  let offset = 0;

  for (const chunk of chunks) {
    result.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }

  return result.buffer;
}

export const CHUNK_SIZE = 16 * 1024; // 16KB chunks
export const MAX_BUFFER_SIZE = 4 * 1024 * 1024; // 4MB backpressure threshold
// export const BLE_MTU = 512; // BLE MTU size