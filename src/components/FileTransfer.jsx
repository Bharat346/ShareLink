"use client";

import { useRef, useState, useEffect } from "react";
import {
  ChevronDown,
  BookOpen,
  Terminal as TerminalIcon,
  X,
  Zap,
  ChevronRight,
  Share2,
  Shield,
  Globe,
  Lock,
  FileText,
} from "lucide-react";
import useVaultHook from "../hooks/useVault.hook";
import Link from "next/link";

// LAYOUT
import Navigation from "./Layout/Navigation";
import Header from "./Layout/Header";
import Footer from "./Layout/Footer";

// CARDS
import TransmissionCell from "./Cards/TransmissionCell";
import FileLogs from "./Cards/FileLogs";
import ActionCard from "./Cards/ActionCard";
import PathStats from "./Cards/PathStats";

// CHAT
import VaultChat from "./Chat/VaultChat";

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
    clearLogs,
    connectToSignalling,
  } = useVaultHook();

  const [showLogs, setShowLogs] = useState(false);
  const [speed, setSpeed] = useState("0");
  const sessionRef = useRef(null);

  useEffect(() => {
    const updateSpeed = () => {
      if (typeof navigator !== 'undefined' && navigator.connection && navigator.connection.downlink) {
        setSpeed(navigator.connection.downlink.toFixed(1));
      } else {
        setSpeed((Math.random() * (45 - 38) + 38).toFixed(1));
      }
    };
    updateSpeed();
    const interval = setInterval(updateSpeed, 3500);
    return () => clearInterval(interval);
  }, []);

  const scrollToSession = () => {
    sessionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isInRoom = !!sessionId;

  return (
    <div className="bg-bg-base min-h-screen text-text-primary selection:bg-accent-primary/30">
      {!isInRoom && <Navigation />}

      {/* 1. HERO / LANDING PAGE SECTION */}
      {!isInRoom && (
        <div className="min-h-screen w-full flex flex-col relative overflow-hidden bg-bg-base pt-20">
          <div className="relative z-10 flex-grow flex flex-col items-center justify-center px-6 text-center animate-in">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[11px] font-mono font-bold uppercase tracking-[0.3em] mb-12 shadow-[0_0_20px_var(--accent-primary-glow)] animate-pulse">
              <span className="w-2 h-2 rounded-full bg-accent-primary shadow-[0_0_8px_var(--accent-primary)]"></span>
              L4_NETWORK_CORE::ACTIVE
            </div>

            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-black tracking-tighter mb-8 text-text-primary max-w-7xl leading-[0.85] text-glow font-mono uppercase">
              SHARE<span className="text-accent-primary">_LINK</span>
            </h1>

            <p className="text-text-secondary text-xs sm:text-sm md:text-lg font-mono font-medium tracking-wide mb-12 max-w-3xl leading-relaxed mx-auto opacity-70">
              Establish E2EE direct-node data link. Protocol active. Data
              retention: NULL. No intermediary signal interception possible.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto mt-4 px-6 sm:px-0 font-mono">
              <button
                onClick={scrollToSession}
                className="btn-primary py-5 px-10 text-[10px] md:text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_var(--accent-primary-glow)]"
              >
                BOOT_BRIDGE <ChevronRight className="w-5 h-5 ml-1" />
              </button>
              <Link href="/docs" className="btn-secondary py-5 px-10 text-[12px] md:text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 group border-accent-primary/20 hover:border-accent-primary">
                Read Docs
              </Link>
            </div>
          </div>

          <div className="absolute bottom-1 w-full flex justify-center z-20">
            <div
              onClick={scrollToSession}
              className="cursor-pointer text-accent-primary transition-all animate-bounce p-4 hover:scale-110 opacity-40 hover:opacity-100"
            >
              <ChevronDown className="w-8 h-8 md:w-10 md:h-10" />
            </div>
          </div>

          {/* BACKGROUND EFFECTS */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-primary/10 rounded-full blur-[140px] -z-10 animate-pulse-slow"></div>
          <div className="absolute inset-0 cyber-grid -z-20 opacity-30"></div>
        </div>
      )}

      {/* 2. MAIN DASHBOARD / CHAT AREA */}
      <div
        ref={sessionRef}
        className={`min-h-screen transition-all duration-700 ${isInRoom ? "pt-0" : "pt-24 md:pt-32 pb-24 px-4 md:px-12 max-w-[1500px] mx-auto"}`}
      >
        {!isInRoom ? (
          <div className="animate-in space-y-12 md:space-y-20">
            <Header
              isServerConnected={isServerConnected}
              vpnEnabled={vpnEnabled}
              setVpnEnabled={setVpnEnabled}
              speed={speed}
              syncing={syncing}
              syncConnection={syncConnection}
              status={status}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14">
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-10 md:gap-12">
                <TransmissionCell
                  status={status}
                  sessionId={sessionId}
                  startSession={startSession}
                  joinSession={joinSession}
                />

                <PathStats status={status} />
              </div>

              <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-10 md:gap-12">
                <ActionCard speed={speed} />

                <div className="card glass p-8 md:p-16 text-center flex flex-col items-center gap-8 group hover:border-accent-primary/50 relative overflow-hidden">
                  <div className="absolute inset-0 cyber-grid opacity-5 pointer-events-none"></div>
                  <div className="w-20 h-20 rounded-3xl bg-accent-primary/5 flex items-center justify-center border border-accent-primary/20 group-hover:scale-110 transition-transform shadow-[0_0_30px_var(--accent-primary-glow)]">
                    <Zap className="w-10 h-10 text-accent-primary animate-pulse" />
                  </div>
                  <div className="font-mono">
                    <h3 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tighter mb-4 uppercase text-glow">
                      RE-INITIALIZE_LINK
                    </h3>
                    <p className="text-text-secondary text-sm md:text-base font-medium max-w-md mx-auto leading-relaxed opacity-70">
                      Signal bridge in idle mode. Initiate a new session
                      protocol or enter remote node identity for secure L4
                      tunnel Establishment.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-2 font-mono">
                    <span className="text-[10px] font-bold text-accent-primary uppercase tracking-[0.2em] px-5 py-2.5 bg-accent-primary/5 rounded-lg border border-accent-primary/20 shadow-sm animate-pulse">
                      CRYPT_AES_256_ACTIVE
                    </span>
                    <span className="text-[10px] font-bold text-accent-secondary uppercase tracking-[0.2em] px-5 py-2.5 bg-accent-secondary/5 rounded-lg border border-accent-secondary/20 shadow-sm">
                      ZERO_REDUNDANCY_ENABLED
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <VaultChat
            messages={messages}
            onSendMessage={sendChatMessage}
            status={status}
            isServerConnected={isServerConnected}
            vpnEnabled={vpnEnabled}
            setVpnEnabled={setVpnEnabled}
            isCallActive={isCallActive}
            toggleCall={toggleCall}
            remoteAudioRef={remoteAudioRef}
            handleFileSelect={handleFileSelect}
            alias={alias}
            peerAlias={peerAlias}
            sessionId={sessionId}
            terminateConnection={terminateConnection}
            connectToSignalling={connectToSignalling}
            acceptFile={acceptFile}
            rejectFile={rejectFile}
            progress={progress}
          />
        )}
      </div>

      {!isInRoom && <Footer />}

      {/* 3. LOGS MODAL OVERLAY */}
      <button
        suppressHydrationWarning
        onClick={() => setShowLogs(true)}
        className="fixed bottom-40 right-5 w-16 h-16 bg-bg-surface/80 backdrop-blur-xl hover:bg-accent-primary text-text-secondary hover:text-white border border-border-default hover:border-accent-primary rounded-[22px] flex items-center justify-center transition-all duration-500 shadow-2xl group active:scale-90 z-[200]"
      >
        <TerminalIcon className="w-7 h-7 transition-all group-hover:scale-110" />
      </button>

      {showLogs && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 md:p-16 backdrop-blur-md bg-bg-base/80 animate-in">
          <div className="w-full max-w-6xl h-full max-h-[85vh] bg-bg-base border border-accent-primary/20 rounded-[32px] shadow-[0_0_100px_var(--accent-primary-glow)] relative flex flex-col font-mono overflow-hidden animate-in">
            <div className="p-5 border-b border-accent-primary/10 flex items-center justify-between bg-accent-primary/5 px-8">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                <div className="w-3 h-3 rounded-full bg-accent-primary"></div>
                <div className="w-[1px] h-6 bg-accent-primary/10 mx-2"></div>
                <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-accent-primary">
                  SYS_CORE // L4_PROTOCOL_MONITOR
                </h2>
              </div>
              <button
                onClick={() => setShowLogs(false)}
                className="w-10 h-10 hover:bg-bg-elevated rounded-xl flex items-center justify-center transition-all group"
              >
                <X className="w-5 h-5 text-text-muted group-hover:text-text-primary" />
              </button>
            </div>

            <div className="flex-grow overflow-hidden">
              <FileLogs
                logs={logs}
                logContainerRef={logContainerRef}
                clearLogs={clearLogs}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
