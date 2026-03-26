import { Shield, RefreshCw, Radio } from "lucide-react";

export default function VaultHeaderComponent({
  isServerConnected,
  vpnEnabled,
  setVpnEnabled,
  vpnIp,
  syncing,
  syncConnection,
  status,
}) {
  return (
    <div className="flex items-center justify-between gap-6 mb-12 animate-fade-in group text-center">
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 flex items-center justify-center bg-blue-600/10 rounded-2xl border border-white/10 group-hover:border-blue-500/30 transition-all duration-500 shadow-[0_0_40px_rgba(37,99,235,0.05)]">
          <Shield className="w-8 h-8 text-blue-500" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-gradient tracking-tighter">
            Share Link
          </h1>
          <div className="flex gap-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Protocol v2.4.0
            </span>
            <div className="w-1 h-1 rounded-full bg-gray-800 self-center"></div>
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
              {status === "connected" ? "Secure Link Active" : "Status: " + status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* VPN TOGGLE IN HEADER */}
        <div className="bg-white/5 border border-white/5 px-6 py-3 rounded-2xl flex items-center gap-6 backdrop-blur-3xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-start gap-1">
             <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-full border border-white/5 scale-90">
                <button 
                  onClick={() => setVpnEnabled(false)}
                  className={`px-3 py-1 rounded-full text-[14px] font-black transition-all ${!vpnEnabled ? "bg-white text-black shadow-lg" : "text-gray-500 hover:text-white"}`}
                >
                  VPN OFF
                </button>
                <button 
                  onClick={() => setVpnEnabled(true)}
                  className={`px-3 py-1 rounded-full text-[14px] font-black transition-all ${vpnEnabled ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]" : "text-gray-500 hover:text-white"}`}
                >
                  VPN ON
                </button>
             </div>
          </div>

          <div className="w-px h-8 bg-white/5 self-center"></div>

          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-gray-500 uppercase mb-1 tracking-widest">
              Tunnel Path
            </span>
            <span className="text-lg font-black italic tracking-tighter text-blue-400 leading-none">
              {vpnIp}
            </span>
          </div>
        </div>

        <button
          onClick={syncConnection}
          className={`w-12 h-12 flex items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 hover:border-blue-500/40 flex-center transition-all hover:scale-105 active:scale-95`}
        >
          <RefreshCw
            className={`w-5 h-5 text-blue-500 ${syncing ? "animate-spin" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}
