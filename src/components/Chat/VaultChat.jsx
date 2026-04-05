import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  LogOut,
  Hash,
  Phone,
  Terminal,
  Cpu,
  Activity,
  ChevronLeft,
  PhoneOff,
} from "lucide-react";
import Link from "next/link";

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
  isCallActive,
  toggleCall,
  remoteAudioRef,
  handleFileSelect,
  alias,
  peerAlias,
  sessionId,
  terminateConnection,
  progress,
  acceptFile,
  rejectFile,
  isIncomingCall,
  isOutgoingCall,
  acceptCall,
  rejectCall,
}) {
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const file = new File(
          [audioBlob],
          `VoiceNote_${new Date().toISOString().replace(/[:.]/g, "-")}.webm`,
          { type: "audio/webm" },
        );
        handleFileSelect({ target: { files: [file] } });
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
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
    <div className="fixed inset-0 z-[100] bg-[#010602] flex flex-col animate-in overflow-hidden font-mono selection:bg-accent-primary/20">
      
      {/* HUD HEADER - High Density for Mobile */}
      <HeaderHUD 
        sessionId={sessionId}
        status={status}
        alias={alias}
        peerAlias={peerAlias}
        onTerminate={terminateConnection}
        toggleCall={toggleCall}
        isCallActive={isCallActive}
        vpnEnabled={vpnEnabled}
        setVpnEnabled={setVpnEnabled}
      />

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar relative bg-transparent scroll-smooth cyber-grid mx-auto w-full"
      >
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 flex flex-col gap-4 md:gap-8 min-h-full relative">
          
          {/* WHATSAPP STYLE CALL POPUP */}
          {(isIncomingCall || isOutgoingCall || isCallActive) && (
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] max-w-[calc(100vw-32px)]">
               <div className="bg-bg-surface/95 backdrop-blur-3xl border border-accent-primary/20 rounded-full px-6 py-2.5 shadow-[0_0_100px_rgba(0,255,65,0.15)] flex items-center gap-8 animate-in slide-in-from-top-4 duration-500">
                  
                  {isIncomingCall ? (
                    <>
                      <button 
                        onClick={rejectCall} 
                        className="w-11 h-11 rounded-full bg-accent-red/20 border border-accent-red/30 flex items-center justify-center text-accent-red hover:bg-accent-red hover:text-white transition-all active:scale-90 shadow-[0_0_20px_rgba(255,49,49,0.2)]"
                        title="Reject Call"
                      >
                        <PhoneOff className="w-5 h-5" />
                      </button>
                      
                      <div className="flex flex-col items-center">
                        <div className="text-[10px] font-black text-accent-primary uppercase tracking-[0.4em] mb-0.5 animate-pulse">Incoming_Voice_Node</div>
                        <div className="text-xs font-bold text-white uppercase italic tracking-wider">{peerAlias || "REMOTE_NODE"}</div>
                      </div>

                      <button 
                        onClick={acceptCall} 
                        className="w-11 h-11 rounded-full bg-accent-primary flex items-center justify-center text-black hover:scale-110 active:scale-90 transition-all shadow-[0_0_30px_var(--accent-primary-glow)] animate-bounce"
                        title="Accept Call"
                      >
                        <Phone className="w-5 h-5" />
                      </button>
                    </>
                  ) : isOutgoingCall ? (
                    <>
                      {/* PERMANENT WAITING STATE */}
                      <div className="relative flex items-center gap-6 py-2 px-6">
                        <div className="w-14 h-14 rounded-full bg-accent-primary/15 border border-accent-primary/30 flex items-center justify-center text-accent-primary animate-pulse shadow-[0_0_30px_rgba(0,255,65,0.15)]">
                          <Phone className="w-7 h-7 animate-[bounce_1.5s_infinite]" />
                        </div>
                        <div className="flex flex-col min-w-[150px]">
                           <div className="text-[11px] font-black text-accent-primary uppercase tracking-[0.25em] animate-pulse">Waiting_For_Acceptance...</div>
                           <div className="text-sm font-bold text-white uppercase italic tracking-wider">Target: {peerAlias || "REMOTE_NODE"}</div>
                        </div>
                        <div className="w-[1px] h-10 bg-white/10 mx-2"></div>
                        <button 
                          onClick={toggleCall} 
                          className="w-12 h-12 rounded-full bg-accent-red flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,49,49,0.3)]"
                          title="Reject Call"
                        >
                          <PhoneOff className="w-6 h-6" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* ACTIVE CALL STATE */}
                      <div className="flex items-center gap-4">
                         <div className="flex items-end gap-0.5 h-4 mb-1">
                            {[1, 2, 3, 4, 5].map(i => (
                               <div key={i} className="w-1 bg-accent-primary rounded-full animate-bar-dance" style={{ animationDelay: `${i * 0.1}s` }}></div>
                            ))}
                         </div>
                         <div className="flex flex-col">
                            <div className="text-[9px] font-black text-accent-primary uppercase tracking-widest opacity-70">Secured_Feed::Active</div>
                            <div className="text-[11px] font-black text-white uppercase italic tracking-tighter tabular-nums">{peerAlias || "NODE_01"}</div>
                         </div>
                      </div>

                      <button 
                        onClick={toggleCall} 
                        className="w-11 h-11 rounded-full bg-accent-red/20 border border-accent-red/30 flex items-center justify-center text-accent-red hover:bg-accent-red hover:text-white transition-all ml-2 active:scale-95 shadow-[0_0_20px_rgba(255,49,49,0.2)]"
                        title="End Call"
                      >
                        <PhoneOff className="w-5 h-5" />
                      </button>
                    </>
                  )}
               </div>
            </div>
          )}



          <style jsx>{`
            @keyframes bar-dance {
              0%, 100% { height: 4px; }
              50% { height: 16px; }
            }
            .animate-bar-dance {
              animation: bar-dance 1.2s infinite ease-in-out;
            }
          `}</style>


          {/* SYSTEM OVERLAY (HIDDEN ON SMALL) */}
          <div className="absolute top-8 left-8 opacity-10 pointer-events-none hidden xl:block space-y-2 text-[10px] text-accent-primary uppercase tracking-[0.3em]">
             <div className="flex items-center gap-2"><Terminal className="w-3 h-3" /> _PROTOCOL_v4.2.1-SECURE</div>
             <div className="flex items-center gap-2"><Cpu className="w-3 h-3" /> _NODE_STREAM_ACTIVE</div>
          </div>

          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 opacity-30 select-none py-20 grayscale transition-all duration-1000">
              <div className="w-20 h-20 rounded-sm bg-accent-primary/5 flex items-center justify-center border border-accent-primary/20 shadow-[0_0_50px_rgba(0,255,65,0.05)]">
                <MessageSquare className="w-10 h-10 text-accent-primary animate-pulse" />
              </div>
              <div className="text-center group">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent-primary">AWAITING_REMOTE_NODE...</p>
                <div className="mt-2 h-0.5 w-20 bg-accent-primary/20 mx-auto overflow-hidden">
                   <div className="h-full bg-accent-primary animate-[scan_2s_infinite]"></div>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isActiveTransfer =
              (msg.type === "file-request" || msg.type === "audio-note") &&
              i ===
                messages.reduce(
                  (acc, m, idx) =>
                    m.type === "file-request" || m.type === "audio-note"
                      ? idx
                      : acc,
                  -1,
                );

            return (
              <MessageBubble key={msg.id || i} msg={msg} side={msg.side}>
                {msg.type === "file-request" ? (
                  <FileMessage
                    msg={msg}
                    isActiveTransfer={isActiveTransfer}
                    status={status}
                    progress={progress}
                    acceptFile={acceptFile}
                    rejectFile={rejectFile}
                  />
                ) : msg.type === "audio-note" ? (
                  <AudioMessage
                    msg={msg}
                    progress={progress}
                    isActive={isActiveTransfer}
                  />
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
        startRecording={startRecording}
        stopRecording={stopRecording}
        showEmoji={showEmoji}
        setShowEmoji={setShowEmoji}
        status={status}
      />

      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
}

function HeaderHUD({ sessionId, status, alias, peerAlias, onTerminate, toggleCall, isCallActive, vpnEnabled, setVpnEnabled }) {
  return (
    <header className="h-16 border-b border-accent-primary/10 bg-bg-surface/95 backdrop-blur-3xl flex items-center justify-between px-3 sm:px-6 z-[110] relative">
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Back Link */}
        <Link href="/" className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-sm hover:bg-accent-primary/10 text-accent-primary/60 hover:text-accent-primary transition-all">
           <ChevronLeft className="w-5 h-5" />
        </Link>
        
        {/* Node Pair Status */}
        <div className="flex flex-col gap-1 pr-2 sm:pr-4 border-r border-accent-primary/10">
           <div className="flex items-center gap-1.5 opacity-60">
              <span className="text-[7px] font-black text-accent-primary uppercase tracking-tighter">ME:</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-text-primary uppercase truncate max-w-[50px] sm:max-w-[70px]">{alias || "???"}</span>
           </div>
           <div className="flex items-center gap-1.5">
              <span className="text-[7px] font-black text-accent-secondary uppercase tracking-tighter">NODE:</span>
              <span className="text-[9px] sm:text-[10px] font-black text-accent-primary uppercase truncate max-w-[60px] sm:max-w-none">{peerAlias || "SEARCH..."}</span>
           </div>
        </div>
      </div>

      {/* MID SESSION UI */}
      <div className="flex items-center gap-2 bg-bg-base/80 border border-accent-primary/20 rounded-sm px-2.5 py-2 shadow-inner mx-2">
         <Hash className="w-3 h-3 text-accent-primary/20" />
         <span className="text-[9px] sm:text-[10px] font-black text-accent-secondary tracking-widest uppercase tabular-nums">{sessionId}</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button 
           onClick={() => setVpnEnabled(!vpnEnabled)}
           className={`hidden xs:flex items-center justify-center h-8 sm:h-9 px-2.5 border font-black text-[8px] uppercase transition-all ${vpnEnabled ? "bg-accent-primary text-black border-accent-primary shadow-[0_0_10px_var(--accent-primary-glow)]" : "bg-transparent text-accent-primary/30 border-accent-primary/10"}`}
        >
           VPN
        </button>
        
        <button 
          onClick={toggleCall}
          disabled={!['connected', 'transferring', 'downloading'].includes(status)}
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-sm border flex items-center justify-center transition-all group ${isCallActive ? "bg-accent-primary text-black border-accent-primary" : "bg-accent-secondary/5 border-accent-secondary/20 text-white hover:bg-white hover:text-black disabled:opacity-25"}`}
        >
          {isCallActive ? <PhoneOff className="w-4.5 h-4.5 text-red-500" /> : <Phone className="w-4.5 h-4.5 group-active:scale-90" />}
        </button>

        <button 
          onClick={onTerminate}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-sm bg-accent-red/5 border border-accent-red/20 text-accent-red flex items-center justify-center hover:bg-accent-red hover:text-white transition-all active:scale-90"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
}
