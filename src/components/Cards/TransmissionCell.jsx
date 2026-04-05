import { Zap, Plus, Search, Activity, Cpu, ShieldAlert, Hash, ChevronRight, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function TransmissionCell({
  sessionId,
  startSession,
  joinSession,
  status,
}) {
  const [inputValue, setInputValue] = useState("");
  const isSyncing = status === "connecting" || status === "connected" && !sessionId;
  const router = useRouter();

  const handleJoin = () => {
    if (inputValue.length === 6) {
      router.push(`/chat/${inputValue}`);
    }
  };

  const copyCode = () => {
     if (sessionId) {
        navigator.clipboard.writeText(sessionId);
        toast.success("Signal Code Copied");
     }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto animate-in font-mono">
      
      {/* 1. LINK GENERATION MODULE (CREATE) */}
      <div className="card glass p-6 sm:p-8 rounded-sm shadow-xl border-accent-primary/10 hover:border-accent-primary/20 bg-bg-surface/80 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
           <Zap className="w-16 h-16 text-accent-primary rotate-12" />
        </div>

        <div className="flex flex-col gap-5">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20">
                 <Plus className="w-5 h-5 text-accent-primary" />
              </div>
              <h3 className="text-sm font-black text-accent-primary uppercase tracking-[0.3em]">
                 _INIT_LINK_GEN
              </h3>
           </div>

           {!sessionId ? (
              <button
                onClick={startSession}
                disabled={status === "connecting"}
                className="btn-primary w-full py-4 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] shadow-[0_0_20px_var(--accent-primary-glow)] font-black flex items-center justify-center gap-2"
              >
                {status === "connecting" ? (
                  <>INITIALIZING... <Loader2 className="w-4 h-4 animate-spin" /></>
                ) : (
                  "GENERATE_SEC_BRIDGE"
                )}
              </button>
           ) : (
              <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-2">
                 <div className="flex items-center justify-between bg-bg-base/90 border border-accent-primary/30 p-5 rounded-sm shadow-inner group/code relative">
                    <span className="text-[10px] absolute -top-2 left-4 px-2 bg-bg-base text-accent-primary/40 font-bold uppercase tracking-widest">Active_Link_ID</span>
                    <span className="text-3xl sm:text-4xl font-black text-accent-primary tracking-[0.3em] drop-shadow-[0_0_10px_var(--accent-primary-glow)]">
                       {sessionId}
                    </span>
                    <button 
                       onClick={copyCode}
                       className="p-3 text-accent-primary/40 hover:text-accent-primary transition-all active:scale-90"
                    >
                       <Copy className="w-6 h-6" />
                    </button>
                 </div>
                 <p className="text-[9px] text-accent-primary/30 uppercase tracking-[0.2em] font-medium leading-relaxed px-1">
                    Node protocol established. Send this identity code to the remote node for direct E2EE handshake.
                 </p>
              </div>
           )}
        </div>
      </div>

      {/* 2. SYNC STATION (JOIN) */}
      <div className="card glass p-6 sm:p-8 rounded-sm shadow-xl border-accent-primary/10 hover:border-accent-primary/20 bg-bg-surface/80 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
           <Activity className="w-16 h-16 text-accent-secondary -rotate-12" />
        </div>

        <div className="flex flex-col gap-5">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-accent-secondary/10 flex items-center justify-center border border-accent-secondary/20">
                 <Cpu className="w-5 h-5 text-accent-secondary" />
              </div>
              <h3 className="text-sm font-black text-accent-secondary uppercase tracking-[0.3em]">
                 _REMOTE_NODE_SYNC
              </h3>
           </div>

           <div className="flex flex-col gap-4">
             <div className="relative flex items-center bg-bg-base/90 border border-accent-primary/10 focus-within:border-accent-primary/50 shadow-inner">
               <div className="pl-4 text-accent-primary/20">
                  <Hash className="w-4 h-4" />
               </div>
               <input
                 type="text"
                 placeholder="######"
                 className="flex-grow bg-transparent text-center font-black text-white p-4 py-5 text-3xl tracking-[0.3em] placeholder:text-accent-primary/5 focus:outline-none uppercase"
                 maxLength={6}
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                 onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                 disabled={isSyncing}
               />
               <Activity className={`absolute right-4 w-4 h-4 text-accent-primary/10 ${isSyncing ? 'animate-spin' : 'animate-pulse'}`} />
             </div>

            <button
              onClick={handleJoin}
              disabled={inputValue.length !== 6 || isSyncing}
              className="btn-secondary w-full py-4 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] border-accent-primary/20 hover:border-accent-primary shadow-sm disabled:opacity-20 transition-all font-black flex items-center justify-center gap-2"
            >
              {isSyncing ? (
                 <>INITIALIZING_TUNNEL <Loader2 className="w-4 h-4 animate-spin text-accent-primary" /></>
              ) : (
                <>BOOT_HANDSHAKE <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
           </div>
        </div>
      </div>

      {/* Global Status Footer */}
      <div className="card glass p-4 flex items-center justify-between border-accent-primary/5 bg-bg-surface/40">
         <div className="flex items-center gap-3">
            <div className={`w-2 h-2 ${status === "connected" ? "bg-accent-primary shadow-[0_0_10px_var(--accent-primary)]" : status === "ready" ? "bg-yellow-500 animate-pulse" : "bg-red-500 shadow-[0_0_10px_red]"}`}></div>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${status === "connected" ? "text-accent-primary" : "text-accent-primary/50"}`}>
               {status === "connected" ? "STABLE_SECURED" : status === "ready" ? "SYSTEM_READY" : "OFFLINE_LINK"}
            </span>
         </div>
         <div className="flex items-center gap-2 opacity-30">
             <ShieldAlert className="w-3 h-3 text-accent-secondary" />
             <span className="text-[8px] font-semibold uppercase tracking-widest text-accent-secondary">AES_256_ACTIVE</span>
         </div>
      </div>
    </div>
  );
}
