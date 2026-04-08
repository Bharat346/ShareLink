"use client";

import { useRef, useState, useEffect } from "react";
import {
  ChevronDown, Terminal as TerminalIcon, X, ChevronRight,
  Shield, ArrowRight, Wifi, WifiOff
} from "lucide-react";
import useVaultHook from "../hooks/useVault.hook";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";

import Navigation from "./Layout/Navigation";
import Header from "./Layout/Header";
import Footer from "./Layout/Footer";
import TransmissionCell from "./Cards/TransmissionCell";
import FileLogs from "./Cards/FileLogs";

export default function FileTransfer() {
  const {
    isServerConnected, vpnEnabled, setVpnEnabled,
    status, sessionId, startSession, joinSession,
    logs, logContainerRef, syncing, syncConnection, clearLogs,
  } = useVaultHook();

  const [showLogs, setShowLogs] = useState(false);
  const sessionRef = useRef(null);
  const router = useRouter();

  const scrollToSession = () => {
    sessionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-[#020c06] min-h-screen text-[#e0ffe0] selection:bg-accent-primary/30 font-mono">
      <Navigation />

      {/* ─── HERO ─── */}
      <section className="min-h-[100dvh] w-full flex flex-col relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent-primary/[0.03] rounded-full blur-[180px] -z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-primary/10 to-transparent" />

        <div className="flex-grow flex flex-col items-center justify-center text-center px-5 sm:px-8 py-20">
          {/* Status chip */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-md border border-[#1a4d29] bg-[#05170b] text-[9px] font-medium uppercase tracking-[0.35em] text-[#41b868] mb-10">
            {isServerConnected ? <Wifi className="w-3.5 h-3.5 text-accent-primary" /> : <WifiOff className="w-3.5 h-3.5 text-red-500/60" />}
            <span className={`w-1.5 h-1.5 rounded-full ${isServerConnected ? "bg-accent-primary animate-[pulse-glow_2s_ease-in-out_infinite]" : "bg-red-500/60 animate-pulse"}`} />
            {isServerConnected ? "Network Online" : "Offline"}
          </div>

          {/* Title */}
          <h1 className="text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-[-0.05em] text-white mb-6 leading-[0.85] uppercase">
            Share<span className="text-accent-primary">Link</span>
          </h1>

          {/* Subtitle */}
          <p className="text-[#85d69e] text-[11px] sm:text-sm font-normal tracking-wide mb-12 max-w-md leading-relaxed">
            Peer-to-peer encrypted data transfer. Zero storage. Zero intermediaries.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto max-w-xs sm:max-w-none">
            <button
              onClick={scrollToSession}
              className="w-full sm:w-auto px-8 py-4 rounded-md border border-[#1a4d29] text-[#85d69e] text-[10px] font-bold uppercase tracking-[0.25em] hover:border-accent-primary hover:text-accent-primary transition-all text-center flex items-center justify-center gap-2 hover:bg-[#153d23]"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/docs"
              className="w-full sm:w-auto px-8 py-4 rounded-md border border-[#1a4d29] text-[#85d69e] text-[10px] font-bold uppercase tracking-[0.25em] hover:border-accent-primary hover:text-accent-primary transition-all text-center"
            >
              Documentation
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 w-full flex justify-center">
          <button onClick={scrollToSession} className="text-[#41b868] hover:text-accent-primary transition-all animate-bounce p-3">
            <ChevronDown className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>
      </section>

      {/* ─── SESSION PANEL ─── */}
      <section ref={sessionRef} className="py-16 sm:py-24 px-5 sm:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <Header
            isServerConnected={isServerConnected}
            vpnEnabled={vpnEnabled}
            setVpnEnabled={setVpnEnabled}
            syncing={syncing}
            syncConnection={syncConnection}
            status={status}
          />
          <div className="mt-8 sm:mt-10">
            <TransmissionCell
              status={status}
              sessionId={sessionId}
              startSession={startSession}
              joinSession={joinSession}
            />
          </div>
        </div>
      </section>

      <Footer />

      {/* ─── LOG FAB ─── */}
      <button
        suppressHydrationWarning
        onClick={() => setShowLogs(true)}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 w-11 h-11 sm:w-12 sm:h-12 rounded-md bg-[#0f2e1a] border border-[#1a4d29] text-[#41b868] hover:text-accent-primary hover:border-accent-primary flex items-center justify-center transition-all z-[200]"
      >
        <TerminalIcon className="w-5 h-5" />
      </button>

      {/* ─── LOG MODAL ─── */}
      {showLogs && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-6 backdrop-blur-md bg-[#020c06]/80">
          <div className="w-full max-w-4xl h-[75vh] sm:h-[80vh] bg-[#0f2e1a] border-t sm:border border-[#1a4d29] rounded-t-xl sm:rounded-md relative flex flex-col overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-[#1a4d29] flex items-center justify-between px-5">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent-primary/50">System Logs</h2>
              <button onClick={() => setShowLogs(false)} className="w-8 h-8 hover:bg-[#1a4d29] rounded-md flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-[#85d69e]" />
              </button>
            </div>
            <div className="flex-grow overflow-hidden relative">
              <FileLogs logs={logs} logContainerRef={logContainerRef} clearLogs={clearLogs} />
            </div>
          </div>
        </div>
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#05170b",
            color: "#e0ffe0",
            border: "1px solid #1a4d29",
            borderRadius: "6px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
            padding: "12px 16px",
          },
        }}
      />
    </div>
  );
}
