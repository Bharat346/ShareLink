import { Shield, RefreshCw, Radio, Zap, Gauge } from "lucide-react";

export default function Header({
  isServerConnected,
  vpnEnabled,
  setVpnEnabled,
  speed,
  syncing,
  syncConnection,
  status,
}) {
  const isConnected = status === "connected";

  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 animate-in">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 flex items-center justify-center bg-accent-primary/10 rounded-2xl border border-accent-primary/20 shadow-[0_0_50px_rgba(20,184,166,0.1)] transition-transform hover:scale-105">
          <Shield className="w-8 h-8 text-accent-primary shadow-2xl" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-text-primary tracking-tight font-mono uppercase">
            SHARE<span className="text-accent-primary">_LINK</span>
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
              Protocol L4 Sync
            </span>
            <div className="w-1 h-1 rounded-full bg-border-default"></div>
            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isConnected ? "text-accent-primary" : "text-accent-red animate-pulse"}`}>
              {isConnected ? "Secure Tunnel Active" : `System: ${status}`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* NETWORK CONTROLS */}
        <div className="glass px-6 py-3.5 rounded-2xl flex items-center gap-8 shadow-xl">
          <div className="flex flex-col items-start gap-1">
             <div className="flex items-center gap-1.5 bg-bg-base/60 p-1 rounded-xl border border-border-default">
                <button 
                  onClick={() => setVpnEnabled(false)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!vpnEnabled ? "bg-bg-surface text-text-primary border border-border-default shadow-sm" : "text-text-muted hover:text-text-secondary"}`}
                >
                  CLEAN
                </button>
                <button 
                  onClick={() => setVpnEnabled(true)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${vpnEnabled ? "bg-accent-primary text-white shadow-lg shadow-accent-primary/20" : "text-text-muted hover:text-text-secondary"}`}
                >
                  VPN
                </button>
             </div>
          </div>

          <div className="flex items-center gap-3 bg-bg-base/40 px-4 py-2 rounded-xl border border-white/5 min-w-[100px] justify-center">
            <Gauge className={`w-4 h-4 ${isServerConnected ? 'text-accent-primary' : 'text-red-500 opacity-50'}`} />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono">
               {isServerConnected ? `${speed} MB/s` : '0.0 MB/s'}
            </span>
          </div>
        </div>

        <button
          onClick={syncConnection}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-bg-surface border border-border-default text-text-secondary hover:text-accent-primary hover:border-accent-primary/40 transition-all active:scale-95 shadow-lg group"
        >
          <RefreshCw
            className={`w-5 h-5 transition-transform ${syncing ? "animate-spin" : "group-hover:rotate-180 duration-500"}`}
          />
        </button>
      </div>
    </header>
  );
}
