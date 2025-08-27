# WebSocket File Sharing Server with VPN IP Assignment

This project implements a **WebSocket-based file-sharing server** with a VPN-style virtual IP system. It allows sending files between clients over WebSockets in **chunks** and supports **client-side downloads** to user-chosen folders using the **File System Access API**.

---

## Features

* Assigns a **virtual VPN IP** to each connected client.
* Supports **sender and receiver roles**.
* Handles **file transfers in chunks**, enabling large file streaming.
* Implements **session-based transfers** for multiple receivers.
* Avoids overwriting files by allowing **duplicate file names with indexing** on the client-side.
* Provides **pipeline architecture** for chunk handling.
* Allows **client-side saving** of files using `showSaveFilePicker`.
* Logs connection, transfer, and error events.
* Handles **automatic cleanup** of old server-side resources (optional).

---

## File Structure

```
project-root/
│
├─ server.js             # WebSocket server code (all-in-one)
├─ package.json
├─ package-lock.json
│   
└─ client/               # Your React app folder
    ├─ src/
    │   ├─ components/
    │   │   ├─ Receiver.jsx   # File receiver component
    │   │   └─ ProgressBar.jsx
    │   └─ context/
    │       ├─ WSContext.js   # WebSocket context
    │       └─ LogContext.js  # Logging context
    └─ package.json
```

---

## Requirements

* Node.js v16+
* NPM or Yarn
* Modern browser with **File System Access API** (Chrome, Edge, Opera)

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ws-file-share.git
cd ws-file-share
```

2. Install dependencies:

```bash
npm install
```

---

## Running the Server

Start the WebSocket server:

```bash
node server.js
```

---

## Client Usage

1. Connect to the server via the React app.
2. Sender selects a file and sends it in chunks.
3. Receiver gets the file in real-time and can choose a folder to save it:

```javascript
const [fileHandle] = await window.showSaveFilePicker({ suggestedName: fileName });
const writable = await fileHandle.createWritable();
await writable.write(fileData);
await writable.close();
```

4. Files are saved without overwriting existing files. Indexes are appended if duplicates exist.

---

## Logging

* Server logs client connections, IP assignments, session creation, file transfers, and errors.
* Client logs download progress and transfer events.

---

## Notes

* Works best with modern browsers that support the **File System Access API**.
* Files can be sent between clients even if the client machine is on a different network (via WebSocket server).
* Server maintains pipeline architecture to handle large file transfers efficiently.
* Duplicate files are saved with an index to prevent overwriting.

