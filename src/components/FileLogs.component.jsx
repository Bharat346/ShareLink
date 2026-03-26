import { Terminal, Trash2 } from "lucide-react";

export default function FileLogsComponent({ logs, logContainerRef, clearLogs }) {
  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border border-white/10 rounded-lg overflow-hidden shadow-2xl relative font-mono">
      <div className="flex justify-between items-center px-4 py-2 border-b border-white/5 bg-black/50">
        <div className="flex items-center gap-2">
          <Terminal className="w-3 h-3 text-blue-500" />
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Terminal Output</span>
        </div>
        <button 
          onClick={clearLogs} 
          className="text-gray-500 hover:text-white transition-colors flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded hover:bg-white/5"
        >
           <Trash2 className="w-3 h-3" /> Clear
        </button>
      </div>

      <div
        ref={logContainerRef}
        className="flex-grow overflow-y-auto p-4 custom-scrollbar relative z-10 bg-transparent selection:bg-blue-500/30"
        style={{ minHeight: '300px' }}
      >
        <div className="flex flex-col gap-1.5">
          {(!logs || logs.length === 0) && (
            <div className="flex flex-col items-center justify-center h-[200px] gap-3 opacity-20">
              <Terminal className="w-8 h-8 text-white mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white">
                LISTENING_FOR_SIGNAL
              </p>
            </div>
          )}
          {logs && logs.map((log, i) => (
            <div
              key={i}
              className="flex gap-4 group/item animate-fade-in text-[11px] font-medium tracking-wide border-l-2 border-white/0 hover:border-white/10 pl-2 transition-all leading-relaxed"
            >
              <span className="text-gray-600 min-w-[75px] shrink-0 opacity-60 group-hover/item:opacity-100 transition-opacity">
                [{log.time}]
              </span>
              <span
                className={`transition-colors ${
                  log.type === "error"
                    ? "text-red-400"
                    : log.type === "warning"
                      ? "text-yellow-400"
                      : log.type === "success"
                        ? "text-green-400"
                        : log.type === "info"
                          ? "text-blue-400"
                          : "text-gray-300"
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
