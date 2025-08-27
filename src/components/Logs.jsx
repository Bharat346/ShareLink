// Updated Logs.js
import React, { useEffect, useRef } from "react";
import { useLog } from "../context/LogContext";
import { FiTrash2, FiAlertCircle, FiCheckCircle, FiInfo, FiAlertTriangle } from "react-icons/fi";
import "./Logs.css";

export const Logs = () => {
  const { logs, clearLogs } = useLog();
  const logEndRef = useRef(null);

  const getLogClass = (log) => {
    if (log.includes("error") || log.includes("Error") || log.includes("failed")) 
      return "log-error";
    if (log.includes("success") || log.includes("Success") || log.includes("completed")) 
      return "log-success";
    if (log.includes("warning") || log.includes("Warning") || log.includes("disconnected")) 
      return "log-warning";
    if (log.includes("info") || log.includes("Info") || log.includes("connecting")) 
      return "log-info";
    return "";
  };

  const getLogIcon = (log) => {
    if (log.includes("error") || log.includes("Error") || log.includes("failed")) 
      return <FiAlertCircle className="log-icon" />;
    if (log.includes("success") || log.includes("Success") || log.includes("completed")) 
      return <FiCheckCircle className="log-icon" />;
    if (log.includes("warning") || log.includes("Warning") || log.includes("disconnected")) 
      return <FiAlertTriangle className="log-icon" />;
    return <FiInfo className="log-icon" />;
  };


  const handleClearLogs = () => {
    clearLogs();
  };

  return (
    <div className="logs-container">
      <div className="logs-header">
        <div className="logs-title">
          <h3>Activity Log</h3>
          <span className="log-count">{logs.length} entries</span>
        </div>
        <button 
          className="btn clear-btn" 
          onClick={handleClearLogs} 
          disabled={logs.length === 0}
        >
          <FiTrash2 className="btn-icon" /> Clear Logs
        </button>
      </div>
      
      <div className="log-window">
        {logs.length === 0 ? (
          <div className="log-entry log-info">
            <FiInfo className="log-icon" />
            <span className="log-message">No logs yet. Connect to start transferring files.</span>
          </div>
        ) : (
          logs.map((log, index) => {
            // Extract timestamp from log message
            const timestampMatch = log.match(/^\[(.*?)\]/);
            const timestamp = timestampMatch ? timestampMatch[1] : '';
            const message = timestampMatch ? log.replace(timestampMatch[0], '').trim() : log;
            
            return (
              <div key={index} className={`log-entry ${getLogClass(log)}`}>
                {getLogIcon(log)}
                {timestamp && <span className="log-timestamp">[{timestamp}]</span>}
                <span className="log-message">{message}</span>
              </div>
            );
          })
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};