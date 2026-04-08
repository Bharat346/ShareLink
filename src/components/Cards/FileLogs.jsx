import { Shield, Cpu, Activity, Zap, Trash2 } from "lucide-react";

export default function FileLogs({ logs, logContainerRef, clearLogs }) {
  return (
    <div className="flex flex-col h-full bg-[#020803] border border-accent-primary/10 rounded-sm overflow-hidden relative font-mono selection:bg-accent-primary/20">
      
      <div className="flex justify-between items-center px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 bg-[#051106] border-b border-accent-primary/10 shadow-lg shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent-primary animate-pulse" />
          <span className="text-[9px] sm:text-[10px] text-accent-primary/70 uppercase tracking-[0.15em] sm:tracking-[0.2em] font-black">
            _LIVE_LOG <span className="hidden sm:inline opacity-30">| V4.2.1</span>
          </span>
        </div>
        <button 
          onClick={clearLogs} 
          className="text-accent-primary/40 hover:text-accent-red flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[9px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-bold px-1.5 sm:px-2 py-1 border border-accent-primary/10 hover:bg-accent-red/5 transition-all"
        >
           <Trash2 className="w-3 h-3" /> <span className="hidden sm:inline">FLUSH</span>
        </button>
      </div>

      <div
        ref={logContainerRef}
        className="flex-grow overflow-y-auto p-3 sm:p-4 md:p-5 custom-scrollbar bg-transparent relative z-10"
      >
        <div className="flex flex-col gap-1.5">
          {(!logs || logs.length === 0) && (
            <div className="flex flex-col items-center justify-center min-h-[200px] sm:min-h-[300px] gap-4 sm:gap-6 opacity-10 py-8 sm:py-10">
              <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-accent-primary animate-pulse" />
              <div className="text-center">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.4em] sm:tracking-[0.5em] text-accent-primary">AWAITING_PAYLOAD</p>
                <div className="mt-2 h-0.5 w-24 sm:w-32 bg-accent-primary/10 mx-auto overflow-hidden">
                   <div className="h-full bg-accent-primary w-1/4 animate-[wait_1.5s_infinite]"></div>
                </div>
              </div>
            </div>
          )}
          
          {logs && logs.map((log, i) => (
            <div
              key={i}
              className="flex items-start gap-2 sm:gap-2.5 sm:gap-3 group animate-in slide-in-from-left-2 duration-200 text-[10px] sm:text-[11px] font-medium tracking-tight border-l-2 border-transparent hover:border-accent-primary/20 pl-2 transition-colors leading-relaxed"
            >
              <span className="text-accent-primary/20 min-w-[55px] sm:min-w-[65px] md:min-w-[75px] shrink-0 font-mono text-[8px] sm:text-[9px] pt-0.5 tabular-nums">
                [{log.time}]
              </span>
              <div className="flex flex-col gap-0.5">
                 <div className="flex items-baseline gap-1.5 sm:gap-2">
                    <span className="text-accent-primary/10 text-[7px] sm:text-[8px] font-black uppercase tracking-tighter shrink-0">{log.type || 'SYS'}</span>
                    <span
                      className={`font-semibold tracking-wide break-all ${
                        log.type === "error"
                          ? "text-red-500 drop-shadow-[0_0_5px_red]"
                          : log.type === "warning"
                            ? "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]"
                            : log.type === "success"
                              ? "text-accent-primary drop-shadow-[0_0_5px_var(--accent-primary)]"
                              : "text-accent-secondary"
                      }`}
                    >
                      {log.msg || log.message}
                    </span>
                 </div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-3 sm:mt-4 px-2 opacity-50">
             <div className="w-2 h-4 bg-accent-primary animate-pulse"></div>
             <span className="text-[8px] sm:text-[9px] text-accent-primary/20 font-black uppercase tracking-[0.3em] sm:tracking-[0.4em]">READY</span>
          </div>
        </div>
      </div>
      
      <div className="px-3 sm:px-4 md:px-6 py-1.5 border-t border-accent-primary/5 bg-[#010602] flex items-center justify-between opacity-40 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 text-[7px] sm:text-[8px] font-black text-accent-primary uppercase tracking-widest">
             <div className="flex items-center gap-1"><Shield className="w-2 h-2" /> E2EE</div>
             <div className="flex items-center gap-1"><Cpu className="w-2 h-2" /> HUB:01</div>
          </div>
          <div className="text-[7px] sm:text-[8px] text-accent-primary/10 uppercase tracking-widest">NO_PERSIST</div>
      </div>
      
      <style jsx>{`
        @keyframes wait {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
