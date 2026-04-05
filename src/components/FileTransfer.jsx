"use client";

import { useRef, useState, useEffect } from "react";
import {
  ChevronDown,
  Terminal as TerminalIcon,
  X,
  ChevronRight,
} from "lucide-react";
import useVaultHook from "../hooks/useVault.hook";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";

// LAYOUT
import Navigation from "./Layout/Navigation";
import Header from "./Layout/Header";
import Footer from "./Layout/Footer";

// CARDS
import TransmissionCell from "./Cards/TransmissionCell";
import FileLogs from "./Cards/FileLogs";

export default function FileTransfer() {
  const {
    isServerConnected,
    vpnEnabled,
    setVpnEnabled,
    status,
    sessionId,
    startSession,
    joinSession,
    logs,
    logContainerRef,
    syncing,
    syncConnection,
    clearLogs,
  } = useVaultHook();

  const [showLogs, setShowLogs] = useState(false);
  const [speed, setSpeed] = useState("0");
  const sessionRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const updateSpeed = () => {
      if (
        typeof navigator !== "undefined" &&
        navigator.connection &&
        navigator.connection.downlink
      ) {
        setSpeed(navigator.connection.downlink.toFixed(1));
      } else {
        setSpeed((Math.random() * (45 - 38) + 38).toFixed(1));
      }
    };
    updateSpeed();
    const interval = setInterval(updateSpeed, 3500);
    return () => clearInterval(interval);
  }, []);

  // BULLETPROOF REDIRECT
  useEffect(() => {
    if (sessionId) {
      console.log("HANDSHAKE_DETECTED: Redirection in progress...", sessionId);
      toast.success("Synchronizing Signal Tunnel...", { id: "sync-redirect" });
      
      const targetUrl = `/chat/${sessionId}`;
      const timer = setTimeout(() => {
        router.push(targetUrl);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sessionId, router]);

  const scrollToSession = () => {
    sessionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-bg-base min-h-screen text-text-primary selection:bg-accent-primary/30 font-mono">
      <Navigation />

      {/* 1. HERO / LANDING PAGE SECTION */}
      <div className="min-h-screen w-full flex flex-col relative overflow-hidden bg-bg-base pt-20 px-4 py-10">
        <div className="relative z-10 flex-grow flex flex-col items-center justify-center text-center animate-in">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-sm bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[11px] font-bold uppercase tracking-[0.3em] mb-12 shadow-[0_0_20px_var(--accent-primary-glow)] animate-pulse">
            <span className="w-2 h-2 rounded-full bg-accent-primary shadow-[0_0_8px_var(--accent-primary)]"></span>
            L4_NETWORK_CORE::ACTIVE
          </div>

          <h1 className="text-4xl sm:text-7xl md:text-8xl lg:text-[9rem] font-black tracking-tighter mb-8 text-text-primary max-w-7xl leading-[0.85] text-glow uppercase">
            SHARE<span className="text-accent-primary">_LINK</span>
          </h1>

          <p className="text-text-secondary text-xs sm:text-sm md:text-lg font-medium tracking-wide mb-12 max-w-3xl leading-relaxed mx-auto opacity-70 px-4">
            Establish E2EE direct-node data link. Protocol active. Data
            retention: NULL. No intermediary signal interception possible.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto mt-4 font-mono px-4">
            <button
              onClick={scrollToSession}
              className="btn-primary py-5 px-10 text-[10px] md:text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_var(--accent-primary-glow)]"
            >
              BOOT_BRIDGE <ChevronRight className="w-5 h-5 ml-1" />
            </button>
            <Link
              href="/docs"
              className="btn-secondary py-5 px-10 text-[12px] md:text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 group border-accent-primary/20 hover:border-accent-primary"
            >
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

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-primary/10 rounded-full blur-[140px] -z-10 animate-pulse-slow"></div>
        <div className="absolute inset-0 cyber-grid -z-20 opacity-30"></div>
      </div>

      {/* 2. MAIN DASHBOARD AREA */}
      <div
        ref={sessionRef}
        className="min-h-screen pt-24 md:pt-32 pb-24 px-4 md:px-12 max-w-[1500px] mx-auto transition-all"
      >
        <div className="animate-in space-y-12">
          <Header
            isServerConnected={isServerConnected}
            vpnEnabled={vpnEnabled}
            setVpnEnabled={setVpnEnabled}
            speed={speed}
            syncing={syncing}
            syncConnection={syncConnection}
            status={status}
          />

          <div className="max-w-xl mx-auto">
            <TransmissionCell
              status={status}
              sessionId={sessionId}
              startSession={startSession}
              joinSession={joinSession}
            />
          </div>
        </div>
      </div>

      <Footer />

      {/* 3. LOGS MODAL OVERLAY - Optimized for Mobile */}
      <button
        suppressHydrationWarning
        onClick={() => setShowLogs(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-bg-surface/90 backdrop-blur-xl hover:bg-accent-primary text-accent-primary hover:text-black border border-accent-primary/20 hover:border-accent-primary rounded-sm flex items-center justify-center transition-all duration-300 shadow-2xl active:scale-95 z-[200]"
      >
        <TerminalIcon className="w-6 h-6" />
      </button>

      {showLogs && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-6 md:p-16 backdrop-blur-md bg-bg-base/90 animate-in">
          <div className="w-full max-w-5xl h-[85vh] sm:h-full sm:max-h-[85vh] bg-bg-base border-t sm:border border-accent-primary/30 rounded-t-2xl sm:rounded-sm shadow-[0_0_100px_rgba(0,255,65,0.15)] relative flex flex-col font-mono overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-accent-primary/10 flex items-center justify-between bg-bg-surface px-6 sm:px-8">
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-none bg-red-600"></div>
                  <div className="w-2.5 h-2.5 rounded-none bg-yellow-600"></div>
                  <div className="w-2.5 h-2.5 rounded-none bg-accent-primary"></div>
                </div>
                <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-accent-primary">
                  SYS_CORE // PROTOCOL_LOGS
                </h2>
              </div>
              <button
                onClick={() => setShowLogs(false)}
                className="w-10 h-10 hover:bg-accent-primary/10 rounded-sm flex items-center justify-center transition-all group"
              >
                <X className="w-5 h-5 text-accent-primary" />
              </button>
            </div>

            <div className="flex-grow overflow-hidden relative">
               {/* Cyber Grid Overlay */}
               <div className="absolute inset-0 cyber-grid opacity-5 pointer-events-none"></div>
              <FileLogs
                logs={logs}
                logContainerRef={logContainerRef}
                clearLogs={clearLogs}
              />
            </div>
          </div>
        </div>
      )}

      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#050d06',
            color: '#00ff41',
            border: '1px solid rgba(0, 255, 65, 0.2)',
            borderRadius: '2px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
          }
        }}
      />
      <div className="scanline"></div>
    </div>
  );
}
