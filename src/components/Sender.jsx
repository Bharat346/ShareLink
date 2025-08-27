import React, { useState } from "react";
import { useWS } from "../context/WSContext";
import { useLog } from "../context/LogContext";
import { FiLink, FiLink2, FiUploadCloud, FiServer, FiFile } from "react-icons/fi";
import { ProgressBar } from "./ProgressBar";
import "./Sender.css";

export const Sender = () => {
  const { ws, vpnIp, isConnected, connect, disconnect } = useWS();
  const { addLog } = useLog();
  const [receiverIp, setReceiverIp] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);

  const CHUNK_SIZE = 1024 * 1024 * 5; // 5 MB per chunk

  const handleConnect = () => {
    connect();
    addLog("Connecting to server...", "info");
  };

  const handleDisconnect = () => {
    disconnect();
    addLog("Disconnected from server", "warning");
    setSelectedFile(null);
    setProgress(0);
  };

  const sendFile = () => {
    if (!selectedFile || !receiverIp) {
      addLog("Please select a file and enter receiver IP", "error");
      return;
    }
    if (!isConnected) {
      addLog("Not connected to server", "error");
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
          type: "SEND_FILE",
          toIp: receiverIp,
          fileName: file.name,
          fileData: e.target.result,
          totalSize: file.size,
          done: offset + CHUNK_SIZE >= file.size,
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
        document.getElementById("file-input").value = "";
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
      addLog(`Selected file: ${file.name} (${formatFileSize(file.size)})`, "info");
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
    <div className="sender-container">
      {/* Connection Card */}
      <div className="status-card">
        <div className="status-header">
          <div className={`status-dot ${isConnected ? "connected" : "disconnected"}`}></div>
          <h3>{isConnected ? "Connected" : "Disconnected"}</h3>
        </div>
        <p className="status-info">
          <FiServer className="icon-inline" /> VPN IP:{" "}
          <span className="ip-address">{vpnIp || "Not assigned"}</span>
        </p>
        <div className="status-actions">
          <button className="btn connect-btn" onClick={handleConnect} disabled={isConnected}>
            <FiLink className="btn-icon" /> Connect
          </button>
          <button className="btn disconnect-btn" onClick={handleDisconnect} disabled={!isConnected}>
            <FiLink2 className="btn-icon" /> Disconnect
          </button>
        </div>
      </div>

      {/* File Transfer Card */}
      <div className="sender-form">
        <h3>Send a File</h3>

        <div className="form-group">
          <label>Receiver VPN IP</label>
          <input
            type="text"
            placeholder="Enter receiver IP (e.g. 10.0.0.2)"
            value={receiverIp}
            onChange={(e) => setReceiverIp(e.target.value)}
            disabled={!isConnected}
          />
        </div>

        <div className="form-group">
          <label>Select File</label>
          <div className="file-input-container">
            <label htmlFor="file-input" className="file-input-label">
              <FiUploadCloud className="btn-icon" /> Choose File
            </label>
            <input
              id="file-input"
              type="file"
              onChange={handleFileChange}
              disabled={!isConnected}
            />
          </div>
          {selectedFile && (
            <div className="file-info">
              <FiFile className="icon-inline" /> {selectedFile.name} (
              {formatFileSize(selectedFile.size)})
            </div>
          )}
        </div>

        {selectedFile && <ProgressBar progress={progress} total={100} />}

        <button
          className="btn send-btn"
          onClick={sendFile}
          disabled={!isConnected || !selectedFile || !receiverIp}
        >
          <FiUploadCloud className="btn-icon" /> Send File
        </button>
      </div>
    </div>
  );
};