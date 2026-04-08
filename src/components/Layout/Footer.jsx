import { Zap, Cpu, Database } from "lucide-react";
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full glass border-t border-accent-primary/10 py-10 sm:py-14 lg:py-16 px-4 sm:px-6 lg:px-12 relative overflow-hidden font-mono">
      <div className="absolute inset-0 cyber-grid opacity-5 -z-10" />
      
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
          <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex items-center gap-3 sm:gap-4 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-accent-primary/10 rounded-sm flex items-center justify-center border border-accent-primary/20 shadow-[0_0_20px_var(--accent-primary-glow)]">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-accent-primary animate-pulse" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter">
                SHARE<span className="text-accent-primary">_LINK</span>
              </span>
            </div>
            <p className="text-[11px] sm:text-sm font-medium text-text-secondary leading-relaxed opacity-70">
              A secure zero-trust peer-to-peer data bridge protocol. Encrypted. Direct. Private.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 bg-accent-primary/5 rounded-sm border border-accent-primary/10 hover:border-accent-primary transition-all cursor-pointer group">
                <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-accent-primary opacity-60 group-hover:opacity-100" />
              </div>
              <div className="p-2.5 sm:p-3 bg-accent-primary/5 rounded-sm border border-accent-primary/10 hover:border-accent-primary transition-all cursor-pointer group">
                <Database className="w-4 h-4 sm:w-5 sm:h-5 text-accent-primary opacity-60 group-hover:opacity-100" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 sm:gap-6">
            <h4 className="text-[10px] sm:text-xs font-bold text-accent-primary uppercase tracking-[0.3em] sm:tracking-[0.4em]">_PROTOCOL</h4>
            <ul className="flex flex-col gap-3 sm:gap-4">
              <li><Link href="/security" className="text-[11px] sm:text-sm font-medium text-text-muted hover:text-accent-primary transition-all">_Security Spec</Link></li>
              <li><Link href="/security#webrtc" className="text-[11px] sm:text-sm font-medium text-text-muted hover:text-accent-primary transition-all">_WebRTC DeepDive</Link></li>
              <li><Link href="/security" className="text-[11px] sm:text-sm font-medium text-text-muted hover:text-accent-primary transition-all">_E2EE AES-256</Link></li>
            </ul>
          </div>

          <div className="flex flex-col gap-5 sm:gap-6">
            <h4 className="text-[10px] sm:text-xs font-bold text-accent-primary uppercase tracking-[0.3em] sm:tracking-[0.4em]">_DOCS</h4>
            <ul className="flex flex-col gap-3 sm:gap-4">
              <li><Link href="/docs" className="text-[11px] sm:text-sm font-medium text-text-muted hover:text-accent-primary transition-all">_Problem Statement</Link></li>
              <li><Link href="/docs" className="text-[11px] sm:text-sm font-medium text-text-muted hover:text-accent-primary transition-all">_Tech Stack</Link></li>
              <li><Link href="/docs" className="text-[11px] sm:text-sm font-medium text-text-muted hover:text-accent-primary transition-all">_Architecture</Link></li>
            </ul>
          </div>

          <div className="flex flex-col gap-5 sm:gap-6">
            <h4 className="text-[10px] sm:text-xs font-bold text-accent-primary uppercase tracking-[0.3em] sm:tracking-[0.4em]">_SYSTEM</h4>
            <div className="p-4 sm:p-5 bg-accent-primary/5 rounded-sm border border-accent-primary/10 group hover:border-accent-primary transition-all">
              <span className="text-[9px] sm:text-[10px] text-accent-primary uppercase tracking-widest font-bold block mb-2 opacity-60">BUILD:</span>
              <span className="text-lg sm:text-xl font-bold text-white tracking-widest animate-pulse opacity-90 group-hover:opacity-100">v4.2.1</span>
            </div>
          </div>
        </div>

        <div className="mt-10 sm:mt-14 lg:mt-16 pt-6 sm:pt-8 border-t border-accent-primary/10 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <p className="text-[10px] sm:text-[11px] font-bold text-text-muted uppercase tracking-widest">
            © 2026 SHARE_LINK
          </p>
          <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
            <span>System Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
