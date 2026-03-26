"use client";

import { useState, useEffect, useRef } from "react";
import { FileTransferManager } from "../lib/webrtc";

export default function useVaultHook() {
  const [vpnEnabled, setVpnEnabled] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [vpnIp, setVpnIp] = useState("0.0.0.0");
  const [clientId, setClientId] = useState("");
  const [alias, setAlias] = useState("");
  const [status, setStatus] = useState("disconnected");
  const [messages, setMessages] = useState([]);
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [logs, setLogs] = useState([]);
  const logContainerRef = useRef(null);

  // 1:1 State
  const [peerId, setPeerId] = useState("");
  const [peerAlias, setPeerAlias] = useState("");
  const peerAliasRef = useRef("");
  const [progress, setProgress] = useState(0);

  // Audio Call State
  const [isCallActive, setIsCallActive] = useState(false);
  const remoteAudioRef = useRef(null);

  const wsRef = useRef(null);
  const rtcRef = useRef(null);
  const sessionIdRef = useRef("");

  const SIGNALLING_URL =
    process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/signaling";

  const addLog = (message, type = "info") => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-100), { message, type, time }]);
    if (logContainerRef.current) {
      setTimeout(() => {
        logContainerRef.current.scrollTop =
          logContainerRef.current.scrollHeight;
      }, 50);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    const saved = localStorage.getItem("vault_session");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.sessionId) {
          setSessionId(data.sessionId);
          sessionIdRef.current = data.sessionId;
        }
        if (data.messages) setMessages(data.messages);
        if (data.clientId) setClientId(data.clientId);
        if (data.alias) setAlias(data.alias);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (clientId) {
      localStorage.setItem(
        "vault_session",
        JSON.stringify({
          clientId,
          sessionId,
          messages,
          vpnIp,
          alias,
        }),
      );
    }
  }, [clientId, sessionId, messages, vpnIp, alias]);

  const connectToSignalling = () => {
    if (wsRef.current) return;
    setStatus("connecting");
    const socket = new WebSocket(SIGNALLING_URL);
    // console.log("L82 : useVault.hook.js : Socket connected", socket);
    wsRef.current = socket;

    socket.onopen = () => {
      addLog("L4 Control Plane Synced", "success");
      setIsServerConnected(true);
      const saved = JSON.parse(localStorage.getItem("vault_session") || "{}");
      if (saved.clientId) {
        socket.send(
          JSON.stringify({ type: "RECONNECT", oldClientId: saved.clientId }),
        );
      } else {
        setStatus("connected");
      }
    };

    socket.onmessage = async (msg) => {
      const data = JSON.parse(msg.data);
      handleSignallingMessage(data);
    };

    socket.onclose = () => {
      addLog("L4 Link Suspended", "warning");
      setIsServerConnected(false);
      wsRef.current = null;
      setTimeout(connectToSignalling, 1000);
    };
  };

  const handleSignallingMessage = async (data) => {
    switch (data.type) {
      case "ASSIGNED_IP":
        setVpnIp(data.vpnIp);
        setClientId(data.clientId);
        setAlias(data.alias);
        break;

      case "RECONNECTED":
        setVpnIp(data.vpnIp);
        setClientId(data.clientId);
        setAlias(data.alias);
        if (data.sessionId) {
          setSessionId(data.sessionId);
          sessionIdRef.current = data.sessionId;
          wsRef.current.send(
            JSON.stringify({ type: "JOIN_SESSION", sessionId: data.sessionId }),
          );
        }
        break;

      case "SESSION_CREATED":
      case "SESSION_JOINED":
        setSessionId(data.sessionId);
        sessionIdRef.current = data.sessionId;
        break;

      case "PEER_READY":
        addLog(`Protocol detected node: ${data.peerAlias}`, "info");
        setPeerId(data.peerId);
        setPeerAlias(data.peerAlias);
        peerAliasRef.current = data.peerAlias;
        addLog(`Handshake Role: ${data.polite ? "POLITE" : "IMPOLITE"}`, "info");
        initRTC(data.peerId, data.polite);
        break;

      case "SIGNAL":
        if (data.description) {
          if (!peerId) {
            setPeerId(data.senderId);
            setPeerAlias(data.senderAlias);
            peerAliasRef.current = data.senderAlias;
          }
          if (!rtcRef.current) initRTC(data.senderId, true);
          await rtcRef.current.handleDescription(data.description);
        } else if (data.candidate) {
          if (rtcRef.current) {
            await rtcRef.current.addIceCandidate(data.candidate);
          }
        }
        break;

      case "PEER_DISCONNECTED":
        setStatus("disconnected");
        setPeerId("");
        setPeerAlias("");
        if (rtcRef.current) rtcRef.current.close();
        break;
    }
  };

  const initRTC = (pid, polite = false) => {
        // console.log("Initializing RTC with", pid);
        if (rtcRef.current) rtcRef.current.close();
    
        rtcRef.current = new FileTransferManager(
          (m, t) => addLog(`[P2P] ${m}`, t),
          (s, details) => handleRTCStatus(s, details),
          (p) => setProgress(p),
        );
    
        rtcRef.current.initPeerConnection((signal) => {
          if (wsRef.current?.readyState === 1) {
            wsRef.current.send(
              JSON.stringify({
                type: "SIGNAL",
                targetId: pid,
                ...signal,
                sessionId: sessionIdRef.current,
              }),
            );
          }
        }, polite);
    
        rtcRef.current.pc.ontrack = (event) => {
          if (remoteAudioRef.current)
            remoteAudioRef.current.srcObject = event.streams[0];
          setIsCallActive(true);
        };
    
        if (vpnEnabled) rtcRef.current.setVpn(true);
      };

  const handleRTCStatus = (s, details) => {
    let normalized = s.replace("rtc-", "");
    if (normalized === "chat-message") {
      addLog(`Received expression from ${details.sender || details.alias || peerAlias}`, "info");
      setMessages((prev) => [
        ...prev,
        { ...details, side: "remote", sender: details.alias || peerAlias },
      ]);
      return;
    }
    if (normalized === "audio-start") {
      setMessages((prev) => [
        ...prev,
        {
          type: "audio-note",
          fileName: details.fileName,
          side: "remote",
          sender: peerAlias,
          time: new Date().toLocaleTimeString(),
          isTransferring: true,
        },
      ]);
      return;
    }
    if (normalized === "audio-received") {
      addLog(`Voice feed from ${peerAlias}`, "info");
      setMessages((prev) => {
        const index = prev.findLastIndex(m => m.fileName === details.fileName);
        if (index !== -1) {
          const newMessages = [...prev];
          newMessages[index] = { ...newMessages[index], url: details.url, isTransferring: false };
          return newMessages;
        }
        return [
          ...prev,
          {
            type: "audio-note",
            url: details.url,
            fileName: details.fileName,
            side: "remote",
            sender: peerAlias,
            time: new Date().toLocaleTimeString(),
          },
        ];
      });
      return;
    }
    if (normalized === "awaiting-acceptance") {
      setMessages((prev) => [
        ...prev,
        {
          ...rtcRef.current.pendingFile,
          type: "file-request",
          side: "remote",
          sender: peerAliasRef.current,
          time: new Date().toLocaleTimeString(),
        },
      ]);
    }
    setStatus(normalized);
  };

  const sendChatMessage = async (msg) => {
    if (rtcRef.current) {
      const success = await rtcRef.current.sendChat(msg, alias);
      // console.log(success)
      if (success) {
        setMessages((prev) => [
          ...prev,
          {
            message: msg,
            time: new Date().toLocaleTimeString(),
            side: "local",
            sender: alias,
          },
        ]);
        addLog("Link expression broadcast", "success");
      } else {
        addLog("Signal failed to transmit", "error");
      }
    } else {
      addLog("Node link not identified", "warning");
    }
  };

  const terminateConnection = () => {
    localStorage.removeItem("vault_session");
    window.location.reload();
  };

  useEffect(() => {
    connectToSignalling();
    return () => rtcRef.current?.close();
  }, []);

  return {
    isServerConnected,
    vpnEnabled,
    setVpnEnabled,
    status,
    sessionId,
    startSession: () =>
      wsRef.current.send(JSON.stringify({ type: "CREATE_SESSION" })),
    joinSession: (id) =>
      wsRef.current.send(
        JSON.stringify({ type: "JOIN_SESSION", sessionId: id.toUpperCase() }),
      ),
    messages,
    sendChatMessage,
    handleFileSelect: (e) => {
      const file = e.target.files[0];
      if (file && rtcRef.current) {
        rtcRef.current.sendFile(file);
        
        if (file.name.startsWith("VoiceNote_")) {
           setMessages((prev) => [
             ...prev,
             {
               type: "audio-note",
               url: URL.createObjectURL(file),
               fileName: file.name,
               side: "local",
               sender: alias,
               time: new Date().toLocaleTimeString(),
             }
           ]);
        } else {
           setMessages((prev) => [
             ...prev,
             {
               type: "file-request",
               fileName: file.name,
               fileSize: file.size,
               side: "local",
               sender: alias,
               time: new Date().toLocaleTimeString(),
               status: "waiting-for-peer"
             },
           ]);
        }
        if (e.target) e.target.value = null;
      }
    },
    progress,
    alias,
    peerAlias,
    logs,
    clearLogs,
    logContainerRef,
    terminateConnection,
    acceptFile: () =>
      rtcRef.current?.prepareForDownload(rtcRef.current.pendingFile),
    rejectFile: () => rtcRef.current?.rejectTransfer(),
    isCallActive,
    toggleCall: async () => {
      const nextState = !isCallActive;
      await rtcRef.current?.toggleAudioCall(nextState, (stream) => {
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
      });
      setIsCallActive(nextState);
    },
    remoteAudioRef,
  };
}
