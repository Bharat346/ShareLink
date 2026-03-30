import { Terminal, Trash2, Shield } from "lucide-react";

export default function FileLogs({ logs, logContainerRef, clearLogs }) {
  return (
    <div className="flex flex-col h-full bg-bg-base border border-border-default rounded-2xl overflow-hidden shadow-2xl relative font-mono">
      <div className="flex justify-between items-center px-6 py-4 border-b border-border-default bg-bg-surface/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-accent-primary" />
          <span className="text-[11px] text-text-secondary uppercase tracking-[0.2em] font-bold">Protocol Monitor</span>
        </div>
        <button 
          onClick={clearLogs} 
          className="text-text-muted hover:text-accent-red transition-all flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-1.5 rounded-lg border border-border-default hover:bg-accent-red/10"
        >
           <Trash2 className="w-4 h-4" /> Clear
        </button>
      </div>

      <div
        ref={logContainerRef}
        className="flex-grow overflow-y-auto p-6 custom-scrollbar relative z-10 bg-transparent selection:bg-accent-primary/20"
        style={{ minHeight: '300px' }}
      >
        <div className="flex flex-col gap-2">
          {(!logs || logs.length === 0) && (
            <div className="flex flex-col items-center justify-center h-[200px] gap-4 opacity-20">
              <Terminal className="w-10 h-10 text-text-primary" />
              <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-text-primary">
                LISTENING_SIGNAL
              </p>
            </div>
          )}
          {logs && logs.map((log, i) => (
            <div
              key={i}
              className="flex gap-4 group/item animate-in text-[12px] font-medium tracking-wide border-l border-transparent hover:border-accent-primary/40 pl-3 transition-all leading-relaxed"
            >
              <span className="text-text-muted min-w-[80px] shrink-0 opacity-50 group-hover:opacity-100 transition-opacity lining-nums">
                [{log.time}]
              </span>
              <span
                className={`transition-colors italic font-semibold ${
                  log.type === "error"
                    ? "text-red-400"
                    : log.type === "warning"
                      ? "text-yellow-400"
                      : log.type === "success"
                        ? "text-accent-primary"
                        : log.type === "info"
                          ? "text-accent-secondary"
                          : "text-text-secondary"
                }`}
              >
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
