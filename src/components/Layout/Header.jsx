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
    <header className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 animate-in font-mono">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 flex items-center justify-center bg-accent-primary/10 rounded-sm border border-accent-primary/20 shadow-[0_0_50px_rgba(0,255,65,0.05)] transition-transform hover:scale-105">
          <Shield className="w-8 h-8 text-accent-primary shadow-2xl" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-text-primary tracking-tight uppercase">
            SHARE<span className="text-accent-primary">_LINK</span>
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">
              Protocol L4 Sync
            </span>
            <div className="w-1.5 h-1.5 bg-accent-primary/20"></div>
            <span
              className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isConnected ? "text-accent-primary" : "text-accent-red animate-pulse"}`}
            >
              {isConnected ? "Secure Tunnel Active" : `System: ${status}`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* NETWORK STATS */}
        <div className="glass px-6 py-3.5 rounded-sm flex items-center gap-4 shadow-xl border border-accent-primary/10">
          <div className="flex items-center gap-3 bg-bg-base/40 px-4 py-2 rounded-sm border border-accent-primary/5 min-w-[100px] justify-center">
            <Gauge
              className={`w-4 h-4 ${isServerConnected ? "text-accent-primary" : "text-red-500 opacity-50"}`}
            />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
              {isServerConnected ? `${speed} MB/s` : "0.0 MB/s"}
            </span>
          </div>
        </div>

        <button
          onClick={syncConnection}
          className="w-12 h-12 flex items-center justify-center rounded-sm bg-bg-surface border border-accent-primary/20 text-text-secondary hover:text-accent-primary hover:border-accent-primary transition-all active:scale-95 shadow-lg group"
        >
          <RefreshCw
            className={`w-5 h-5 transition-transform ${syncing ? "animate-spin" : "group-hover:rotate-180 duration-500"}`}
          />
        </button>
      </div>
    </header>
  );
}
