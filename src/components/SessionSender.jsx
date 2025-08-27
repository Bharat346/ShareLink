import React, { useState } from "react";
import { useWS } from "../context/WSContext";
import { useLog } from "../context/LogContext";
import { FiLink, FiLink2, FiUploadCloud, FiCopy, FiServer } from "react-icons/fi";
import { ProgressBar } from "./ProgressBar";
import "./SessionSender.css";

export const SessionSender = () => {
  const { ws, isConnected, connect, disconnect } = useWS();
  const { addLog } = useLog();
  const [sessionId, setSessionId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [sessionCreated, setSessionCreated] = useState(false);
  const [progress, setProgress] = useState(0);

  const CHUNK_SIZE = 1024 * 1024 * 5; // 5 MB per chunk

  const handleConnect = () => {
    connect();
    addLog("Connecting to server...", "info");
  };

  const handleDisconnect = () => {
    disconnect();
    addLog("Disconnected from server", "warning");
    setSessionCreated(false);
    setSessionId("");
    setSelectedFile(null);
    setProgress(0);
  };

  const createSession = () => {
    if (!isConnected) {
      addLog("Not connected to server", "error");
      return;
    }

    ws.send(JSON.stringify({ type: "create-session" }));
    addLog("Creating session...", "info");

    const messageHandler = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.type === "session-created") {
        setSessionId(data.sessionId);
        setSessionCreated(true);
        addLog(`Session created with ID: ${data.sessionId}`, "success");
        ws.removeEventListener("message", messageHandler);
      }
    };

    ws.addEventListener("message", messageHandler);
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    addLog("Session ID copied to clipboard", "info");
  };

  const sendFile = () => {
    if (!selectedFile) {
      addLog("Please select a file first", "error");
      return;
    }
    if (!sessionCreated) {
      addLog("Please create a session first", "error");
      return;
    }

    const file = selectedFile;
    let offset = 0;

    const reader = new FileReader();

    const readSlice = (o) => {
      const slice = file.slice(o, o + CHUNK_SIZE);
      reader.readAsDataURL(slice);
    };

    reader.onload = (e) => {
      ws.send(
        JSON.stringify({
          type: "file-chunk",
          chunk: e.target.result,
          fileName: file.name,
          done: offset + CHUNK_SIZE >= file.size,
          fileSize : file.size,
        })
      );

      offset += CHUNK_SIZE;
      const newProgress = Math.min((offset / file.size) * 100, 100);
      setProgress(newProgress);
      addLog(`Sending "${file.name}"... ${newProgress.toFixed(1)}%`, "info");

      if (offset < file.size) {
        readSlice(offset);
      } else {
        addLog(`File "${file.name}" fully sent`, "success");
        setSelectedFile(null);
        document.getElementById("session-file-input").value = "";
        setProgress(0);
      }
    };

    reader.onerror = () => {
      addLog(`Error reading file: ${file.name}`, "error");
    };

    addLog(`Sending file "${file.name}" in chunks...`, "info");
    readSlice(0);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      addLog(`Selected file: ${file.name}`, "info");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="session-sender-container-horizontal">
      {/* LEFT: Connection Card */}
      <div className="status-card">
        <div className="status-header">
          <div className={`status-dot ${isConnected ? "connected" : "disconnected"}`}></div>
          <h3>{isConnected ? "Connected" : "Disconnected"}</h3>
        </div>
        <div className="status-actions">
          <button className="btn connect-btn" onClick={handleConnect} disabled={isConnected}>
            <FiLink className="btn-icon" /> Connect
          </button>
          <button className="btn disconnect-btn" onClick={handleDisconnect} disabled={!isConnected}>
            <FiLink2 className="btn-icon" /> Disconnect
          </button>
        </div>
      </div>

      {/* RIGHT: Session & File Transfer Card */}
      <div className="session-sender-content">
        <h3>Session-based File Transfer</h3>
        
        <div className="session-controls">
          <button 
            className="btn create-session-btn" 
            onClick={createSession} 
            disabled={!isConnected || sessionCreated}
          >
            Create Session
          </button>

          {sessionId && (
            <div className="session-id-container">
              <label>Session ID:</label>
              <div className="session-id-display">
                <span className="session-id-value">{sessionId}</span>
                <button className="icon-btn copy-btn" onClick={copySessionId} title="Copy Session ID">
                  <FiCopy />
                </button>
              </div>
              <p className="session-help">
                Share this ID with the receiver to join the session
              </p>
            </div>
          )}
        </div>

        <div className="file-controls">
          <div className="form-group">
            <label>Select File</label>
            <div className="file-input-container">
              <label htmlFor="session-file-input" className="file-input-label">
                <FiUploadCloud className="btn-icon" /> Choose File
              </label>
              <input
                id="session-file-input"
                type="file"
                onChange={handleFileChange}
                disabled={!sessionCreated}
              />
            </div>
            {selectedFile && (
              <div className="file-info">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">({formatFileSize(selectedFile.size)})</span>
              </div>
            )}
          </div>

          {selectedFile && <ProgressBar progress={progress} total={100} />}

          <button
            className="btn send-file-btn"
            onClick={sendFile}
            disabled={!sessionCreated || !selectedFile}
          >
            <FiUploadCloud className="btn-icon" />
            Send File
          </button>
        </div>
      </div>
    </div>
  );
};