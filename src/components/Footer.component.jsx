import { Share2, Shield, Lock, Zap } from 'lucide-react';

export default function FooterComponent() {
  return (
    <footer className="px-10 py-24 mt-20 border-t border-white/5 bg-black/80 backdrop-blur-3xl relative overflow-hidden group">
      <div className="mesh-glow opacity-5"></div>
      
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
        <div className="col-span-1 border-r border-white/5 pr-12 group-hover:border-blue-500/20 transition-colors duration-1000">
           <div className="flex items-center gap-3 mb-8">
              <Share2 className="text-blue-500 w-6 h-6 stroke-[2.5]" />
              <span className="text-xl font-black tracking-tight text-white uppercase italic">VAULTLINK</span>
           </div>
           <p className="text-gray-500 text-sm font-semibold leading-relaxed">
             Browser-native, direct-to-disk File Sharing engine built on WebRTC NextGen protocols.
           </p>
        </div>
        
        <div className="flex flex-col gap-6">
           <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
             <Shield className="w-5 h-5 text-blue-500" />
           </div>
           <div>
             <span className="text-xs font-black uppercase tracking-[0.2em] text-white block mb-2">Protocol L4</span>
             <p className="text-gray-500 text-xs font-semibold leading-relaxed">ECDSA-P256 for initial handshake and AES-256 for stream.</p>
           </div>
        </div>

        <div className="flex flex-col gap-6">
           <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
             <Lock className="w-5 h-5 text-blue-500" />
           </div>
           <div>
             <span className="text-xs font-black uppercase tracking-[0.2em] text-white block mb-2">E2EE Stream</span>
             <p className="text-gray-500 text-xs font-semibold leading-relaxed">No data touches our servers. Chunks are relayed peer-to-peer.</p>
           </div>
        </div>

        <div className="flex flex-col gap-6">
           <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
             <Zap className="w-5 h-5 text-blue-500" />
           </div>
           <div>
             <span className="text-xs font-black uppercase tracking-[0.2em] text-white block mb-2">Engine V8</span>
             <p className="text-gray-500 text-xs font-semibold leading-relaxed">Optimized for gigabit fiber with SCTP congestion control.</p>
           </div>
        </div>
      </div>
      
      <div className="max-w-[1100px] mx-auto mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-30 group-hover:opacity-70 transition-opacity duration-1000 relative z-10">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">© 2026 VaultLink Quantum Labs</span>
        <div className="flex gap-10">
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white cursor-pointer hover:text-blue-500 transition-colors italic">Privacy</span>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white cursor-pointer hover:text-blue-500 transition-colors italic">Terms</span>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white cursor-pointer hover:text-blue-500 transition-colors italic">Nodes</span>
        </div>
      </div>
    </footer>
  );
}
