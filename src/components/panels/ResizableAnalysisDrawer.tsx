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
  Minimize2,
} from "lucide-react";

export const ResizableAnalysisDrawer: React.FC = () => {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
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
    collapsed: "h-10",
    compact: "h-64 sm:h-72",
    expanded: "h-[55vh]",
  }[drawerState];

  return (
    <div
      className={`w-full bg-white dark:bg-[#111318] border-t border-[#E5E7EB] dark:border-[#27272A] text-[#111827] dark:text-[#FAFAFA] transition-all duration-200 ease-in-out flex flex-col z-20 shrink-0 font-sans shadow-sm ${heightClass}`}
    >
      {/* Drawer Control & Tab Bar */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#27272A] bg-[#F7F8FA] dark:bg-[#181B22] shrink-0">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (drawerState === "collapsed") setDrawerState("compact");
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-all duration-180 cursor-pointer ${
                  isActive
                    ? "bg-white dark:bg-[#111318] text-[#2563EB] dark:text-[#3B82F6] font-semibold border border-[#E5E7EB] dark:border-[#27272A] shadow-2xs"
                    : "text-[#94A3B8] dark:text-[#71717A] hover:text-[#111827] dark:hover:text-[#FAFAFA] hover:bg-white/70 dark:hover:bg-[#111318]/60 font-medium"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Resizer & Collapse Toggle */}
        <div className="flex items-center gap-1.5">
          {drawerState !== "collapsed" && (
            <button
              onClick={() => setDrawerState(drawerState === "expanded" ? "compact" : "expanded")}
              className="px-2 py-1 rounded-md text-[#94A3B8] dark:text-[#71717A] hover:text-[#111827] dark:hover:text-[#FAFAFA] hover:bg-white dark:hover:bg-[#111318] transition-colors text-[11px] flex items-center gap-1 border border-transparent hover:border-[#E5E7EB] dark:hover:border-[#27272A] cursor-pointer"
              title={drawerState === "expanded" ? "Restore drawer height" : "Expand drawer"}
            >
              {drawerState === "expanded" ? (
                <>
                  <Minimize2 className="w-3 h-3" />
                  <span className="hidden sm:inline font-medium">Compact</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-medium">Expand</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() =>
              setDrawerState(drawerState === "collapsed" ? "compact" : "collapsed")
            }
            className="px-2 py-1 rounded-md text-[#94A3B8] dark:text-[#71717A] hover:text-[#111827] dark:hover:text-[#FAFAFA] hover:bg-white dark:hover:bg-[#111318] transition-colors text-[11px] font-medium border border-transparent hover:border-[#E5E7EB] dark:hover:border-[#27272A] cursor-pointer"
            title={drawerState === "collapsed" ? "Open drawer" : "Collapse drawer"}
          >
            {drawerState === "collapsed" ? "EXPAND ↑" : "COLLAPSE ↓"}
          </button>
        </div>
      </div>

      {/* Tab Content Panel */}
      {drawerState !== "collapsed" && (
        <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-[#111318] text-[#111827] dark:text-[#FAFAFA]">
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
