import { useState, useRef, useEffect } from "react";
import {
  MessageSquare, LogOut, Hash, Phone, ChevronLeft, PhoneOff, Loader2, Shield
} from "lucide-react";
import Link from "next/link";

import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import AudioMessage from "./AudioMessage";
import FileMessage from "./FileMessage";

export default function VaultChat({
  messages, onSendMessage, status, isServerConnected,
  vpnEnabled, setVpnEnabled, isCallActive, toggleCall,
  remoteAudioRef, handleFileSelect, alias, peerAlias,
  sessionId, terminateConnection, progress, acceptFile,
  rejectFile, isIncomingCall, isOutgoingCall, acceptCall, rejectCall,
}) {
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, progress]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([audioBlob], `VoiceNote_${new Date().toISOString().replace(/[:.]/g, "-")}.webm`, { type: "audio/webm" });
        handleFileSelect({ target: { files: [file] } });
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.start();
    } catch (err) { console.error("Error accessing microphone:", err); }
  };

  const stopRecording = () => { if (mediaRecorderRef.current) mediaRecorderRef.current.stop(); };

  const handleSend = () => {
    if (input.trim()) { onSendMessage(input); setInput(""); setShowEmoji(false); }
  };

  const isConnecting = !peerAlias || status === "ready" || status === "disconnected";

  return (
    <div className="fixed inset-0 z-[100] bg-[#020c06] flex flex-col overflow-hidden font-mono">

      {/* ─── HEADER ─── */}
      <header className="h-14 sm:h-16 border-b border-[#1a4d29] bg-[#0a1f11] flex items-center justify-between px-3 sm:px-5 z-[110] shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-md text-[#41b868] hover:text-accent-primary hover:bg-[#153d23] transition-all">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col gap-0.5 border-l border-[#1a4d29] pl-3">
            <span className="text-[9px] text-[#41b868] font-medium uppercase tracking-[0.15em]">{alias || "..."}</span>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnecting ? "bg-yellow-500/60 animate-pulse" : "bg-accent-primary"}`} />
              <span className="text-[10px] sm:text-[11px] font-bold text-[#e0ffe0] uppercase tracking-wider truncate max-w-[100px] sm:max-w-[160px]">
                {peerAlias || "Connecting..."}
              </span>
            </div>
          </div>
        </div>

        {/* Session ID (center - desktop only) */}
        <div className="hidden sm:flex items-center gap-2 bg-[#05170b] border border-[#1a4d29] rounded-md px-3 py-1.5">
          <Hash className="w-3 h-3 text-[#2d8248]" />
          <span className="text-[9px] font-bold text-[#41b868] tracking-[0.2em] uppercase tabular-nums">{sessionId}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setVpnEnabled(!vpnEnabled)}
            className={`flex h-8 px-2 sm:px-3 rounded-md border text-[8px] font-bold uppercase tracking-wider items-center gap-1 sm:gap-1.5 transition-all ${vpnEnabled ? "bg-[#153d23] text-accent-primary border-accent-primary" : "text-[#85d69e] border-[#1a4d29] hover:border-[#2d8248]"}`}
          >
            <Shield className="w-3 h-3" />
            <span className="hidden sm:inline">VPN</span>
          </button>
          <button
            onClick={toggleCall}
            disabled={status === "disconnected" || status === "ready" || status === "failed" || !status}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md border flex items-center justify-center transition-all ${isCallActive ? "bg-[#153d23] border-accent-primary text-accent-primary" : "border-[#1a4d29] text-[#85d69e] hover:text-[#e0ffe0] disabled:opacity-50"}`}
          >
            {isCallActive ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          </button>
          <button
            onClick={terminateConnection}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-md border border-red-500/10 text-red-500/40 flex items-center justify-center hover:bg-red-500/5 hover:text-red-500 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── CALL OVERLAY ─── */}
      {(isIncomingCall || isOutgoingCall || isCallActive) && (
        <div className="fixed inset-0 z-[500] bg-[#020c06]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-8 max-w-sm w-full">
            {/* Avatar */}
            <div className="relative">
              <div className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 flex items-center justify-center ${isCallActive ? "border-accent-primary" : "border-[#153d23] animate-pulse"}`}>
                <Phone className={`w-10 h-10 sm:w-14 sm:h-14 ${isCallActive ? "text-accent-primary" : "text-[#41b868]"}`} />
              </div>
              {!isCallActive && (
                <span className="absolute -top-1 -right-1 bg-accent-primary text-black text-[8px] font-bold px-2 py-0.5 rounded-md animate-pulse uppercase tracking-wider">
                  {isIncomingCall ? "Incoming" : "Ringing"}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-4xl font-black text-[#e0ffe0] uppercase tracking-wider">{peerAlias || "Peer"}</h2>
              <p className="text-[10px] text-[#41b868] uppercase tracking-[0.4em] font-medium">
                {isCallActive ? "Call Active" : isIncomingCall ? "Incoming Voice Call" : "Calling..."}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 w-full">
              {isIncomingCall && !isCallActive && (
                <button onClick={acceptCall} className="flex-1 h-14 rounded-md bg-[#00ff41] hover:bg-[#00cc33] text-[#020c06] font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 transition-all shadow-none">
                  <Phone className="w-5 h-5 fill-current" /> Accept
                </button>
              )}
              <button
                onClick={isIncomingCall ? (isCallActive ? toggleCall : rejectCall) : toggleCall}
                className="flex-1 h-14 rounded-md bg-[#0f2e1a] hover:bg-[#153d23] border border-red-500/50 text-red-500 font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 transition-all shadow-none"
              >
                <PhoneOff className="w-5 h-5" /> {isCallActive ? "End" : "Cancel"}
              </button>
            </div>

            {/* TTL Bar */}
            {!isCallActive && (
              <div className="w-full h-0.5 bg-[#153d23] rounded-full overflow-hidden">
                <div className="h-full bg-accent-primary animate-[shrink_20s_linear] origin-left" />
              </div>
            )}
          </div>

          <style jsx>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
        </div>
      )}

      {/* ─── CONNECTING OVERLAY ─── */}
      {isConnecting && (
        <div className="absolute inset-0 z-[105] bg-[#020c06]/90 flex flex-col items-center justify-center gap-4 pointer-events-none">
          <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
          <p className="text-[10px] text-[#41b868] uppercase tracking-[0.3em] font-medium">
            {status === "disconnected" ? "Connecting to Signal..." : "Waiting for Peer..."}
          </p>
        </div>
      )}

      {/* ─── MESSAGE FEED ─── */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar scroll-smooth">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4 min-h-full">
          {messages.length === 0 && !isConnecting && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 select-none py-20">
              <MessageSquare className="w-12 h-12 text-[#153d23]" />
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#2d8248]">Start a Conversation</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isActiveTransfer =
              (msg.type === "file-request" || msg.type === "audio-note") &&
              i === messages.reduce((acc, m, idx) => (m.type === "file-request" || m.type === "audio-note" ? idx : acc), -1);

            return (
              <MessageBubble key={msg.id || i} msg={msg} side={msg.side}>
                {msg.type === "file-request" ? (
                  <FileMessage msg={msg} isActiveTransfer={isActiveTransfer} status={status} progress={progress} acceptFile={acceptFile} rejectFile={rejectFile} />
                ) : msg.type === "audio-note" ? (
                  <AudioMessage msg={msg} progress={progress} isActive={isActiveTransfer} />
                ) : null}
              </MessageBubble>
            );
          })}
        </div>
      </div>

      {/* ─── INPUT ─── */}
      <ChatInput
        input={input} setInput={setInput} handleSend={handleSend}
        handleFileSelect={handleFileSelect} startRecording={startRecording}
        stopRecording={stopRecording} showEmoji={showEmoji}
        setShowEmoji={setShowEmoji} status={status}
      />

      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
}
