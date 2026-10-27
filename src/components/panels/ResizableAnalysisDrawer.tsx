import React, { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { SimulateTab } from "./SimulateTab";
import { PlansTab } from "./PlansTab";
import { WeakLinksTab } from "./WeakLinksTab";
import { CommandTab } from "./CommandTab";
import { ReportTab } from "./ReportTab";
import {
  Activity,
  Layers,
  SlidersHorizontal,
  Zap,
  FileSpreadsheet,
  ChevronUp,
  ChevronDown,
  Minimize2,
} from "lucide-react";

export const ResizableAnalysisDrawer: React.FC = () => {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  // States: collapsed (only bar), default (220px), expanded (420px)
  const [drawerState, setDrawerState] = useState<"collapsed" | "compact" | "expanded">("compact");

  const tabs: {
    id: "simulate" | "plans" | "weaklinks" | "command" | "report";
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: "simulate", label: "Simulate", icon: <Layers className="w-3.5 h-3.5" /> },
    { id: "plans", label: "Plans", icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
    { id: "weaklinks", label: "Weak Links", icon: <Activity className="w-3.5 h-3.5" /> },
    { id: "command", label: "Command", icon: <Zap className="w-3.5 h-3.5" /> },
    { id: "report", label: "Report", icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
  ];

  const heightClass = {
    collapsed: "h-9",
    compact: "h-56 sm:h-64",
    expanded: "h-[50vh]",
  }[drawerState];

  return (
    <div
      className={`w-full bg-[#191F24] border-t border-[#303941] text-[#e5e9ec] transition-all duration-200 ease-in-out flex flex-col z-20 shrink-0 ${heightClass}`}
    >
      {/* Drawer Control & Tab Bar */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#303941] bg-[#14191d] shrink-0">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (drawerState === "collapsed") setDrawerState("compact");
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-[#252e35] text-[#9BAA76] border border-[#9BAA76]/50"
                    : "text-[#8a96a1] hover:text-[#d2d8de] hover:bg-[#1f262d]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Resizer & Collapse Toggle */}
        <div className="flex items-center gap-1">
          {drawerState !== "collapsed" && (
            <button
              onClick={() => setDrawerState(drawerState === "expanded" ? "compact" : "expanded")}
              className="p-1 rounded text-[#8a96a1] hover:text-[#f1f4f6] hover:bg-[#242c33] transition-colors text-[10px] flex items-center gap-1"
              title={drawerState === "expanded" ? "Restore drawer height" : "Expand drawer"}
            >
              {drawerState === "expanded" ? (
                <>
                  <Minimize2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Compact</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Expand</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() =>
              setDrawerState(drawerState === "collapsed" ? "compact" : "collapsed")
            }
            className="p-1 rounded text-[#8a96a1] hover:text-[#f1f4f6] hover:bg-[#242c33] transition-colors text-[10px] flex items-center gap-1 font-mono"
            title={drawerState === "collapsed" ? "Open drawer" : "Collapse drawer"}
          >
            {drawerState === "collapsed" ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>OPEN ANALYSIS</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>COLLAPSE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      {drawerState !== "collapsed" && (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-[#191F24]">
          {activeTab === "simulate" && <SimulateTab />}
          {activeTab === "plans" && <PlansTab />}
          {activeTab === "weaklinks" && <WeakLinksTab />}
          {activeTab === "command" && <CommandTab />}
          {activeTab === "report" && <ReportTab />}
        </div>
      )}
    </div>
  );
};
