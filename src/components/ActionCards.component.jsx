import { Globe, Link as LinkIcon, Cpu } from "lucide-react";

export default function ActionCardsComponent() {
  const stats = [
    {
      icon: Globe,
      label: "Relay Mode",
      value: "RELAY-L4",
      color: "text-blue-500",
    },
    {
      icon: LinkIcon,
      label: "Encryption",
      value: "AES-256-GCM",
      color: "text-blue-500",
    },
    {
      icon: Cpu,
      label: "Sync Status",
      value: "ACTIVE_V8",
      color: "text-blue-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="card !p-8 flex flex-col items-center gap-4 bg-white/[0.03] hover:bg-white/[0.05] transition-all group"
        >
          <div className="bg-blue-600/10 p-5 rounded-3xl border border-white/5 transition-all group-hover:bg-blue-600/20 group-hover:border-blue-500/20 shadow-2xl">
            <stat.icon className={`w-8 h-8 ${stat.color} stroke-[2.5]`} />
          </div>
          <div className="text-center">
            <div className="label-caps !text-[11px] !text-gray-500 group-hover:text-gray-400 transition-colors uppercase tracking-[0.2em] font-black">
              {stat.label}
            </div>
            <div className="text-base font-black italic tracking-tighter text-white uppercase group-hover:text-blue-400 transition-colors">
              {stat.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
