import React, { useState, useEffect } from "react";
import { useWS } from "../context/WSContext";
import { useLog } from "../context/LogContext";
import { FiLink, FiLink2, FiSave, FiLogIn, FiServer } from "react-icons/fi";
import { ProgressBar } from "./ProgressBar";
import "./SessionReceiver.css";

export const SessionReceiver = () => {
  const { ws, isConnected, connect, disconnect } = useWS();
  const { addLog } = useLog();
  const [sessionId, setSessionId] = useState("");
  const [joined, setJoined] = useState(false);
  const [fileChunks, setFileChunks] = useState([]);
  const [progress, setProgress] = useState(0);
  const [fileSize, setFileSize] = useState(0);
  const [fileName, setFileName] = useState("");
  const [receivedBytes, setReceivedBytes] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);

  const handleConnect = () => {
    connect();
    addLog("Connecting to server...", "info");
  };

  const handleDisconnect = () => {
    disconnect();
    addLog("Disconnected from server", "warning");
    resetState();
  };

  const resetState = () => {
    setJoined(false);
    setSessionId("");
    setFileChunks([]);
    setProgress(0);
    setFileSize(0);
    setFileName("");
    setReceivedBytes(0);
    setFileInfo(null);
  };

  const joinSession = () => {
    if (!sessionId) {
      addLog("Please enter a session ID", "error");
      return;
    }
    if (!isConnected) {
      addLog("Not connected to server", "error");
      return;
    }

    ws.send(JSON.stringify({ type: "join-session", sessionId }));
    setJoined(true);
    addLog(`Joining session: ${sessionId}`, "info");
  };

  const saveFileToDisk = async (blob, fileName) => {
    try {
      setIsSaving(true);
      // Check if the File System Access API is available
      if (!('showSaveFilePicker' in window)) {
        throw new Error("File System Access API not supported in this browser");
      }

      // Ask user to pick folder and create file handle
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'All Files',
          accept: { 'application/octet-stream': ['*'] },
        }],
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();

      console.log("File saved to user's machine:", handle.name);
      addLog(`File saved to disk: ${handle.name}`, "success");
      setIsSaving(false);
      
      return true;
    } catch (err) {
      console.error("Failed to save file:", err);
      
      // If user cancels the save dialog, don't show an error
      if (err.name === 'AbortError') {
        addLog("File save cancelled", "info");
      } else {
        addLog("Failed to save file: " + err.message, "error");
      }
      
      setIsSaving(false);
      return false;
    }
  };

  const downloadFile = async () => {
    if (!fileInfo) {
      addLog("No file available to download", "error");
      return;
    }

    try {
      // Try to save directly to disk using File System Access API
      const saved = await saveFileToDisk(fileInfo.blob, fileInfo.fileName);
      
      // If the API isn't available or user prefers traditional download
      if (!saved) {
        // Fallback to traditional download method
        const url = URL.createObjectURL(fileInfo.blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileInfo.fileName;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        addLog(`Downloaded file: ${fileInfo.fileName}`, "success");
        
        // Clean up URL object after download
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      }
      
      // Reset file info after download
      setFileInfo(null);
    } catch (error) {
      console.error("Error downloading file:", error);
      addLog("Error downloading file: " + error.message, "error");
    }
  };

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data.type === "file-chunk") {
          // Set fileSize and fileName on first chunk
          if (fileChunks.length === 0) {
            if (data.fileSize) setFileSize(data.fileSize);
            if (data.fileName) setFileName(data.fileName);
          }

          setFileChunks((prev) => [...prev, data.chunk]);

          // Update progress
          if (data.fileSize) {
            // More accurate size calculation for base64 chunks
            const chunkSize = Math.floor(data.chunk.length * 3 / 4);
            const newReceivedBytes = receivedBytes + chunkSize;
            setReceivedBytes(newReceivedBytes);
            const newProgress = Math.min((newReceivedBytes / data.fileSize) * 100, 100);
            setProgress(newProgress);
            
            if (!data.done) {
              addLog(`Receiving "${data.fileName}"... ${newProgress.toFixed(1)}%`, "info");
            }
          }

          if (data.done) {
            // Combine all chunks and create blob
            const combinedData = fileChunks.join('') + data.chunk;
            const blob = dataURLToBlob(combinedData);
            
            setFileInfo({ 
              blob: blob, 
              fileName: data.fileName,
              fileSize: data.fileSize
            });
            
            setFileChunks([]);
            setProgress(100);
            addLog(`File "${data.fileName}" fully received`, "success");
            setFileSize(0);
            setReceivedBytes(0);
          }
        }
      } catch (error) {
        addLog("Error processing received data", "error");
        console.error("Error processing message:", error);
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws, fileChunks, receivedBytes, addLog]);

  // Helper function to convert data URL to blob
  const dataURLToBlob = (dataURL) => {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1] || 'application/octet-stream';
    const raw = window.atob(parts[1]);
    const uInt8Array = new Uint8Array(raw.length);
    
    for (let i = 0; i < raw.length; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="session-receiver-container-horizontal">
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

      {/* RIGHT: Session Join & File Receive Card */}
      <div className="session-receiver-content">
        <h3>Join Session to Receive Files</h3>
        
        <div className="session-join">
          <div className="form-group">
            <label>Session ID</label>
            <input
              type="text"
              placeholder="Enter Session ID"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              disabled={joined || !isConnected}
            />
          </div>
          <button
            className="btn join-btn"
            onClick={joinSession}
            disabled={!isConnected || !sessionId || joined}
          >
            <FiLogIn className="btn-icon" /> Join Session
          </button>
        </div>

        {joined && (
          <div className="session-status">
            <div className="session-info">
              <p>Joined session: <span className="session-id">{sessionId}</span></p>
              <p className="session-help">Waiting for files to be sent...</p>
            </div>
          </div>
        )}

        <div className="file-receive">
          {fileSize > 0 && (
            <div className="progress-section">
              <div className="file-transfer-info">
                <span className="file-name">{fileName}</span>
                <span className="file-size">({formatFileSize(fileSize)})</span>
              </div>
              <ProgressBar progress={progress} total={100} />
              <div className="transfer-stats">
                {formatFileSize(receivedBytes)} of {formatFileSize(fileSize)} ({progress.toFixed(1)}%)
              </div>
            </div>
          )}
          
          {fileInfo ? (
            <div className="received-file">
              <h4>File Received</h4>
              <div className="file-details">
                <div className="file-info">
                  <span className="file-name">{fileInfo.fileName}</span>
                  <span className="file-size">({formatFileSize(fileInfo.fileSize)})</span>
                </div>
                <button 
                  className="btn download-btn" 
                  onClick={downloadFile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <FiSave className="btn-icon" /> Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="btn-icon" /> Save to Disk
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="no-file">
              {joined ? (
                <p>Waiting for files to be sent...</p>
              ) : (
                <p>Join a session to receive files</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};