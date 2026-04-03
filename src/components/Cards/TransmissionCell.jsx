import { Zap, Plus, Search, ShieldCheck, Activity } from "lucide-react";

export default function TransmissionCell({
  sessionId,
  startSession,
  joinSession,
  status,
}) {
  return (
    <div className="card glass overflow-hidden group/cell p-10 rounded-[32px] shadow-2xl transition-all duration-700 animate-in border-accent-primary/10 hover:border-accent-primary/50">
      <div className="flex flex-col gap-8 relative z-10 font-mono">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-accent-primary/5 flex items-center justify-center border border-accent-primary/20 shadow-[0_0_30px_rgba(0,255,204,0.1)] transition-transform group-hover/cell:scale-110">
            <Zap className="w-8 h-8 text-accent-primary animate-pulse" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-text-primary tracking-tighter uppercase text-glow">
              _SYS_BRIDGE
            </h3>
            <div className="text-[10px] font-bold text-accent-primary/60 uppercase tracking-[0.3em] mt-1 space-x-2">
              <span className="animate-pulse">●</span>
              <span>L4_PROTOCOL_SYNC</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <button
            onClick={startSession}
            className="btn-primary w-full py-5 text-sm uppercase tracking-[0.2em] shadow-[0_0_20px_var(--accent-primary-glow)] font-bold"
          >
            INIT_SESSION <Plus className="w-5 h-5 ml-2" />
          </button>

          <div className="flex items-center gap-4 py-2 opacity-30">
            <div className="grow h-px bg-accent-primary/20"></div>
            <span className="text-[10px] font-bold text-accent-primary uppercase tracking-[0.5em]">
              LINK_JOIN
            </span>
            <div className="grow h-px bg-accent-primary/20"></div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="relative group/input">
              <input
                type="text"
                id="joinInput"
                placeholder="PROX_CODE_000"
                className="input-base text-center font-bold text-white rounded-2xl p-5 text-2xl tracking-[0.5em] placeholder:text-accent-primary/10 transition-all shadow-inner bg-bg-base/80 border-accent-primary/10 focus:border-accent-primary"
                maxLength={6}
                onChange={(e) => (e.target.value = e.target.value.toUpperCase())}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-primary/20">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
            </div>
            <button
              onClick={() => joinSession(document.getElementById("joinInput")?.value)}
              className="btn-secondary w-full py-5 text-sm uppercase tracking-widest border-accent-primary/30 hover:border-accent-primary shadow-sm"
            >
              EXEC_SYNC_CMD <Search className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-accent-primary/10 flex items-center gap-4 justify-center">
            <div className={`w-2.5 h-2.5 rounded-full ${status === 'connected' ? 'bg-accent-primary shadow-[0_0_12px_var(--accent-primary)]' : 'bg-red-500 animate-pulse shadow-[0_0_10px_red]'}`}></div>
            <span className={`text-[12px] font-bold uppercase tracking-[0.2em] leading-none ${status === 'connected' ? 'text-accent-primary' : 'text-red-500'}`}>
               {status === 'connected' ? 'ONLINE' : status === 'connecting' ? 'SYNCING' : 'OFFLINE'}
            </span>
        </div>
      </div>
    </div>
  );
}
