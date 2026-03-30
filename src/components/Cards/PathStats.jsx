import { Activity, Globe, Zap, BarChart3 } from "lucide-react";

export default function PathStats({ vpnIp, status }) {
  const isConnected = status === 'connected';

  return (
    <div className="card glass p-8 transition-all hover:border-accent-primary/60 font-mono">
      <div className="flex items-center gap-5 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-accent-secondary/5 flex items-center justify-center border border-accent-secondary/20 shadow-sm transition-transform group-hover:scale-110">
          <BarChart3 className="text-accent-secondary w-7 h-7" />
        </div>
        <div>
          <h3 className="text-[1.3rem] font-bold text-text-primary tracking-tighter uppercase text-glow">CORE_METRICS</h3>
          <div className="text-[10px] font-bold text-accent-secondary/50 uppercase tracking-[0.4em] mt-1 space-x-2">
            <span className="animate-pulse">●</span>
            <span>DATA_FEED_01</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center py-4 border-b border-accent-primary/10 last:border-0 group-hover:border-accent-primary/30 transition-all">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em]">LINK_LAYER</span>
          <span className={`text-[10px] font-bold uppercase tracking-[0.3em] px-3 py-1.5 rounded-lg border ${isConnected ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/20 shadow-[0_0_10px_var(--accent-primary-glow)]' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
            {isConnected ? 'NODE_ACTIVE' : 'NODE_IDLE'}
          </span>
        </div>

        <div className="flex justify-between items-center py-4 border-b border-accent-primary/10 last:border-0 group-hover:border-accent-primary/30 transition-all">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em]">MESH_PING</span>
          <span className="text-sm font-bold text-accent-secondary italic">12.4_MS</span>
        </div>


      </div>
    </div>
  );
}
