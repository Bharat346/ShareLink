import { Shield, Zap, Terminal, Activity } from "lucide-react";
import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-bg-base/60 backdrop-blur-3xl border-b border-accent-primary/10 z-[100] px-4 md:px-12 flex items-center justify-between font-mono">
      <div className="flex items-center gap-2 md:gap-4 group cursor-pointer">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center border border-accent-primary/20 group-hover:scale-110 transition-all shadow-[0_0_15px_var(--accent-primary-glow)]">
          <Terminal className="text-accent-primary w-5 h-5" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm md:text-base font-black tracking-tight text-white uppercase leading-none">
            SHARE<span className="text-accent-primary">_LINK</span>
          </span>
          <span className="text-[8px] md:text-[10px] text-accent-primary/40 font-bold uppercase tracking-[0.2em]">P2P_TUNNEL_v4.2</span>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-8 overflow-x-auto no-scrollbar py-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-accent-primary/5 rounded-lg border border-accent-primary/10">
          <Activity className="w-3 h-3 text-accent-primary animate-pulse" />
          <span className="text-[9px] font-bold text-accent-primary uppercase tracking-widest">LAYER_4_ACTIVE</span>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/security" className="text-[10px] md:text-xs font-bold text-text-muted hover:text-accent-primary transition-colors uppercase tracking-[0.2em] whitespace-nowrap">_security</Link>
          
           <Link href="/docs" className="text-[10px] md:text-xs font-bold text-text-muted hover:text-accent-primary transition-colors uppercase tracking-[0.2em] whitespace-nowrap">_Docs</Link>
        </div>
      </div>
    </nav>
  );
}
