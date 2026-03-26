"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronDown, BookOpen, Layers, Terminal as TerminalIcon, X } from "lucide-react";
import useVaultHook from "../hooks/useVault.hook";
import VaultChatComponent from "./VaultChat.component";
import VaultHeaderComponent from "./VaultHeader.component";
import TransmissionCellComponent from "./TransmissionCell.component";
import FileLogsComponent from "./FileLogs.component";
import ActionCardsComponent from "./ActionCards.component";

export default function FileTransfer() {
  const {
    isServerConnected,
    vpnEnabled,
    setVpnEnabled,
    status,
    sessionId,
    startSession,
    joinSession,
    handleFileSelect,
    progress,
    logs,
    logContainerRef,
    vpnIp,
    syncing,
    syncConnection,
    messages,
    sendChatMessage,
    terminateConnection,
    isCallActive,
    toggleCall,
    remoteAudioRef,
    peers,
    alias,
    peerAlias,
    acceptFile,
    rejectFile,
    clearLogs
  } = useVaultHook();

  const [showLogs, setShowLogs] = useState(false);
  const sessionRef = useRef(null);

  const scrollToSession = () => {
    sessionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Chat room is active if we are in a session
  const isInRoom = !!sessionId;

  return (
    <div className="bg-[#000000] min-h-screen text-white selection:bg-blue-500/30">
      
      {/* 1. LANDING PAGE SECTION */}
      {!isInRoom && (
        <div className="h-screen w-full flex flex-col relative overflow-hidden bg-black selection:bg-blue-500/30">
      

          <div className="relative z-10 flex-grow flex flex-col items-center justify-center px-6 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-8">
               <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
               L4 Network Core Active
            </div>
            
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter italic uppercase mb-6 text-white drop-shadow-2xl">
              Share<span className="text-blue-600">Link</span>
            </h1>
            
            <p className="text-gray-400 text-sm md:text-base font-medium tracking-widest uppercase mb-12 max-w-2xl leading-relaxed">
              Decentralized, end-to-end encrypted peer-to-peer data bridge. Establish secure websockets without intermediary data retention.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button 
                onClick={scrollToSession}
                className="w-full sm:w-auto px-10 py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 rounded-xl"
              >
                Get Started
              </button>
              <button 
                className="w-full sm:w-auto px-10 py-4 bg-[#0A0A0A] text-white border border-white/10 font-black uppercase text-xs tracking-[0.2em] hover:bg-white/5 transition-colors flex items-center justify-center gap-3 rounded-xl"
              >
                Read Docs <BookOpen className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="absolute bottom-8 w-full flex justify-center z-20">
             <div 
               onClick={scrollToSession}
               className="cursor-pointer text-white/20 hover:text-white transition-colors animate-bounce p-4"
             >
               <ChevronDown className="w-6 h-6" />
             </div>
          </div>
        </div>
      )}

      {/* 2. MAIN INTERFACE */}
      <div 
        ref={sessionRef}
        className={`min-h-screen transition-all duration-700 ${isInRoom ? 'pt-0' : 'pt-32 pb-20 px-8 max-w-[1200px] mx-auto'}`}
      >
        {!isInRoom ? (
          <>
            <VaultHeaderComponent
              isServerConnected={isServerConnected}
              vpnEnabled={vpnEnabled}
              setVpnEnabled={setVpnEnabled}
              vpnIp={vpnIp}
              syncing={syncing}
              syncConnection={syncConnection}
              status={status}
            />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mt-12 animate-fade-in-up">
              <div className="md:col-span-4 flex flex-col gap-10 h-fit sticky top-32">
                <TransmissionCellComponent
                  status={status}
                  sessionId={sessionId}
                  startSession={startSession}
                  joinSession={joinSession}
                />
              </div>
              
              <div className="md:col-span-8">
                 <ActionCardsComponent />
                 <div className="mt-10 p-10 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-3xl text-center">
                    <h3 className="text-xl font-black text-gray-500 uppercase tracking-widest mb-4 italic">Node Readiness</h3>
                    <p className="text-sm font-bold text-gray-700 max-w-md mx-auto">
                      Initialize a session or provide an access code to establish the secure L4 P2P bridge.
                    </p>
                 </div>
              </div>
            </div>
          </>
        ) : (
          <VaultChatComponent
            messages={messages}
            onSendMessage={sendChatMessage}
            onSendAudio={() => {}}
            status={status}
            isCallActive={isCallActive}
            toggleCall={toggleCall}
            remoteAudioRef={remoteAudioRef}
            handleFileSelect={handleFileSelect}
            peers={peers}
            alias={alias}
            peerAlias={peerAlias}
            sessionId={sessionId}
            terminateConnection={terminateConnection}
            acceptFile={acceptFile}
            rejectFile={rejectFile}
            progress={progress}
          />
        )}
      </div>

      {/* 3. LOGS OVERLAY */}
      <button 
        suppressHydrationWarning
        onClick={() => setShowLogs(true)}
        className="fixed bottom-10 right-10 w-16 h-16 bg-white/5 hover:bg-blue-600 border border-white/10 hover:border-blue-500 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-2xl group active:scale-90 z-[200]"
      >
        <TerminalIcon className="w-6 h-6 text-gray-500 group-hover:text-white transition-colors" />
      </button>

      {showLogs && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-12 backdrop-blur-md bg-black/60 animate-fade-in">
          <div className="w-full max-w-5xl h-full max-h-[80vh] bg-black border border-white/10 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col font-mono">
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
               <div className="flex items-center gap-3 px-2">
                  <TerminalIcon className="w-4 h-4 text-blue-500" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-300">ShareLink // L4 Protocol Monitor</h2>
               </div>
               <button 
                onClick={() => setShowLogs(false)}
                className="w-8 h-8 hover:bg-white/10 rounded flex items-center justify-center transition-colors"
               >
                 <X className="w-4 h-4 text-gray-500" />
               </button>
            </div>

            <div className="flex-grow overflow-hidden bg-[#0A0A0A]">
              <FileLogsComponent
                logs={logs}
                logContainerRef={logContainerRef}
                clearLogs={clearLogs}
                progress={progress}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
