// App.jsx
import React, { useState } from "react";
import { WSProvider } from "./context/WSContext";
import { LogProvider } from "./context/LogContext";
import { Logs } from "./components/Logs";
import { RoleSelection } from "./components/RoleSelection";
import { Sender } from "./components/Sender";
import { Receiver } from "./components/Receiver";
import { SessionSender } from "./components/SessionSender";
import { SessionReceiver } from "./components/SessionReceiver";
import {
  FiSend,
  FiDownload,
  FiWifi,
  FiShield,
  FiX,
  FiCpu,
  FiUploadCloud,
  FiSave,
  FiUserCheck,
  FiUsers,
  FiGlobe,
} from "react-icons/fi";
import "./styles/App.css";

function App() {
  const [role, setRole] = useState(null);
  const [mode, setMode] = useState("VPN");

  const handleBack = () => {
    setRole(null);
  };

  return (
    <LogProvider>
      <WSProvider>
        <div className="app-container">
          {!role ? (
            <RoleSelection setRole={setRole} />
          ) : (
            <div className="app-main">
              <header className="app-header">
                <div className="header-top">
                  <div className="header-brand">
                    <FiCpu className="header-icon" />
                    <h1>Secure File Transfer</h1>
                    <span className="app-version">v1.0</span>
                  </div>
                  <button className="back-btn" onClick={handleBack}>
                    <FiX /> Change Role
                  </button>
                </div>

                <div className="mode-selector">
                  <div className="mode-selector-header">
                    <FiGlobe className="mode-header-icon" />
                    <span>Connection Mode</span>
                  </div>
                  <div className="mode-buttons">
                    <button
                      className={mode === "VPN" ? "mode-btn active" : "mode-btn"}
                      onClick={() => setMode("VPN")}
                    >
                      <FiShield className="btn-icon" />
                      VPN Mode
                      <span className="mode-description">Secure peer-to-peer</span>
                    </button>
                    <button
                      className={mode === "WIFI" ? "mode-btn active" : "mode-btn"}
                      onClick={() => setMode("WIFI")}
                    >
                      <FiWifi className="btn-icon" />
                      Session Mode
                      <span className="mode-description">Shareable sessions</span>
                    </button>
                  </div>
                </div>

                <div className="role-indicator">
                  {role === "SENDER" ? (
                    <span className="sender-indicator">
                      <FiSend className="indicator-icon" />
                      <span className="indicator-text">
                        <span className="indicator-label">You are in</span>
                        <span className="indicator-role">Sender Mode</span>
                      </span>
                    </span>
                  ) : (
                    <span className="receiver-indicator">
                      <FiDownload className="indicator-icon" />
                      <span className="indicator-text">
                        <span className="indicator-label">You are in</span>
                        <span className="indicator-role">Receiver Mode</span>
                      </span>
                    </span>
                  )}
                </div>
              </header>

              <main className="app-content">
                <div className="content-header">
                  <div className="content-title">
                    {mode === "VPN" && role === "SENDER" && (
                      <>
                        <FiUploadCloud className="content-icon" />
                        <h2>Send Files Securely</h2>
                      </>
                    )}
                    {mode === "VPN" && role === "RECEIVER" && (
                      <>
                        <FiDownload className="content-icon" />
                        <h2>Receive Files Securely</h2>
                      </>
                    )}
                    {mode === "WIFI" && role === "SENDER" && (
                      <>
                        <FiUserCheck className="content-icon" />
                        <h2>Create Transfer Session</h2>
                      </>
                    )}
                    {mode === "WIFI" && role === "RECEIVER" && (
                      <>
                        <FiUsers className="content-icon" />
                        <h2>Join Transfer Session</h2>
                      </>
                    )}
                  </div>
                  <div className="content-description">
                    {mode === "VPN" && "Direct peer-to-peer file transfer using VPN encryption"}
                    {mode === "WIFI" && "Create or join sessions for file sharing"}
                  </div>
                </div>

                <div className="component-wrapper">
                  {mode === "VPN" && role === "SENDER" && <Sender />}
                  {mode === "VPN" && role === "RECEIVER" && <Receiver />}
                  {mode === "WIFI" && role === "SENDER" && <SessionSender />}
                  {mode === "WIFI" && role === "RECEIVER" && <SessionReceiver />}
                </div>
              </main>

              <div className="logs-section">
                <Logs />
              </div>
            </div>
          )}
        </div>
      </WSProvider>
    </LogProvider>
  );
}

export default App;