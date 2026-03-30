import { Zap , Info, Cpu, Database } from "lucide-react";
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-bg-base/60 backdrop-blur-3xl border-t border-accent-primary/10 py-16 md:py-24 px-6 md:px-12 relative overflow-hidden font-mono">
      <div className="absolute inset-0 cyber-grid opacity-5 -z-10 animate-pulse-slow"></div>
      
      <div className="max-w-[1500px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16">
        <div className="flex flex-col gap-8 md:gap-10">
          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-accent-primary/10 rounded-2xl flex items-center justify-center border border-accent-primary/20 shadow-[0_0_20px_var(--accent-primary-glow)]">
              <Zap className="text-accent-primary w-6 h-6 animate-pulse" />
            </div>
            <span className="text-2xl font-black text-white uppercase tracking-tighter">
              SHARE<span className="text-accent-primary">_LINK</span>
            </span>
          </div>
          <p className="text-sm md:text-base font-medium text-text-secondary leading-relaxed opacity-70">
            A secure zero-trust peer-to-peer data bridge protocol. Encrypted. Direct. Private.
          </p>
          <div className="flex gap-4">
             <div className="p-3 bg-accent-primary/5 rounded-xl border border-accent-primary/10 hover:border-accent-primary transition-all cursor-pointer group">
               <Cpu className="w-5 h-5 text-accent-primary opacity-60 group-hover:opacity-100" />
             </div>
             <div className="p-3 bg-accent-primary/5 rounded-xl border border-accent-primary/10 hover:border-accent-primary transition-all cursor-pointer group">
               <Database className="w-5 h-5 text-accent-primary opacity-60 group-hover:opacity-100" />
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 md:gap-8">
          <h4 className="text-xs font-bold text-accent-primary uppercase tracking-[0.4em]">_PROTOCOL</h4>
          <ul className="flex flex-col gap-4">
            <li><Link href="/security" className="text-sm font-medium text-text-muted hover:text-accent-primary transition-all">_Security Spec</Link></li>
            <li><Link href="/security#webrtc" className="text-sm font-medium text-text-muted hover:text-accent-primary transition-all">_WebRTC DeepDive</Link></li>
            <li><Link href="/security" className="text-sm font-medium text-text-muted hover:text-accent-primary transition-all">_E2EE AES-256</Link></li>
          </ul>
        </div>

        <div className="flex flex-col gap-6 md:gap-8">
          <h4 className="text-xs font-bold text-accent-primary uppercase tracking-[0.4em]">_Docs</h4>
          <ul className="flex flex-col gap-4">
            <li><Link href="/docs" className="text-sm font-medium text-text-muted hover:text-accent-primary transition-all">_Problem Statement</Link></li>
            <li><Link href="/docs" className="text-sm font-medium text-text-muted hover:text-accent-primary transition-all">_Tech Stack</Link></li>
            <li><Link href="/docs" className="text-sm font-medium text-text-muted hover:text-accent-primary transition-all">_System Architecture</Link></li>
          </ul>
        </div>

        <div className="flex flex-col gap-6 md:gap-8">
          <h4 className="text-xs font-bold text-accent-primary uppercase tracking-[0.4em]">_SYSTEM_ID</h4>
          <div className="p-6 bg-accent-primary/5 rounded-2xl border border-accent-primary/10 group hover:border-accent-primary transition-all">
            <span className="text-[10px] text-accent-primary uppercase tracking-widest font-bold block mb-2 opacity-60">BUILD_METR:</span>
            <span className="text-xl font-bold text-white tracking-widest animate-pulse lining-nums opacity-90 group-hover:opacity-100">v4.2.1-STABLE</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto mt-20 pt-8 border-t border-accent-primary/10 flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
           © 2026 SHARE_LINK
        </p>
        <div className="flex gap-8">
          {/* <a href="#" className="text-text-muted hover:text-accent-primary transition-colors"><Twitter className="w-5 h-5" /></a> */}
          {/* <a href="#" className="text-text-muted hover:text-accent-primary transition-colors"><Github className="w-5 h-5" /></a> */}
        </div>
      </div>
    </footer>
  );
}
