// RoleSelection.jsx (in case it's missing)
import React from "react";
import { FiSend, FiDownload, FiCpu } from "react-icons/fi";
import "./RoleSelection.css";

export const RoleSelection = ({ setRole }) => {
  return (
    <div className="role-selection-container">
      <div className="role-selection-card">
        <div className="role-header">
          <FiCpu className="role-header-icon" />
          <h1>Secure File Transfer</h1>
          <p>Choose your role to get started</p>
        </div>

        <div className="role-buttons">
          <div className="role-card" onClick={() => setRole("SENDER")}>
            <div className="role-icon sender">
              <FiSend />
            </div>
            <h3>Sender</h3>
            <p>Send files securely to other devices</p>
            <button className="role-select-btn">Select Sender</button>
          </div>

          <div className="role-card" onClick={() => setRole("RECEIVER")}>
            <div className="role-icon receiver">
              <FiDownload />
            </div>
            <h3>Receiver</h3>
            <p>Receive files from other devices</p>
            <button className="role-select-btn">Select Receiver</button>
          </div>
        </div>

        <div className="role-footer">
          <p>Secure • Fast • Encrypted</p>
        </div>
      </div>
    </div>
  );
};