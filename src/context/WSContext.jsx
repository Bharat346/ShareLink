
// Updated WSContext.js
import { createContext, useContext, useEffect, useState } from "react";
import { useLog } from "./LogContext";

const WSContext = createContext();

export const WSProvider = ({ children }) => {
  const [ws, setWs] = useState(null);
  const [vpnIp, setVpnIp] = useState(null);
  const [lastFile, setLastFile] = useState(null);
  const [lastChunk, setLastChunk] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { addLog } = useLog();

  const connect = () => {
    try {
      const socket = new WebSocket("wss://192.168.0.101:8080");
      setWs(socket);

      socket.onopen = () => {
        setIsConnected(true);
        addLog("Connected to server", "success");
      };

      socket.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.type === "ASSIGNED_IP") {
          setVpnIp(data.vpnIp);
          addLog(`Assigned VPN IP: ${data.vpnIp}`, "info");
        }
        if (data.type === "RECEIVE_FILE") {
          setLastFile(data);
          addLog(`File received from ${data.fromIp}: ${data.fileName}`, "success");
        }
        if (data.type === "file-chunk") {
          setLastChunk(data);
          addLog(`File chunk received: ${data.fileName}`, "success");
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        addLog("Disconnected from server", "warning");
      };

      socket.onerror = (error) => {
        addLog(`WebSocket error: ${error.message}`, "error");
      };
    } catch (error) {
      addLog(`Connection failed: ${error.message}`, "error");
    }
  };

  const disconnect = () => {
    if (ws) {
      ws.close();
      setWs(null);
      setIsConnected(false);
    }
  };

  // Auto-connect on component mount
  useEffect(() => {
    connect();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return (
    <WSContext.Provider value={{ 
      ws, 
      vpnIp, 
      lastFile, 
      setLastFile, 
      lastChunk, 
      setLastChunk,
      isConnected,
      connect,
      disconnect
    }}>
      {children}
    </WSContext.Provider>
  );
};

export const useWS = () => useContext(WSContext);
