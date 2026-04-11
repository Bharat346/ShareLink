/**
 * useVaultHook - Central connection state manager for the web app
 *
 * FIXES:
 * - Fixed stale closure in onWsMessage (peerId/peerAlias now use refs)
 * - Added RTC init lock to prevent concurrent initRTC() calls
 * - Fixed reconnection cleanup (clears ping interval properly)
 * - Message deduplication for chat messages
 * - Proper cleanup on unmount
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { FileTransferManager } from "../lib/webrtc";
import { MessageQueue } from "../lib/queue";
import { toast } from "react-hot-toast";

// Modular vault actions
import { connectToSignalling } from "./vault/useSignaling";
import {
  startSession as _startSession,
  joinSession as _joinSession,
  terminateConnection,
} from "./vault/useSessionActions";
import {
  stopCallLocally as _stopCallLocally,
  acceptCall as _acceptCall,
  rejectCall as _rejectCall,
  toggleCall as _toggleCall,
} from "./vault/useCallActions";
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

  // Use refs for values accessed in callbacks to avoid stale closures
  const [peerId, setPeerId] = useState("");
  const [peerAlias, setPeerAlias] = useState("");
  const peerIdRef = useRef("");
  const peerAliasRef = useRef("");

  const wsRef = useRef(null);
  const rtcRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [clientId, setClientId] = useState(null);
  const [alias, setAlias] = useState("");

  // RTC init lock to prevent concurrent initRTC() calls
  const rtcInitLock = useRef(false);

  useEffect(() => {
    const savedId = sessionStorage.getItem("vault_node_id");
    const savedAlias = sessionStorage.getItem("vault_node_alias");
    setClientId(savedId);
    if (savedAlias && savedAlias !== "SEARCHING...") setAlias(savedAlias);
    else setAlias("SEARCHING...");
  }, []);

  const sessionIdRef = useRef(initialSessionId || "");
  const [sessionId, setSessionId] = useState(initialSessionId || "");
  const vpnEnabledRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { vpnEnabledRef.current = vpnEnabled; }, [vpnEnabled]);

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
        if (!success) {
          toast.error("Transmission Interrupted", { id: payload.id });
          return false;
        }
      }
      return true;
    });
  }

  // --- Helpers ---
  const addLog = useCallback((msg, type = "info") => {
    setLogs((prev) => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  }, []);
  const clearLogs = useCallback(() => setLogs([]), []);

  const stopCallLocallyFn = useCallback(() => {
    _stopCallLocally(rtcRef, setIsCallActive, setIsIncomingCall, setIsOutgoingCall, setIncomingStream, remoteAudioRef);
  }, []);

  // --- Signaling message handler ---
  const signalQueue = useRef([]);

  // Use ref for the message handler to avoid stale closures
  const onWsMessageRef = useRef(null);
  onWsMessageRef.current = async (e) => {
    let data;
    try {
      data = JSON.parse(e.data);
    } catch {
      return;
    }

    switch (data.type) {
      case "PONG":
        break;
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
        // Guard: Skip if already connected to this peer
        if (
          rtcRef.current?.pc?.connectionState === "connected" &&
          peerIdRef.current === data.peerId
        ) {
          break;
        }
        setPeerId(data.peerId);
        peerIdRef.current = data.peerId;
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
          if (action === "CALL_INITIATE") {
            // Guard: don't show incoming UI if we are already calling
            if (!isOutgoingCall && !isCallActive) {
              setIsIncomingCall(true);
            }
          } else if (["END", "CANCEL", "REJECT"].includes(action)) {
            toast(action === "END" ? "Feed Severed" : "Call Rebuffed", { icon: "📵" });
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

  // Wrapper that delegates to the ref (always uses latest closure)
  const onWsMessage = useCallback((e) => {
    onWsMessageRef.current?.(e);
  }, []);

  // --- RTC Init (guarded) ---
  const initRTC = async (pid, polite = false) => {
    // Prevent concurrent initialization
    if (rtcInitLock.current) {
      addLog("RTC init already in progress, skipping", "warning");
      return false;
    }
    rtcInitLock.current = true;

    try {
      // Clean up previous connection
      if (rtcRef.current) {
        rtcRef.current.close();
        rtcRef.current = null;
      }

      rtcRef.current = new FileTransferManager(
        (m, t) => addLog(`[P2P] ${m}`, t),
        (s, details) =>
          _handleRTCStatus(
            s,
            details,
            setStatus,
            setMessages,
            peerAliasRef.current,
            (id) => sendQueue.current?.markAsAcknowledged(id)
          ),
        (p) => setProgress(p)
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
        toast("Incoming Voice Link Detected", { icon: "📞" });
      };

      if (vpnEnabledRef.current) rtcRef.current.setVpn(true);

      // Flush queued signals atomically
      const queuedSignals = [...signalQueue.current];
      signalQueue.current = [];
      queuedSignals.forEach((s) => rtcRef.current.handleSignal(s));

      return true;
    } finally {
      rtcInitLock.current = false;
    }
  };

  // --- Lifecycle ---
  useEffect(() => {
    connectToSignalling(wsRef, addLog, setStatus, onWsMessage);
    return () => {
      if (wsRef.current) {
        if (wsRef.current.pingInterval) clearInterval(wsRef.current.pingInterval);
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
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
      toast(vpnEnabled ? "Secure VPN Routing: ON" : "Secure VPN Routing: OFF", {
        icon: vpnEnabled ? "🛡️" : "🔓",
      });
    }
  }, [vpnEnabled]);

  useEffect(() => {
    if (status === "disconnected" || status === "failed") stopCallLocallyFn();
  }, [status, stopCallLocallyFn]);

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

  // --- Chat (direct send, no queue blocking) ---
  const sendChatMessage = useCallback((msg) => {
    const isReady = rtcRef.current?.dataChannel?.readyState === "open";
    if (isReady) {
      const id = crypto.randomUUID();
      // Send directly - DataChannel is ordered+reliable (SCTP/TCP-like)
      // The ACK queue was blocking and dropping messages
      rtcRef.current.sendChat(msg, alias, id);
      setMessages((prev) => [
        ...prev,
        { id, message: msg, time: new Date().toLocaleTimeString(), side: "local", sender: alias },
      ]);
    } else {
      toast.error("Bridge Offline: Peer not connected");
    }
  }, [alias]);

  // --- Return ---
  return {
    isServerConnected: status !== "disconnected",
    vpnEnabled,
    setVpnEnabled,
    status,
    sessionId,
    startSession: () => _startSession(wsRef),
    joinSession: (id) => _joinSession(wsRef, id),
    messages,
    sendChatMessage,
    handleFileSelect: (e) => {
      const file = e.target.files?.[0];
      if (file && rtcRef.current) {
        const id = crypto.randomUUID();
        sendQueue.current.enqueue({ type: "file", file, id });
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
            },
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
              status: "waiting-for-peer",
            },
          ]);
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
      connectToSignalling(wsRef, addLog, setStatus, onWsMessage);
    },
    terminateConnection,
    isCallActive,
    toggleCall: () => _toggleCall(rtcRef, isCallActive, isOutgoingCall, setIsOutgoingCall, stopCallLocallyFn),
    remoteAudioRef,
    alias,
    peerAlias,
    acceptFile: (fileName) => rtcRef.current?.acceptFile(fileName),
    rejectFile: (fileName) => rtcRef.current?.rejectFile(fileName),
    clearLogs,
    connectToSignalling: () => connectToSignalling(wsRef, addLog, setStatus, onWsMessage),
    isIncomingCall,
    isOutgoingCall,
    acceptCall: () =>
      _acceptCall(incomingStream, remoteAudioRef, rtcRef, setIsCallActive, setIsIncomingCall, setIsOutgoingCall),
    rejectCall: () => _rejectCall(rtcRef, stopCallLocallyFn),
  };
}
