import { Shield, Zap, Cpu, Gauge } from "lucide-react";

export default function ActionCards({ speed }) {
  const stats = [
    {
      icon: Gauge,
      label: "Bandwidth",
      value: `${speed || '0.0'} MB/S`,
      description: "Real-time network egress velocity",
      accent: "text-accent-primary",
      bg: "bg-accent-primary/10",
      border: "border-accent-primary/20"
    },
    {
      icon: Shield,
      label: "Security",
      value: "AES-256",
      description: "End-to-end symmetric encryption",
      accent: "text-white",
      bg: "bg-white/5",
      border: "border-white/10"
    },
    {
      icon: Zap,
      label: "Bridge",
      value: "L4_OPT",
      description: "Direct peer-to-peer data bridge",
      accent: "text-accent-secondary",
      bg: "bg-accent-secondary/10",
      border: "border-accent-secondary/20"
    },
    {
      icon: Cpu,
      label: "Node",
      value: "V8_SYNC",
      description: "High-performance byte stream",
      accent: "text-accent-primary",
      bg: "bg-accent-primary/10",
      border: "border-accent-primary/20"
    },
  ];

  return (
    <div className="responsive-grid">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="card glass p-5 sm:p-6 lg:p-8 flex flex-col items-center gap-4 sm:gap-5 lg:gap-6 group hover:border-accent-primary/50 transition-all"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className={`${stat.bg} p-4 sm:p-5 lg:p-6 rounded-sm border ${stat.border} transition-all group-hover:scale-105 group-hover:shadow-[0_0_30px_var(--accent-primary-glow)]`}>
            <stat.icon className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${stat.accent} stroke-[1.5]`} />
          </div>
          <div className="text-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-accent-primary/40 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-2 px-2 sm:px-3 py-1 bg-accent-primary/5 rounded-sm inline-block">
              {stat.label}
            </div>
            <div className={`text-lg sm:text-xl lg:text-2xl font-bold tracking-tighter text-text-primary uppercase transition-colors text-glow`}>
              {stat.value}
            </div>
            <div className="text-[10px] sm:text-[11px] font-medium text-text-muted mt-2 sm:mt-3 opacity-50 group-hover:opacity-100 transition-opacity">
              {stat.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
