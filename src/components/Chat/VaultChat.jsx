import { useState, useRef, useEffect } from "react";
import { MessageSquare, PhoneOff, LogOut, Menu, X, Hash, Phone } from "lucide-react";

import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import AudioMessage from "./AudioMessage";
import FileMessage from "./FileMessage";

export default function VaultChat({
  messages,
  onSendMessage,
  status,
  isServerConnected,
  vpnEnabled,
  setVpnEnabled,
  connectToSignalling,
  isCallActive,
  toggleCall,
  remoteAudioRef,
  handleFileSelect,
  acceptFile,
  rejectFile,
  alias,
  peerAlias,
  sessionId,
  terminateConnection,
  progress
}) {
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `VoiceNote_${new Date().toISOString().replace(/[:.]/g,'-')}.webm`, { type: 'audio/webm' });
        handleFileSelect({ target: { files: [file] } });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
      setShowEmoji(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#010402] flex flex-col animate-in overflow-hidden font-inter">
      <ChatHeader 
        alias={alias}
        peerAlias={peerAlias}
        status={status}
        isServerConnected={isServerConnected}
        vpnEnabled={vpnEnabled}
        setVpnEnabled={setVpnEnabled}
        connectToSignalling={connectToSignalling}
        sessionId={sessionId}
        isCallActive={isCallActive}
        toggleCall={toggleCall}
        terminateConnection={terminateConnection}
        setShowMobileMenu={setShowMobileMenu}
        showMobileMenu={showMobileMenu}
      />

      {/* MOBILE MENU OVERLAY */}
      {showMobileMenu && (
        <div className="absolute top-16 right-4 w-64 bg-bg-surface/95 backdrop-blur-3xl border border-accent-primary/20 rounded-2xl p-5 flex flex-col gap-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50 md:hidden animate-in origin-top-right font-mono">
          <div className="flex flex-col border-b border-accent-primary/10 pb-4">
             <span className="text-[9px] font-bold text-accent-primary/50 uppercase tracking-[0.3em] mb-2">SESSION_ID_L4</span>
             <div className="flex items-center justify-between bg-bg-base/60 px-4 py-3 rounded-xl border border-accent-primary/10">
                <Hash className="w-4 h-4 text-accent-primary opacity-50" />
                <span className="text-base font-bold text-text-primary tracking-widest uppercase leading-none">{sessionId}</span>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button 
               onClick={() => { toggleCall(); setShowMobileMenu(false); }}
               disabled={status !== 'connected'}
               className={`w-full py-5 rounded-xl flex flex-col items-center justify-center gap-2 transition-all font-bold text-[9px] uppercase tracking-widest border ${isCallActive ? 'bg-accent-red border-accent-red text-white' : 'bg-bg-base text-accent-secondary border-accent-secondary/20'}`}
             >
               {isCallActive ? <PhoneOff className="w-4.5 h-4.5" /> : <Phone className="w-4.5 h-4.5" />}
               {isCallActive ? 'CLOSE' : 'CALL'}
             </button>
             <button 
               onClick={terminateConnection}
               className="w-full py-5 bg-bg-base border border-red-500/20 text-red-500 bg-red-100 hover:bg-red-500 hover:text-white rounded-xl flex flex-col items-center justify-center gap-2 transition-all font-bold text-[9px] uppercase tracking-widest"
             >
               <LogOut className="w-4.5 h-4.5" /> KILL_LINK
             </button>
          </div>
        </div>
      )}

      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto custom-scrollbar relative bg-[#020617] scroll-smooth cyber-grid"
      >
        <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col gap-6 md:gap-8 min-h-full relative">
          {/* AMBIENT LOGS (FLOATING) */}
          <div className="absolute top-4 left-4 opacity-10 pointer-events-none hidden lg:block font-mono text-[10px] space-y-1">
             <p className="animate-pulse">_INIT_VAULT_PROTOCOL...</p>
             <p>_STREAMS_ACTIVE: 0x42f</p>
             <p>_CRYPT_MODE: AES-256-GCM</p>
          </div>

          {messages.length === 0 && (
             <div className="flex flex-grow flex-col items-center justify-center gap-5 opacity-40 select-none scale-75 md:scale-100 animate-pulse-slow">
                <div className="w-24 h-24 rounded-3xl bg-accent-primary/5 flex items-center justify-center border border-accent-primary/20 shadow-[0_0_30px_var(--accent-primary-glow)] crt-flicker">
                  <MessageSquare className="w-12 h-12 text-accent-primary" />
                </div>
             </div>
          )}

          {messages.map((msg, i) => {
            const isActiveTransfer = (msg.type === 'file-request' || msg.type === 'audio-note') && 
                  i === messages.reduce((acc, m, idx) => (m.type === 'file-request' || m.type === 'audio-note') ? idx : acc, -1);

            return (
              <MessageBubble key={msg.id || i} msg={msg} side={msg.side}>
                {msg.type === 'file-request' ? (
                  <FileMessage 
                     msg={msg} 
                     isActiveTransfer={isActiveTransfer} 
                     status={status} 
                     progress={progress} 
                     acceptFile={acceptFile} 
                     rejectFile={rejectFile} 
                  />
                ) : msg.type === 'audio-note' ? (
                  <AudioMessage msg={msg} progress={progress} isActive={isActiveTransfer} />
                ) : null}
              </MessageBubble>
            );
          })}
        </div>
      </div>

      <ChatInput 
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        handleFileSelect={handleFileSelect}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
        showEmoji={showEmoji}
        setShowEmoji={setShowEmoji}
        status={status}
      />
      
      {/* AMBIENT CRT OVERLAY */}
      <div className="fixed inset-0 pointer-events-none crt-flicker opacity-[0.03] bg-gradient-to-b from-transparent via-accent-primary/5 to-transparent z-[200]"></div>
      
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
}
