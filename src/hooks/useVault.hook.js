import { useState, useEffect, useRef } from "react";
import { FileTransferManager } from "../lib/webrtc";
import { MessageQueue } from "../lib/queue";
import { toast } from "react-hot-toast";

// Modular vault actions
import { connectToSignalling } from "./vault/useSignaling";
import { startSession as _startSession, joinSession as _joinSession, terminateConnection } from "./vault/useSessionActions";
import { stopCallLocally as _stopCallLocally, acceptCall as _acceptCall, rejectCall as _rejectCall, toggleCall as _toggleCall } from "./vault/useCallActions";
import { handleRTCStatus as _handleRTCStatus, waitForConnection } from "./vault/useRTCHandler";

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

  const [peerId, setPeerId] = useState("");
  const [peerAlias, setPeerAlias] = useState("");
  const peerAliasRef = useRef("");

  const wsRef = useRef(null);
  const rtcRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [clientId, setClientId] = useState(null);
  const [alias, setAlias] = useState("");

  useEffect(() => {
    const savedId = sessionStorage.getItem("vault_node_id");
    const savedAlias = sessionStorage.getItem("vault_node_alias");
    setClientId(savedId);
    if (savedAlias && savedAlias !== "SEARCHING...") setAlias(savedAlias);
    else setAlias("SEARCHING...");
  }, []);

  const sessionIdRef = useRef(initialSessionId || "");
  const [sessionId, setSessionId] = useState(initialSessionId || "");

  // --- Message Queue (lazy init) ---
  const sendQueue = useRef(null);
  if (!sendQueue.current) {
    sendQueue.current = new MessageQueue(async (payload) => {
      if (!rtcRef.current?.dataChannel || rtcRef.current.dataChannel.readyState !== "open") {
        throw new Error("RTC_LINK_OFFLINE");
      }
      if (payload.type === "chat") {
        const success = await rtcRef.current.sendChat(payload.message, payload.alias, payload.id);
        if (!success) return false;
      } else if (payload.type === "file") {
        const success = await rtcRef.current.sendFile(payload.file);
        if (!success) { toast.error("Transmission Interrupted", { id: payload.id }); return false; }
      }
      return true;
    });
  }

  // --- Helpers ---
  const addLog = (msg, type = "info") => {
    setLogs((prev) => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };
  const clearLogs = () => setLogs([]);

  const stopCallLocallyFn = () => _stopCallLocally(rtcRef, setIsCallActive, setIsIncomingCall, setIsOutgoingCall, setIncomingStream, remoteAudioRef);

  // --- Signaling message handler ---
  const signalQueue = useRef([]);

  const onWsMessage = async (e) => {
    const data = JSON.parse(e.data);
    switch (data.type) {
      case "PONG": break;
      case "ASSIGNED_IP":
        setClientId(data.clientId);
        setAlias(data.alias);
        sessionStorage.setItem("vault_node_id", data.clientId);
        sessionStorage.setItem("vault_node_alias", data.alias);
        break;
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
        if (rtcRef.current?.pc.connectionState === "connected" && peerId === data.peerId) break;
        setPeerId(data.peerId);
        setPeerAlias(data.peerAlias);
        peerAliasRef.current = data.peerAlias;
        addLog(`Handshake Role: ${data.polite ? "POLITE" : "IMPOLITE"}`, "info");
        try {
          await initRTC(data.peerId, data.polite);
          await waitForConnection(rtcRef);
          toast.success(`Node Operational: ${data.peerAlias}`);
        } catch (err) {
          console.warn("Handshake stalled or aborted:", err.message);
        }
        break;
      case "SIGNAL":
        if (rtcRef.current) rtcRef.current.handleSignal(data);
        else signalQueue.current.push(data);
        if (data.callAction) {
          const action = data.callAction;
          if (action === "CALL_INITIATE") setIsIncomingCall(true);
          else if (["END", "CANCEL", "REJECT"].includes(action)) {
            toast(action === "END" ? "Remote Node Severed Feed" : "Call Abandoned", { icon: "📵" });
            stopCallLocallyFn();
          } else if (action === "ACCEPT") {
            setIsOutgoingCall(false);
            setIsCallActive(true);
            toast.success("Voice Handshake Synchronized", { icon: "🎙️" });
          }
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

  // --- RTC Init ---
  const initRTC = async (pid, polite = false) => {
    if (rtcRef.current) rtcRef.current.close();
    rtcRef.current = new FileTransferManager(
      (m, t) => addLog(`[P2P] ${m}`, t),
      (s, details) => _handleRTCStatus(s, details, setStatus, setMessages, peerAlias),
      (p) => setProgress(p),
    );
    rtcRef.current.initPeerConnection((signal) => {
      if (wsRef.current?.readyState === 1) {
        wsRef.current.send(JSON.stringify({ type: "SIGNAL", targetId: pid, ...signal, sessionId: sessionIdRef.current }));
      }
    }, polite);
    rtcRef.current.pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      setIncomingStream(stream);
      setIsIncomingCall(true);
      toast("Incoming Voice Link Detected", { icon: "📞" });
    };
    if (vpnEnabled) rtcRef.current.setVpn(true);
    if (signalQueue.current.length > 0) {
      signalQueue.current.forEach((s) => rtcRef.current.handleSignal(s));
      signalQueue.current = [];
    }
    return true;
  };

  // --- Lifecycle ---
  useEffect(() => {
    connectToSignalling(wsRef, addLog, setStatus, onWsMessage);
    return () => {
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
      if (rtcRef.current) rtcRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (initialSessionId && status === "ready" && wsRef.current?.readyState === 1) {
      _joinSession(wsRef, initialSessionId);
    }
  }, [initialSessionId, status]);

  useEffect(() => {
    if (rtcRef.current) {
      rtcRef.current.setVpn(vpnEnabled);
      toast(vpnEnabled ? "Secure VPN Routing: ON" : "Secure VPN Routing: OFF", { icon: vpnEnabled ? "🛡️" : "🔓" });
    }
  }, [vpnEnabled]);

  useEffect(() => {
    if (status === "disconnected" || status === "failed") stopCallLocallyFn();
  }, [status]);

  useEffect(() => {
    if (isCallActive && incomingStream && remoteAudioRef.current) {
      if (remoteAudioRef.current.srcObject !== incomingStream) {
        remoteAudioRef.current.srcObject = incomingStream;
      }
      const playPromise = remoteAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          if (e.name !== "AbortError") console.error("Audio Play Error:", e);
        });
      }
    }
  }, [isCallActive, incomingStream]);

  // --- Chat ---
  const sendChatMessage = (msg) => {
    const isReady = rtcRef.current?.dataChannel?.readyState === "open";
    if (isReady) {
      const id = crypto.randomUUID();
      sendQueue.current.enqueue({ type: "chat", message: msg, alias, id });
      setMessages((prev) => [...prev, { id, message: msg, time: new Date().toLocaleTimeString(), side: "local", sender: alias }]);
    } else {
      toast.error("Bridge Offline: Peer not connected");
    }
  };

  // --- Return ---
  return {
    isServerConnected: status !== "disconnected",
    vpnEnabled, setVpnEnabled, status, sessionId,
    startSession: () => _startSession(wsRef),
    joinSession: (id) => _joinSession(wsRef, id),
    messages, sendChatMessage,
    handleFileSelect: (e) => {
      const file = e.target.files?.[0];
      if (file && rtcRef.current) {
        const id = crypto.randomUUID();
        sendQueue.current.enqueue({ type: "file", file, id });
        if (file.name.startsWith("VoiceNote_")) {
          setMessages((prev) => [...prev, { type: "audio-note", url: URL.createObjectURL(file), fileName: file.name, side: "local", sender: alias, time: new Date().toLocaleTimeString() }]);
        } else {
          setMessages((prev) => [...prev, { type: "file-request", fileName: file.name, fileSize: file.size, side: "local", sender: alias, time: new Date().toLocaleTimeString(), status: "waiting-for-peer" }]);
        }
        if (e.target) e.target.value = null;
      }
    },
    progress, logs, logContainerRef,
    syncing: status === "connecting" || (status === "ready" && initialSessionId),
    syncConnection: () => { addLog("Node link re-sync initiated...", "warning"); connectToSignalling(wsRef, addLog, setStatus, onWsMessage); },
    terminateConnection,
    isCallActive,
    toggleCall: () => _toggleCall(rtcRef, isCallActive, isOutgoingCall, setIsOutgoingCall, stopCallLocallyFn),
    remoteAudioRef, alias, peerAlias,
    acceptFile: (fileName) => rtcRef.current?.acceptFile(fileName),
    rejectFile: (fileName) => rtcRef.current?.rejectFile(fileName),
    clearLogs,
    connectToSignalling: () => connectToSignalling(wsRef, addLog, setStatus, onWsMessage),
    isIncomingCall,
    isOutgoingCall,
    acceptCall: () => _acceptCall(incomingStream, remoteAudioRef, rtcRef, setIsCallActive, setIsIncomingCall, setIsOutgoingCall),
    rejectCall: () => _rejectCall(rtcRef, stopCallLocallyFn),
  };
}
