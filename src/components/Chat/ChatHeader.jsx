import { Phone, PhoneOff, LogOut, Menu, X, FileText, RefreshCw, Shield, ShieldOff } from "lucide-react";
import Link from "next/link";

export default function ChatHeader({ 
  alias, 
  peerAlias, 
  status, 
  isServerConnected,
  vpnEnabled,
  setVpnEnabled,
  connectToSignalling,
  sessionId, 
  isCallActive, 
  toggleCall, 
  terminateConnection, 
  setShowMobileMenu, 
  showMobileMenu 
}) {
  const isConnected = ['connected', 'transferring', 'downloading'].includes(status);

  return (
    <div className="h-16 md:h-20 border-b-2 border-accent-primary/5 bg-bg-base/70 backdrop-blur-3xl z-50 shrink-0 font-mono relative overflow-hidden">
      {/* SHIMMER EFFECT ACCENT */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent animate-pulse"></div>
      
      <div className="max-w-5xl mx-auto h-full flex items-center justify-between px-4 md:px-12">
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex flex-col gap-0.5">
             <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${isServerConnected ? 'bg-accent-primary animate-pulse shadow-[0_0_15px_var(--accent-primary)]' : 'bg-red-500 shadow-[0_0_15px_red]'}`}></div>
                <h3 className="text-sm md:text-base font-bold text-accent-primary tracking-tighter uppercase leading-none glitch">
                   {alias || "SYS_NODE"}
                </h3>
                {!isServerConnected && (
                  <button 
                    onClick={() => connectToSignalling()}
                    className="p-1.5 bg-accent-primary/10 border border-accent-primary/20 rounded-md text-accent-primary hover:bg-accent-primary hover:text-bg-base transition-all animate-in"
                    title="RETRY_SIGNAL"
                  >
                    <RefreshCw className="w-3 h-3 animate-spin-slow" />
                  </button>
                )}
             </div>
             <div className="flex items-center gap-2 opacity-50">
                <span className={`text-[8px] font-bold uppercase transition-all tracking-[0.2em] ${isServerConnected ? 'text-accent-primary' : 'text-red-500 animate-pulse'}`}>
                  {isServerConnected ? 'SIGNAL_LOCKED' : 'LINK_TERMINATED'}
                </span>
             </div>
          </div>

          {peerAlias && (
            <div className="flex items-center gap-4 animate-in">
               <div className="w-[1px] h-6 bg-accent-primary/20 hidden md:block"></div>
               <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-accent-secondary uppercase tracking-tighter truncate max-w-[120px]">
                        P :: {peerAlias}
                     </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-30">
                     <div className="w-1 h-1 rounded-full bg-accent-secondary animate-pulse"></div>
                     <span className="text-[7px] font-bold uppercase tracking-widest italic">Encrypted_Tunnel</span>
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 md:gap-8 relative">
           <div className="hidden lg:flex flex-col items-end gap-1 px-4 py-2 bg-accent-primary/5 border-x border-accent-primary/10">
              <span className="text-[7px] font-bold text-accent-primary/30 uppercase tracking-[0.3em]">BRIDGE_ID</span>
              <div className="flex items-center gap-2">
                 <span className="text-sm font-bold text-accent-primary/80 tracking-[0.2em] leading-none lining-nums">{sessionId}</span>
              </div>
           </div>
           
           <div className="hidden md:flex items-center gap-3">
              <button 
                onClick={() => setVpnEnabled(!vpnEnabled)}
                className={`group w-11 h-11 rounded-xl flex items-center justify-center transition-all border ${vpnEnabled ? 'bg-accent-primary border-accent-primary text-bg-base shadow-[0_0_15px_var(--accent-primary-glow)]' : 'bg-bg-base/40 border-accent-primary/20 text-accent-primary/60 hover:border-accent-primary'}`}
                title={vpnEnabled ? "VPN_ACTIVE (TURN/STUN_ENABLED)" : "ENABLE_VPN (FORCED_RELAY)"}
              >
                {vpnEnabled ? <Shield className="w-5 h-5" /> : <ShieldOff className="w-5 h-5 opacity-70" />}
              </button>
              <button 
                onClick={toggleCall}
                disabled={!isConnected}
                className={`group w-11 h-11 rounded-xl flex items-center justify-center transition-all border ${isCallActive ? 'bg-accent-red border-accent-red text-white animate-pulse' : 'bg-bg-base/40 border-accent-secondary/20 text-accent-secondary hover:border-accent-secondary hover:text-white disabled:opacity-20 hover:scale-105 active:scale-95'}`}
                title="ESTABLISH_VOICE_BRIDGE"
              >
                {isCallActive ? <PhoneOff className="w-5 h-5" /> : <Phone className="w-5 h-5 opacity-70 group-hover:opacity-100" />}
              </button>
              <button 
                onClick={terminateConnection}
                className="group w-11 h-11 bg-bg-base/40 border border-red-500/20 text-red-500/60 hover:bg-accent-red hover:text-white rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                title="DISCONNECT_PROTOCOL"
              >
                <LogOut className="w-5 h-5 opacity-70 group-hover:opacity-100" />
              </button>
           </div>

           <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden w-11 h-11 bg-accent-primary/5 border border-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 rounded-xl flex items-center justify-center transition-all"
           >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
           </button>
        </div>
      </div>
    </div>
  );
}
