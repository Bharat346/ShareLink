"use client";

import { Shield, RefreshCw, Gauge } from "lucide-react";

export default function Header({
  isServerConnected,
  speed,
  syncing,
  syncConnection,
  status,
}) {
  const isConnected = status === "connected";

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-8 mb-8 sm:mb-12">
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-accent-primary/10 rounded-sm border border-accent-primary/20 shadow-[0_0_30px_var(--accent-primary-glow)] transition-transform hover:scale-105">
          <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-accent-primary text-glow" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-text-primary tracking-tight uppercase">
            SHARE<span className="text-accent-primary">_LINK</span>
          </h1>
          <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
            <span className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
              Protocol L4
            </span>
            <div className="w-1 h-1 bg-accent-primary/20"></div>
            <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] ${isConnected ? "text-accent-primary" : "text-accent-red animate-pulse"}`}>
              {isConnected ? "Secure Tunnel" : `System: ${status}`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">

        <button
          onClick={syncConnection}
          className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-sm glass border border-accent-primary/20 text-text-secondary hover:text-accent-primary hover:border-accent-primary transition-all active:scale-95 shadow-lg group"
          title="Refresh connection"
        >
          <RefreshCw className={`w-5 h-5 transition-transform ${syncing ? "animate-spin" : "group-hover:rotate-180 duration-500"}`} />
        </button>
      </div>
    </header>
  );
}
