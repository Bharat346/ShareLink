import { Activity, Globe } from "lucide-react";

export default function PathStatsComponent({ vpnIp, status }) {
  return (
    <div className="card !p-8 group hover:bg-white/[0.04]">
      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex-center border border-blue-500/20">
          <Activity className="text-blue-500 w-4 h-4" />
        </div>
        <h3 className="text-xl font-black text-white tracking-tight italic">Analytics</h3>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="flex justify-between items-center py-5 border-b border-white/5 last:border-0 group-hover:border-white/10 transition-all">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-widest group-hover:text-gray-300 transition-colors">Relay Link</span>
          <span className={`text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${status === 'connected' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
            {status === 'connected' ? 'Secure' : 'Inactive'}
          </span>
        </div>

        <div className="flex justify-between items-center py-5 border-b border-white/5 last:border-0 group-hover:border-white/10 transition-all">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-widest group-hover:text-gray-300 transition-colors">Mesh Latency</span>
          <span className="text-base font-black italic tracking-tighter text-white">12.4ms</span>
        </div>

        <div className="bg-white/5 rounded-2xl p-6 flex flex-col gap-2 border border-white/5 group-hover:bg-white/10 transition-all">
          <div className="flex items-center gap-2 opacity-50">
            <Globe className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Public Route</span>
          </div>
          <span className="text-xl font-black italic tracking-tighter text-blue-400 truncate">{vpnIp}</span>
        </div>
      </div>
    </div>
  );
}
