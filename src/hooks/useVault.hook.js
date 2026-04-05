import { useState, useEffect, useRef } from "react";
import { FileTransferManager } from "../lib/webrtc";
import { MessageQueue } from "../lib/messageQueue";
import { toast } from "react-hot-toast";

export default function useVaultHook(initialSessionId = null) {
  const [vpnEnabled, setVpnEnabled] = useState(false);
  const [status, setStatus] = useState("disconnected");
  const [messages, setMessages] = useState([]);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [incomingStream, setIncomingStream] = useState(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [isOutgoingCall, setIsOutgoingCall] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const logContainerRef = useRef(null);

  // 1:1 State
  const [peerId, setPeerId] = useState("");
  const [peerAlias, setPeerAlias] = useState("");
  const peerAliasRef = useRef("");

  // Refs
  const wsRef = useRef(null);
  const rtcRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const aliasRef = useRef(
    "NODE_" + Math.random().toString(36).substring(7).toUpperCase(),
  );
  const alias = aliasRef.current;
  const sessionIdRef = useRef(initialSessionId || "");
  const [sessionId, setSessionId] = useState(initialSessionId || "");

  // Producer-Consumer Queue (Lazy Init to avoid recreation on render)
  const sendQueue = useRef(null);
  if (!sendQueue.current) {
    sendQueue.current = new MessageQueue(async (payload) => {
      if (!rtcRef.current || !rtcRef.current.dataChannel || rtcRef.current.dataChannel.readyState !== 'open') {
        throw new Error("RTC_LINK_OFFLINE");
      }
      
      if (payload.type === 'chat') {
         const success = await rtcRef.current.sendChat(payload.message, payload.alias, payload.id);
         if (!success) return false;
      } else if (payload.type === 'file') {
         toast.loading("Encrypting Payload...", { id: payload.id });
         const success = await rtcRef.current.sendFile(payload.file);
         if (success) {
           toast.success("Binary Dispersed", { id: payload.id });
         } else {
           toast.error("Transmission Interrupted", { id: payload.id });
           return false;
         }
      }
      return true;
    });
  }

  const addLog = (msg, type = "info") => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { msg, type, time }]);
  };

  const clearLogs = () => setLogs([]);

  useEffect(() => {
    connectToSignalling();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (rtcRef.current) rtcRef.current.close();
    };
  }, []);

  // Auto-join if initial session exists
  useEffect(() => {
    if (initialSessionId && status === "ready" && wsRef.current?.readyState === 1) {
       joinSession(initialSessionId);
    }
  }, [initialSessionId, status]);

  const connectToSignalling = () => {
    // Attempt to resolve the signaling URL
    let url = process.env.NEXT_PUBLIC_WS_URL || `ws://localhost:4000/signaling`;
    if (!url.endsWith("/signaling")) url += "/signaling";
    
    console.log("Connecting to:", url);
    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () => {
      addLog("Link established with signaling node", "success");
      setStatus("ready");
    };

    wsRef.current.onclose = () => {
       addLog("Signaling link severed. Retrying in 5s...", "warning");
       setStatus("disconnected");
       setTimeout(connectToSignalling, 5000);
    };

    wsRef.current.onerror = (err) => {
       addLog("WebSocket link error. Check node accessibility.", "error");
       console.error("WS Error:", err);
    };

    wsRef.current.onmessage = async (e) => {
      const data = JSON.parse(e.data);
      switch (data.type) {
        case "SESSION_CREATED":
          sessionIdRef.current = data.sessionId;
          setSessionId(data.sessionId);
          addLog(`Bridge initialized: ${data.sessionId}`, "success");
          toast.success(`Bridge Active: ${data.sessionId}`);
          break;

        case "SESSION_JOINED":
            sessionIdRef.current = data.sessionId;
            setSessionId(data.sessionId);
            addLog(`Joined Bridge: ${data.sessionId}`, "success");
            break;

        case "PEER_READY":
          setPeerId(data.peerId);
          setPeerAlias(data.peerAlias);
          peerAliasRef.current = data.peerAlias;
          addLog(`Handshake Role: ${data.polite ? "POLITE" : "IMPOLITE"}`, "info");
          initRTC(data.peerId, data.polite);
          toast.success(`Node Connected: ${data.peerAlias}`);
          break;

        case "SIGNAL":
          if (data.callAction) {
             const action = data.callAction;
             if (action === "END" || action === "CANCEL" || action === "REJECT") {
                toast(action === "END" ? "Remote Node Severed Feed" : "Call Abandoned", { icon: '📵' });
                stopCallLocally();
             } else if (action === "ACCEPT") {
                setIsOutgoingCall(false);
                setIsCallActive(true);
                toast.success("Voice Handshake Synchronized", { icon: '🎙️' });
             }
          } else if (rtcRef.current) {
             rtcRef.current.handleSignal(data);
          }
          break;
          
        case "SESSION_ERROR":
          toast.error(data.message);
          addLog(`Bridge Error: ${data.message}`, "error");
          break;
          
        case "PEER_DISCONNECTED":
            addLog("Remote node link terminated", "warning");
            toast.error("Peer Disconnected");
            setStatus("ready");
            break;
      }
    };
  };

  const initRTC = (pid, polite = false) => {
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
      const stream = event.streams[0] || new MediaStream([event.track]);
      setIncomingStream(stream);
      setIsIncomingCall(true);
      toast("Incoming Voice Link Detected", { icon: '📞' });
    };

    if (vpnEnabled) rtcRef.current.setVpn(true);
  };

  const handleRTCStatus = (s, details) => {
    let normalized = s.replace("rtc-", "");
    setStatus(normalized);

    if (normalized === "connected") {
      toast.success("E2EE Connection Secured");
    }

    if (normalized === "chat-received") {
      setMessages((prev) => {
        if (prev.some((m) => m.id === details.id)) return prev;
        return [
          ...prev,
          { ...details, side: "remote", sender: details.alias || peerAlias },
        ];
      });
    }

    if (normalized === "file-request-received") {
      setMessages((prev) => [
        ...prev,
        { ...details, type: "file-request", side: "remote", sender: details.alias || peerAlias },
      ]);
      toast(`Incoming File: ${details.fileName}`, { icon: '📂' });
    }

    if (normalized === "file-received") {
      setMessages((prev) => {
        const index = prev.findLastIndex((m) => m.fileName === details.fileName);
        if (index !== -1) {
          const newMessages = [...prev];
          newMessages[index] = { ...newMessages[index], url: details.url, isTransferring: false };
          return newMessages;
        }
        return prev;
      });
      toast.success(`Received: ${details.fileName}`);
    }

    if (normalized === "audio-received") {
      setMessages((prev) => {
        const index = prev.findLastIndex((m) => m.fileName === details.fileName);
        if (index !== -1) {
          const newMessages = [...prev];
          newMessages[index] = { ...newMessages[index], url: details.url, isTransferring: false };
          return newMessages;
        }
        return [...prev, {
          type: "audio-note",
          url: details.url,
          fileName: details.fileName,
          side: "remote",
          sender: details.alias || peerAlias,
          time: new Date().toLocaleTimeString(),
        }];
      });
    }

    if (normalized === "transfer-complete") {
       toast.success("Transfer Completed");
    }
  };

  const sendChatMessage = (msg) => {
    if (rtcRef.current) {
      const id = crypto.randomUUID();
      sendQueue.current.enqueue({ type: 'chat', message: msg, alias, id });
      
      setMessages((prev) => [
        ...prev,
        { id, message: msg, time: new Date().toLocaleTimeString(), side: "local", sender: alias },
      ]);
    } else {
      toast.error("Bridge Offline: Signal failed");
    }
  };

  const startSession = () => {
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: "CREATE_SESSION" }));
    } else {
      toast.error("Signaling Server Unreachable");
    }
  };

  const joinSession = (id) => {
    if (wsRef.current?.readyState === 1 && id) {
      wsRef.current.send(
        JSON.stringify({ type: "JOIN_SESSION", sessionId: id.toUpperCase() }),
      );
    }
  };

  const terminateConnection = () => {
    localStorage.removeItem("vault_session");
    window.location.href = "/";
  };

  useEffect(() => {
    if (rtcRef.current) {
      rtcRef.current.setVpn(vpnEnabled);
      toast(vpnEnabled ? "Secure VPN Routing: ON" : "Secure VPN Routing: OFF", {
        icon: vpnEnabled ? '🛡️' : '🔓',
      });
    }
  }, [vpnEnabled]);

  useEffect(() => {
    // Only flush call state if the connection truly terminates or fails.
    // Avoid flushing during 'connecting' or 'checking' states which occur during renegotiation.
    if (status === "disconnected" || status === "failed") {
       stopCallLocally();
    }
  }, [status]);

  const stopCallLocally = () => {
    if (rtcRef.current && rtcRef.current.localStream) {
       rtcRef.current.localStream.getTracks().forEach(t => t.stop());
       rtcRef.current.localStream = null;
    }
    setIsCallActive(false);
    setIsIncomingCall(false);
    setIsOutgoingCall(false);
    setIncomingStream(null);
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  };

  const acceptCall = () => {
    if (incomingStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = incomingStream;
      remoteAudioRef.current.play().catch(e => console.error("Audio Play Error:", e));
      setIsCallActive(true);
      setIsIncomingCall(false);
      setIsOutgoingCall(false);
      rtcRef.current?.sendCallSignal("ACCEPT");
    }
  };

  const rejectCall = () => {
    rtcRef.current?.sendCallSignal("REJECT");
    stopCallLocally();
  };

  const toggleCall = async () => {
    if (rtcRef.current) {
      const wasActive = isCallActive;
      const wasOutgoing = isOutgoingCall;
      
      if (wasActive || wasOutgoing) {
         rtcRef.current.sendCallSignal(wasOutgoing ? "CANCEL" : "END");
         stopCallLocally();
      } else {
         const success = await rtcRef.current.toggleAudio();
         if (success) {
            setIsOutgoingCall(true);
            toast("Synthesizing Voice Handshake...", { icon: '📟' });
         }
      }
    }
  };

  return {
    isServerConnected: status !== "disconnected",
    vpnEnabled,
    setVpnEnabled,
    status,
    sessionId,
    startSession,
    joinSession,
    messages,
    sendChatMessage,
    handleFileSelect: (e) => {
      const file = e.target.files?.[0];
      if (file && rtcRef.current) {
        const id = crypto.randomUUID();
        sendQueue.current.enqueue({ type: 'file', file, id });

        if (file.name.startsWith("VoiceNote_")) {
          setMessages((prev) => [...prev, {
            type: "audio-note",
            url: URL.createObjectURL(file),
            fileName: file.name,
            side: "local",
            sender: alias,
            time: new Date().toLocaleTimeString(),
          }]);
        } else {
          setMessages((prev) => [...prev, {
            type: "file-request",
            fileName: file.name,
            fileSize: file.size,
            side: "local",
            sender: alias,
            time: new Date().toLocaleTimeString(),
            status: "waiting-for-peer",
          }]);
        }
        if (e.target) e.target.value = null;
      }
    },
    progress,
    logs,
    logContainerRef,
    syncing: status === "connecting" || (status === "ready" && initialSessionId),
    syncConnection: () => {
      addLog("Node link re-sync initiated...", "warning");
      connectToSignalling();
    },
    terminateConnection,
    isCallActive,
    toggleCall,
    remoteAudioRef,
    alias,
    peerAlias,
    acceptFile: (fileName) => rtcRef.current?.acceptFile(fileName),
    rejectFile: (fileName) => rtcRef.current?.rejectFile(fileName),
    clearLogs,
    connectToSignalling,
    isIncomingCall,
    acceptCall,
    rejectCall,
  };
}
