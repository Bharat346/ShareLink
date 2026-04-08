"use client";

import {
  Zap, Plus, Activity, Cpu, ShieldCheck, Hash,
  ChevronRight, Copy, Loader2, MessageSquare, ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function TransmissionCell({ sessionId, startSession, joinSession, status }) {
  const [inputValue, setInputValue] = useState("");
  const isSyncing = status === "connecting" || (status === "connected" && !sessionId);
  const router = useRouter();

  const handleJoin = () => {
    if (inputValue.length === 6) joinSession(inputValue);
  };

  const copyCode = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      toast.success("Link ID Copied");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">

      {/* TWO COLUMN: CREATE + JOIN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">

        {/* ─── CREATE SESSION ─── */}
        <div className={`relative flex flex-col gap-5 p-5 sm:p-7 rounded-md bg-[#0f2e1a] border transition-all duration-500 ${sessionId ? "border-accent-primary" : "border-[#1a4d29] hover:border-accent-primary"}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#153d23] flex items-center justify-center">
              <Plus className="w-4 h-4 text-accent-primary" />
            </div>
            <div>
              <h3 className="text-[11px] font-bold text-[#e0ffe0] uppercase tracking-[0.25em]">Create Room</h3>
              <p className="text-[9px] text-[#41b868] uppercase tracking-widest mt-0.5">Generate a secure bridge</p>
            </div>
          </div>

          {!sessionId ? (
            <button
              onClick={startSession}
              disabled={status === "connecting" || status === "disconnected"}
              className="w-full py-4 rounded-md hover:bg-green-200 bg-[#00cc33] text-black text-[10px] font-bold uppercase tracking-[0.25em] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === "connecting" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Initializing...</>
              ) : status === "disconnected" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
              ) : (
                <>Generate Link <Zap className="w-3.5 h-3.5" /></>
              )}
            </button>
          ) : (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Session ID Display */}
              <div className="flex items-center justify-between bg-[#05170b] border border-[#1a4d29] p-4 rounded-md relative">
                <span className="text-[8px] absolute -top-2 left-3 px-1.5 bg-[#0f2e1a] text-accent-primary font-bold uppercase tracking-[0.2em]">Room ID</span>
                <span className="text-2xl sm:text-3xl font-black text-accent-primary tracking-[0.3em] tabular-nums">{sessionId}</span>
                <button onClick={copyCode} className="p-2 text-[#41b868] hover:text-accent-primary transition-colors" title="Copy">
                  <Copy className="w-5 h-5" />
                </button>
              </div>

              {/* Enter Room Button */}
              <button
                onClick={() => router.push(`/chat/${sessionId}`)}
                className="w-full py-4 rounded-md bg-accent-primary text-black text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#00cc33] transition-all"
              >
                Enter Chat Room <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[8px] text-[#41b868] uppercase tracking-[0.15em] text-center leading-relaxed">
                Share this Room ID with your peer to establish an E2EE connection.
              </p>
            </div>
          )}
        </div>

        {/* ─── JOIN SESSION ─── */}
        <div className={`relative flex flex-col gap-5 p-5 sm:p-7 rounded-md bg-[#0f2e1a] border transition-all duration-500 ${sessionId ? "border-[#153d23] opacity-50 pointer-events-none" : "border-[#1a4d29] hover:border-accent-secondary"}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#153d23] flex items-center justify-center">
              <Cpu className="w-4 h-4 text-accent-secondary" />
            </div>
            <div>
              <h3 className="text-[11px] font-bold text-[#e0ffe0] uppercase tracking-[0.25em]">Join Room</h3>
              <p className="text-[9px] text-[#41b868] uppercase tracking-widest mt-0.5">Connect to existing bridge</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="relative flex items-center bg-[#05170b] border border-[#1a4d29] focus-within:border-accent-secondary rounded-md transition-all">
              <div className="pl-4 text-[#2d8248]">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                className="flex-grow bg-transparent text-center font-bold text-[#e0ffe0] p-3.5 sm:py-4 text-xl sm:text-2xl tracking-[0.1em] placeholder:text-[#2d8248] focus:outline-none uppercase"
                maxLength={6}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                disabled={isSyncing}
              />
              {isSyncing && <Loader2 className="absolute right-4 w-4 h-4 text-accent-secondary animate-spin" />}
            </div>

            <button
              onClick={handleJoin}
              disabled={inputValue.length !== 6 || isSyncing}
              className="w-full py-4 rounded-md border border-accent-secondary text-accent-secondary text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-[#153d23] hover:text-[#e0ffe0] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSyncing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
              ) : (
                <>Join Room <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* STATUS BAR */}
      <div className="flex items-center justify-between px-4 py-3 rounded-md bg-[#0a1f11] border border-[#1a4d29]">
        <div className="flex items-center gap-2.5">
          <div className={`w-1.5 h-1.5 rounded-full ${
            status === "connected" ? "bg-accent-primary" :
            status === "ready" ? "bg-yellow-500/80 animate-pulse" :
            "bg-red-500/60"
          }`} />
          <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${
            status === "connected" ? "text-accent-primary/70" : "text-white/25"
          }`}>
            {status === "connected" ? "Secured" : status === "ready" ? "System Ready" : "Offline"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/10">
          <ShieldCheck className="w-3 h-3" />
          <span className="text-[8px] font-medium uppercase tracking-widest">AES-256</span>
        </div>
      </div>
    </div>
  );
}
