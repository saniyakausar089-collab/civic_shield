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
} from "lucide-react";

export const BottomSheet: React.FC = () => {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const [isExpanded, setIsExpanded] = useState(false);

  const tabs: {
    id: "simulate" | "plans" | "weaklinks" | "command" | "report";
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: "simulate", label: "Simulate", icon: <Layers className="w-4 h-4" /> },
    { id: "plans", label: "Plans", icon: <SlidersHorizontal className="w-4 h-4" /> },
    { id: "weaklinks", label: "Weak Links", icon: <Activity className="w-4 h-4" /> },
    { id: "command", label: "Command", icon: <Zap className="w-4 h-4" /> },
    { id: "report", label: "Report", icon: <FileSpreadsheet className="w-4 h-4" /> },
  ];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-xl border-t border-border shadow-2xl transition-all duration-300 ease-in-out flex flex-col ${
        isExpanded ? "h-[75vh]" : "h-64 sm:h-72"
      }`}
    >
      {/* Drag handle & tab switcher */}
      <div className="shrink-0 px-4 pt-2 pb-1 flex flex-col items-center border-b border-border/60">
        {/* Toggle Expand Pill */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors mb-1.5 py-0.5 px-3 rounded-full hover:bg-muted"
        >
          {isExpanded ? (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> Collapse Panel
            </>
          ) : (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> Expand Analysis Panel
            </>
          )}
        </button>

        {/* Tab Switcher Pills */}
        <div className="w-full flex items-center justify-between sm:justify-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-6xl w-full mx-auto">
        {activeTab === "simulate" && <SimulateTab />}
        {activeTab === "plans" && <PlansTab />}
        {activeTab === "weaklinks" && <WeakLinksTab />}
        {activeTab === "command" && <CommandTab />}
        {activeTab === "report" && <ReportTab />}
      </div>
    </div>
  );
};
