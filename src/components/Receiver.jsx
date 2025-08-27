import React, { useState, useEffect, useRef } from "react";
import { useWS } from "../context/WSContext";
import { useLog } from "../context/LogContext";
import {
  FiLink,
  FiLink2,
  FiSave,
  FiServer,
  FiDownload,
  FiFile,
} from "react-icons/fi";
import { ProgressBar } from "./ProgressBar";
import "./Receiver.css";

export const Receiver = () => {
  const { vpnIp, ws, isConnected, connect, disconnect } = useWS();
  const { addLog } = useLog();
  const [fileName, setFileName] = useState("");
  const [fromIp, setFromIp] = useState("");
  const [progress, setProgress] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [lastChunk, setLastChunk] = useState(null);
  const [receivedSize, setReceivedSize] = useState(0);
  const [isReceiving, setIsReceiving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const chunksRef = useRef([]);
  const fileInfoRef = useRef({ 
    fileName: "", 
    totalSize: 0, 
    fromIp: "", 
    mimeType: "application/octet-stream" 
  });

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
    chunksRef.current = [];
    setFileName("");
    setFromIp("");
    setProgress(0);
    setTotalSize(0);
    setLastChunk(null);
    setReceivedSize(0);
    setIsReceiving(false);
    fileInfoRef.current = { 
      fileName: "", 
      totalSize: 0, 
      fromIp: "", 
      mimeType: "application/octet-stream" 
    };
  };

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        console.log("Received message type:", data.type, "done:", data.done);

        if (data.type === "SEND_FILE") {
          console.log("Processing SEND_FILE:", data.fileName, "done:", data.done, "size:", data.totalSize);

          // Store file info on first chunk
          if (chunksRef.current.length === 0) {
            fileInfoRef.current = {
              fileName: data.fileName,
              totalSize: data.totalSize,
              fromIp: data.fromIp || "",
              mimeType: data.mimeType || "application/octet-stream"
            };
            setFileName(data.fileName);
            setTotalSize(data.totalSize);
            if (data.fromIp) setFromIp(data.fromIp);
            setIsReceiving(true);

            addLog(
              `Starting to receive: ${data.fileName} (${formatFileSize(data.totalSize)})`,
              "info"
            );
          }

          // Extract base64 data and convert to binary
          try {
            const base64Data = data.fileData.split(',')[1];
            const binaryStr = atob(base64Data);
            const bytes = new Uint8Array(binaryStr.length);
            
            for (let i = 0; i < binaryStr.length; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }

            // Add chunk to collection
            chunksRef.current.push(bytes);
            
            // Update progress
            const newReceivedSize = receivedSize + bytes.length;
            setReceivedSize(newReceivedSize);
            
            const newProgress = Math.min((newReceivedSize / data.totalSize) * 100, 100);
            setProgress(newProgress);

            console.log(`Chunk ${chunksRef.current.length} received, size: ${bytes.length}, total: ${newReceivedSize}/${data.totalSize}`);

            // Handle final chunk
            if (data.done === true || data.done === 'true') {
              console.log("Final chunk received, reconstructing file");
              reconstructFile();
            } else {
              addLog(
                `Received chunk ${chunksRef.current.length} for "${data.fileName}" (${formatFileSize(bytes.length)})`,
                "info"
              );
            }
          } catch (error) {
            console.error("Error processing chunk:", error);
            addLog("Error processing file chunk", "error");
          }
        }
      } catch (error) {
        console.error("Error processing message:", error, msg.data);
        addLog("Error processing received data: " + error.message, "error");
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws, receivedSize, addLog]);

  const reconstructFile = () => {
    try {
      if (chunksRef.current.length === 0) {
        addLog("No chunks to reconstruct file", "error");
        return;
      }

      console.log("Reconstructing file from", chunksRef.current.length, "chunks");

      // Combine all chunks into a single Uint8Array
      const totalLength = chunksRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
      const combinedArray = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunksRef.current) {
        combinedArray.set(chunk, offset);
        offset += chunk.length;
      }

      // Create blob from combined data
      const blob = new Blob([combinedArray], { type: fileInfoRef.current.mimeType });

      const fileInfo = {
        blob: blob,
        fileName: fileInfoRef.current.fileName,
        fileSize: fileInfoRef.current.totalSize,
      };

      console.log("File reconstructed:", fileInfo);
      setLastChunk(fileInfo);

      addLog(`File "${fileInfoRef.current.fileName}" fully received (${formatFileSize(totalLength)})`, "success");
      
      // Clean up and reset for next file
      chunksRef.current = [];
      setIsReceiving(false);
      setReceivedSize(0);
      setProgress(0);

    } catch (error) {
      console.error("Error reconstructing file:", error);
      addLog("Error reconstructing file: " + error.message, "error");
    }
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
      
      // Clear the lastChunk state since file is now saved
      setLastChunk(null);
      
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
    if (!lastChunk) {
      addLog("No file available to download", "error");
      return;
    }

    try {
      // Try to save directly to disk using File System Access API
      const saved = await saveFileToDisk(lastChunk.blob, lastChunk.fileName);
      
      // If the API isn't available or user prefers traditional download
      if (!saved) {
        // Fallback to traditional download method
        const url = URL.createObjectURL(lastChunk.blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = lastChunk.fileName;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        addLog(`Downloaded file: ${lastChunk.fileName}`, "success");
        
        // Clean up URL object after download
        setTimeout(() => {
          URL.revokeObjectURL(url);
          setLastChunk(null);
        }, 1000);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      addLog("Error downloading file: " + error.message, "error");
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="receiver-container-horizontal">
      {/* LEFT: Connection Card */}
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
          <button
            className="btn connect-btn"
            onClick={handleConnect}
            disabled={isConnected}
          >
            <FiLink className="btn-icon" /> Connect
          </button>
          <button
            className="btn disconnect-btn"
            onClick={handleDisconnect}
            disabled={!isConnected}
          >
            <FiLink2 className="btn-icon" /> Disconnect
          </button>
        </div>
      </div>

      {/* RIGHT: File Receive Card */}
      <div className="receiver-content">
        <h3>Receive Files</h3>

        {fromIp && (
          <div className="transfer-info">
            <p>
              Receiving from: <span className="ip-address">{fromIp}</span>
            </p>
          </div>
        )}

        {isReceiving && totalSize > 0 && (
          <div className="progress-section">
            <div className="file-transfer-info">
              <FiFile className="icon-inline" />
              <span className="file-name">{fileName}</span>
              <span className="file-size">({formatFileSize(totalSize)})</span>
            </div>
            <ProgressBar progress={progress} total={100} />
            <div className="transfer-stats">
              {formatFileSize(receivedSize)} of {formatFileSize(totalSize)} (
              {progress.toFixed(1)}%)
            </div>
          </div>
        )}

        {lastChunk ? (
          <div className="received-file">
            <h4>File Received Successfully! 🎉</h4>
            <div className="file-details">
              <div className="file-info">
                <FiFile className="icon-inline" />
                <span className="file-name">{lastChunk.fileName}</span>
                <span className="file-size">
                  ({formatFileSize(lastChunk.fileSize)})
                </span>
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
                    <FiDownload className="btn-icon" /> Save to Disk
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="no-file">
            {isConnected ? (
              isReceiving ? (
                <p>Receiving file... {progress.toFixed(1)}% complete</p>
              ) : (
                <p>Waiting for files to be sent...</p>
              )
            ) : (
              <p>Connect to start receiving files</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};