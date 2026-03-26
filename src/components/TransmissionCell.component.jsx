import { Zap, Plus, Search } from "lucide-react";

export default function TransmissionCellComponent({
  sessionId,
  startSession,
  joinSession,
  status,
}) {
  return (
    <div className="card overflow-hidden group/cell bg-white/[0.03] hover:bg-white/[0.04] p-10 rounded-[32px] border border-white/5 shadow-2xl transition-all duration-700">
      <div className="mesh-glow opacity-10 group-hover/cell:opacity-20 transition-all duration-700"></div>

      <div className="flex flex-col gap-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)] transition-transform group-hover/cell:scale-110">
            <Zap className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="text-2xl font-black text-white tracking-tighter italic uppercase">
            Bridge Control
          </h3>
        </div>

        <div className="flex flex-col gap-8">
          <button
            onClick={startSession}
            className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(59,130,246,0.5)] hover:bg-blue-500 hover:translate-y-[-2px] active:translate-y-[1px] transition-all flex items-center justify-center gap-3 border-none cursor-pointer"
          >
            Generate Link <Plus className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-6">
            <div className="grow h-px bg-white/5"></div>
            <span className="text-[10px] font-black text-gray-700 uppercase tracking-[0.5em] italic">
              Access Pipeline
            </span>
            <div className="grow h-px bg-white/5"></div>
          </div>

          <div className="flex flex-col gap-4">
            <input
              type="text"
              id="joinInput"
              placeholder="ENTER_SIX_DIGIT_SIGNAL"
              className="bg-[#111111] border border-white/10 text-center font-black text-white rounded-2xl p-4 text-xl tracking-[0.4em] focus:outline-none focus:border-blue-500/40 placeholder:text-gray-500 transition-all shadow-inner"
              maxLength={6}
              onChange={(e) => (e.target.value = e.target.value.toUpperCase())}
            />
            <button
              onClick={() => joinSession(document.getElementById("joinInput").value)}
              className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-gray-200 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 border-none cursor-pointer"
            >
              Sync Connection <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pt-5 border-t border-white/5 flex items-center gap-3 justify-center">
            <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-red-500'}`}></div>
            <span className="text-[12px] font-black text-gray-600 uppercase tracking-[0.2em] italic leading-none">Status: {status}</span>
        </div>
      </div>
    </div>
  );
}
