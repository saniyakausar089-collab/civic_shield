import React, { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { SimulateTab } from "./SimulateTab";
import { PlansTab } from "./PlansTab";
import { WeakLinksTab } from "./WeakLinksTab";
import { CommandTab } from "./CommandTab";
import { ReportTab } from "./ReportTab";
import { ChevronUp, Minimize2, ChevronDown } from "lucide-react";

export const ResizableAnalysisDrawer: React.FC = () => {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const [drawerState, setDrawerState] = useState<"collapsed" | "compact" | "expanded">("compact");

  const tabs: {
    id: "simulate" | "plans" | "weaklinks" | "command" | "report";
    label: string;
  }[] = [
    { id: "simulate", label: "Simulate" },
    { id: "plans", label: "Plans" },
    { id: "weaklinks", label: "Weak Links" },
    { id: "command", label: "Command" },
    { id: "report", label: "Report" },
  ];

  const heightClass = {
    collapsed: "h-11",
    compact: "h-64 sm:h-72",
    expanded: "h-[55vh]",
  }[drawerState];

  return (
    <div
      className={`w-full bg-[var(--surface)] border-t border-[var(--border)] text-[var(--text)] transition-all duration-200 ease-in-out flex flex-col z-20 shrink-0 font-sans shadow-sm ${heightClass}`}
    >
      {/* Drawer Control & Apple Underline Tab Bar */}
      <div className="h-11 px-4 sm:px-6 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-2)] shrink-0">
        {/* Apple Underline Tab Buttons (Text Only) */}
        <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (drawerState === "collapsed") setDrawerState("compact");
                }}
                className={`relative px-3 py-2.5 text-xs sm:text-[13.5px] font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "text-[var(--text)] font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[var(--accent)] rounded-full animate-in fade-in duration-150" />
                )}
              </button>
            );
          })}
        </div>

        {/* Resizer & Collapse Toggle */}
        <div className="flex items-center gap-2">
          {drawerState !== "collapsed" && (
            <button
              onClick={() => setDrawerState(drawerState === "expanded" ? "compact" : "expanded")}
              className="px-2.5 py-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text)] hover:bg-[var(--surface)] text-[11px] font-medium flex items-center gap-1 border border-transparent hover:border-[var(--border)] transition-colors cursor-pointer"
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
            className="px-2.5 py-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text)] hover:bg-[var(--surface)] text-[11px] font-medium flex items-center gap-1 border border-transparent hover:border-[var(--border)] transition-colors cursor-pointer"
            title={drawerState === "collapsed" ? "Open drawer" : "Collapse drawer"}
          >
            {drawerState === "collapsed" ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>EXPAND</span>
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

      {/* Drawer Content Body */}
      {drawerState !== "collapsed" && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[var(--surface)]">
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
