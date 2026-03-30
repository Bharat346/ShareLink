import React from 'react';
import { FileText, Shield, Terminal, ArrowLeft, Download, Eye, Share2, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Protocol Documentation | L4_SYS',
  description: 'Confidential system documentation and protocol specifications.'
};

const documents = [
  { id: 1, title: 'Network Encryption Protocol', version: 'v2.4.0', status: 'Active', category: 'Security' },
  { id: 2, title: 'Key Exchange Handshake', version: 'v1.1.2', status: 'Deprecated', category: 'Cryptography' },
  { id: 3, title: 'P2P Data Streaming Specs', version: 'v3.0.1', status: 'Draft', category: 'Network' },
  { id: 4, title: 'Vault Storage Architecture', version: 'v4.2.0', status: 'Final', category: 'Storage' },
  { id: 5, title: 'Handshake Authentication L4', version: 'v1.0.0', status: 'Active', category: 'Auth' },
  { id: 6, title: 'Zero-Knowledge Proof Implementation', version: 'v0.9.5', status: 'Beta', category: 'Security' },
];

export default function DocumentPage() {
  return (
    <div className="min-h-screen bg-bg-base relative overflow-hidden font-inter text-text-primary cyber-grid">
      {/* HEADER */}
      <header className="h-20 border-b border-accent-primary/20 bg-bg-base/70 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 bg-accent-primary/5 hover:bg-accent-primary border border-accent-primary/20 hover:text-bg-base rounded-xl flex items-center justify-center transition-all group">
               <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-accent-primary tracking-tighter uppercase leading-none glitch">
                Archive::Core_Docs
              </h1>
              <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest mt-1 block">
                Access_Level: Level 4 Clearance
              </span>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-bg-surface/50 border border-accent-primary/10 rounded-xl">
               <Search className="w-4 h-4 text-accent-primary/40" />
               <input 
                 type="text" 
                 placeholder="Search Archive..." 
                 className="bg-transparent border-none outline-none text-xs text-accent-primary font-mono placeholder:text-accent-primary/20 w-40"
               />
            </div>
            <button className="w-10 h-10 bg-accent-primary/5 border border-accent-primary/20 text-accent-primary rounded-xl flex items-center justify-center hover:bg-accent-primary hover:text-bg-base transition-all">
               <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        {/* HERO SECTION */}
        <section className="mb-20">
          <div className="flex flex-col gap-6 max-w-3xl">
            <h2 className="text-4xl md:text-6xl font-black text-accent-primary tracking-tighter uppercase glitch">
              The Vault Protocol
            </h2>
            <p className="text-lg md:text-xl text-text-secondary leading-relaxed font-mono">
              A peer-to-peer, zero-knowledge communication terminal designed for high-integrity data transfer and encrypted messaging without intermediary surveillance.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* PROBLEM & SOLUTION */}
          <div className="space-y-12">
            <div className="border-l-2 border-accent-red/30 pl-8 relative">
               <div className="absolute top-0 -left-[5px] w-2 h-2 rounded-full bg-accent-red shadow-[0_0_10px_red]"></div>
               <h3 className="text-xl font-bold text-accent-red uppercase tracking-widest mb-4">The_Problem</h3>
               <p className="text-text-primary leading-relaxed">
                 Traditional communication platforms rely on centralized servers that act as "middle-men". These servers can be compromised, censored, or leveraged for data harvesting. Even with "End-to-End Encryption" (E2EE), metadata like IP addresses, timestamps, and relationship maps are stored on central databases, creating a permanent digital footprint.
               </p>
            </div>

            <div className="border-l-2 border-accent-primary/30 pl-8 relative">
               <div className="absolute top-0 -left-[5px] w-2 h-2 rounded-full bg-accent-primary shadow-[0_0_10px_var(--accent-primary)]"></div>
               <h3 className="text-xl font-bold text-accent-primary uppercase tracking-widest mb-4">The_Solution</h3>
               <p className="text-text-primary leading-relaxed">
                 Vault eliminates the middle-man. By utilizing **WebRTC (Web Real-Time Communication)**, data is streamed directly between browser nodes. There is no central server storage for your messages or files. The app functions as a temporary signaling bridge that disappears once the P2P link is established, ensuring true ephemeral and private communication.
               </p>
            </div>
          </div>

          {/* TECH STACK */}
          <div className="card p-8 border-accent-primary/10 bg-bg-surface/30 backdrop-blur-xl">
             <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                <Terminal className="w-6 h-6 text-accent-primary" /> Stack_Manifest
             </h3>
             <div className="space-y-6">
                {[
                  { label: "Core Frame", val: "Next.js 14 (App Router)" },
                  { label: "P2P Engine", val: "Simple-Peer / WebRTC" },
                  { label: "UI Layer", val: "Tailwind CSS + Lucide Icons" },
                  { label: "Icons/Meta", val: "Framer Motion (Animations)" },
                  { label: "Signaling", val: "Web Sockets" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-2">
                     <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest">{item.label}</span>
                     <span className="text-sm font-mono text-accent-primary">{item.val}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* ARCHITECTURE SECTION */}
        <section className="mb-20">
          <h3 className="text-2xl font-bold text-white uppercase tracking-tighter mb-10 flex items-center gap-4">
             <Shield className="w-7 h-7 text-accent-primary" /> System_Architecture
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative p-6 pt-12 border border-white/10 rounded-3xl bg-white/[0.02]">
               <div className="absolute -top-4 left-6 px-4 py-2 bg-bg-base border border-accent-primary/20 rounded-xl text-[10px] font-bold text-accent-primary uppercase tracking-widest">Phase_01</div>
               <h4 className="font-bold mb-3 tracking-tight">Signal_Handshake</h4>
               <p className="text-sm text-text-secondary leading-relaxed">
                  Nodes connect to a transient signaling server to exchange SDP (Session Description Protocol) and ICE candidates. This is the only time a server is involved.
               </p>
            </div>
            
            <div className="relative p-6 pt-12 border border-white/10 rounded-3xl bg-white/[0.02]">
               <div className="absolute -top-4 left-6 px-4 py-2 bg-bg-base border border-accent-primary/20 rounded-xl text-[10px] font-bold text-accent-primary uppercase tracking-widest">Phase_02</div>
               <h4 className="font-bold mb-3 tracking-tight">P2P_Negotiation</h4>
               <p className="text-sm text-text-secondary leading-relaxed">
                  The signaling server facilitates the initial "hello". Once NAT traversal is complete, the nodes attempt a direct connection via STUN/TURN protocols.
               </p>
            </div>

            <div className="relative p-6 pt-12 border border-white/10 rounded-3xl bg-white/[0.02]">
               <div className="absolute -top-4 left-6 px-4 py-2 bg-bg-base border border-accent-primary/20 rounded-xl text-[10px] font-bold text-accent-primary uppercase tracking-widest">Phase_03</div>
               <h4 className="font-bold mb-3 tracking-tight">Encrypted_Stream</h4>
               <p className="text-sm text-text-secondary leading-relaxed">
                  Data channels are established. All messages, files, and audio are encrypted via DTLS/SRTP before transmission, bypassing all infrastructure.
               </p>
            </div>
          </div>
        </section>

        {/* RESTRICTED CALL TO ACTION */}
        <div className="p-12 border border-accent-primary/20 rounded-[40px] text-center bg-gradient-to-b from-accent-primary/[0.05] to-transparent">
           <h3 className="text-2xl font-bold text-white mb-4 uppercase italic">Ready to engage?</h3>
           <p className="text-text-secondary mb-8 max-w-md mx-auto font-mono text-sm uppercase opacity-60">
             Encryption bridges are temporary. Ensure your peer is ready for the synchronization.
           </p>
           <Link href="/" className="inline-flex items-center gap-3 px-8 py-4 bg-accent-primary text-bg-base font-bold rounded-2xl hover:scale-105 transition-all shadow-[0_0_30px_var(--accent-primary-glow)] uppercase tracking-widest text-sm">
              <Terminal className="w-5 h-5" /> Initialize Bridge
           </Link>
        </div>
      </main>

      {/* AMBIENT CRT OVERLAY */}
      <div className="fixed inset-0 pointer-events-none crt-flicker opacity-20 bg-gradient-to-b from-transparent via-accent-primary/[0.02] to-transparent z-[999]"></div>
    </div>
  );
}
