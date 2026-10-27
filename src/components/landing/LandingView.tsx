import React from "react";
import { useAppStore } from "@/store/appStore";
import { PRESETS } from "@/engine/plans";
import { Shield, ArrowRight, Zap, Droplets, Flame, Globe, Activity } from "lucide-react";

export const LandingView: React.FC = () => {
  const enterSim = useAppStore((s) => s.enterSim);
  const setPreset = useAppStore((s) => s.setPreset);

  const getPresetIcon = (id: string) => {
    switch (id) {
      case "pipeline":
        return <Droplets className="w-5 h-5 text-[#5c8ca3]" />;
      case "monsoon":
        return <Globe className="w-5 h-5 text-[#6c8ca3]" />;
      case "heatwave":
        return <Flame className="w-5 h-5 text-[#d4a359]" />;
      case "cyber":
        return <Zap className="w-5 h-5 text-[#e09f3e]" />;
      case "quake":
        return <Activity className="w-5 h-5 text-[#d9534f]" />;
      default:
        return <Shield className="w-5 h-5 text-[#9BAA76]" />;
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#101418] text-[#e5e9ec] flex flex-col justify-between p-6 sm:p-12 overflow-y-auto selection:bg-[#9BAA76] selection:text-[#101418]">
      {/* Background subtle radial gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#9BAA76]/5 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[#5c8ca3]/5 blur-[130px] pointer-events-none rounded-full" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded bg-[#9BAA76] shadow-sm" />
          <h1 className="text-lg font-bold tracking-wider font-mono">
            CIVIC<span className="text-[#9BAA76]">SHIELD</span>
          </h1>
        </div>
        <span className="text-xs font-mono text-[#8a96a1] uppercase px-2.5 py-1 rounded border border-[#303941] bg-[#191F24]">
          GIS Resilience Simulator
        </span>
      </header>

      {/* Center Hero */}
      <main className="relative z-10 my-auto py-12 max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#191F24] border border-[#303941] text-[#9BAA76] text-xs font-mono">
          <Shield className="w-3.5 h-3.5" />
          <span>Interdependent Infrastructure Resilience Analysis</span>
        </div>

        <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#f1f4f6] font-display leading-[1.08]">
          Break one thing. <br />
          <span className="text-[#9BAA76]">
            Watch the city follow.
          </span>
        </h2>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-sans leading-relaxed">
          Explore systemic cascades in real-time. When a water main bursts or a substation trips, hospital generators run down, underpasses flood, and telecommunication halts. Simulate the chaos. Formulate the response.
        </p>

        {/* Start Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={enterSim}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-base flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Launch Simulation</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Scenario Presets Quick Jump */}
        <div className="pt-10">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
            Or launch directly with a crisis preset:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPreset(p.id, p.triggers);
                  enterSim();
                }}
                className="p-3 rounded-xl bg-card/60 hover:bg-card/90 border border-border/80 hover:border-cyan-500/50 flex flex-col items-center text-center gap-1.5 transition-all group"
              >
                <div className="p-2 rounded-lg bg-muted/40 group-hover:scale-110 transition-transform">
                  {getPresetIcon(p.id)}
                </div>
                <span className="text-xs font-semibold text-foreground">{p.label}</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {p.triggers.length} {p.triggers.length === 1 ? "node" : "nodes"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-muted-foreground border-t border-border/40 pt-4">
        <div>26-Node Synthetic Graph • 24h Cascade Horizon • 200-Run Monte Carlo</div>
        <div>Pure TypeScript Engine • Framework-Agnostic Core</div>
      </footer>
    </div>
  );
};
