import { Globe, Shield, Zap, Activity, Cpu, Gauge } from "lucide-react";

export default function ActionCards({ speed }) {
  const stats = [
    {
      icon: Gauge,
      label: "Bandwidth_Rate",
      value: `${speed || '0.0'} MB/S`,
      description: "Real-time network egress velocity",
      accent: "text-accent-primary",
      bg: "bg-accent-primary/10",
      border: "border-accent-primary/20"
    },
    {
      icon: Shield,
      label: "Security Protocol",
      value: "AES-256-GCM",
      description: "End-to-end symmetric encryption",
      accent: "text-white",
      bg: "bg-white/5",
      border: "border-white/10"
    },
    {
      icon: Zap,
      label: "Bridge Speed",
      value: "L4_OPTIMIZED",
      description: "Direct peer-to-peer data bridge",
      accent: "text-accent-secondary",
      bg: "bg-accent-secondary/10",
      border: "border-accent-secondary/20"
    },
    {
      icon: Cpu,
      label: "Node Engine",
      value: "V8_SYNC_CORE",
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
          className="card glass p-8 flex flex-col items-center gap-6 group hover:border-accent-primary/50 transition-all animate-in font-mono"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className={`${stat.bg} p-6 rounded-2xl border ${stat.border} transition-all group-hover:scale-110 group-hover:shadow-[0_0_30px_var(--accent-primary-glow)]`}>
            <stat.icon className={`w-8 h-8 ${stat.accent} stroke-[2]`} />
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-accent-primary/40 uppercase tracking-[0.3em] mb-2 px-3 py-1 bg-accent-primary/5 rounded-full inline-block">
              {stat.label}
            </div>
            <div className={`text-xl font-bold tracking-tighter text-text-primary uppercase transition-colors text-glow ${stat.accent === 'text-accent-primary' || stat.accent === 'text-accent-secondary' ? `group-hover:${stat.accent}` : ''}`}>
              {stat.value}
            </div>
            <div className="text-[11px] font-medium text-text-muted mt-3 px-2 italic opacity-50 group-hover:opacity-100 transition-opacity">
               _log::{stat.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
