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
        return <Droplets className="w-5 h-5 text-[#0078D4]" />;
      case "monsoon":
        return <Globe className="w-5 h-5 text-[#0078D4]" />;
      case "heatwave":
        return <Flame className="w-5 h-5 text-amber-600" />;
      case "cyber":
        return <Zap className="w-5 h-5 text-amber-600" />;
      case "quake":
        return <Activity className="w-5 h-5 text-rose-600" />;
      default:
        return <Shield className="w-5 h-5 text-[#0078D4]" />;
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F7F8F5] text-[#111827] flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-[#0078D4]/15">
      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between bg-white border border-[#E5E7EB] rounded-2xl px-6 py-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-[#0078D4] flex items-center justify-center text-white shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <h1 className="text-[17px] font-semibold tracking-tight text-[#111827]">
            Civic<span className="text-[#0078D4]">Shield</span>
          </h1>
        </div>
        <span className="text-[13px] text-[#64748B] font-normal px-3 py-1 rounded-[6px] border border-[#E5E7EB] bg-[#F7F8F5]">
          GIS Resilience Simulator
        </span>
      </header>

      {/* Center Hero */}
      <main className="relative z-10 my-auto py-12 max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#E5E7EB] text-[#334155] text-[13px] font-medium shadow-2xs">
          <Shield className="w-3.5 h-3.5 text-[#0078D4]" />
          <span>Interdependent Infrastructure Resilience Analysis</span>
        </div>

        <h2 className="text-[36px] sm:text-[48px] lg:text-[60px] font-semibold text-[#111827] leading-[1.12] tracking-[-2px]">
          Break one thing. <br />
          <span className="text-[#0078D4]">
            Watch the city follow.
          </span>
        </h2>

        <p className="max-w-2xl mx-auto text-[17px] sm:text-[18px] text-[#334155] leading-[1.6] font-normal">
          Explore systemic cascades in real time. When a water main bursts or a substation trips, hospital generators run down, underpasses flood, and telecommunications halt. Simulate the cascade and evaluate emergency interventions.
        </p>

        {/* Start Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={enterSim}
            className="w-full sm:w-auto px-8 py-3.5 rounded-[8px] bg-[#0078D4] hover:bg-[#006CBD] text-white font-semibold text-[15px] flex items-center justify-center gap-2.5 transition-all duration-200 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:ring-offset-2"
          >
            <span>Launch Simulation</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Scenario Presets Quick Jump */}
        <div className="pt-10">
          <p className="text-[13px] uppercase tracking-wider text-[#64748B] font-medium mb-4">
            Or launch directly with a crisis scenario preset:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPreset(p.id, p.triggers);
                  enterSim();
                }}
                className="p-4 rounded-[8px] bg-white hover:bg-[#F7F8F5] border border-[#E5E7EB] hover:border-[#0078D4] flex flex-col items-center text-center gap-2 transition-all duration-200 shadow-2xs group cursor-pointer"
              >
                <div className="p-2.5 rounded-[6px] bg-[#F7F8F5] group-hover:scale-105 transition-transform">
                  {getPresetIcon(p.id)}
                </div>
                <span className="text-[14px] font-semibold text-[#111827]">{p.label}</span>
                <span className="text-[12px] text-[#64748B]">
                  {p.triggers.length} {p.triggers.length === 1 ? "trigger" : "triggers"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#64748B] border-t border-[#E5E7EB] pt-6">
        <div>26-Node Synthetic Graph • 24h Cascade Horizon • 200-Run Monte Carlo</div>
        <div>Pure TypeScript Engine • Framework-Agnostic Core</div>
      </footer>
    </div>
  );
};
