// Global app state (Zustand) shared between the 3D scene and the HUD.
import { create } from "zustand";
import { BASE_CITY } from "@/engine/city";
import { runSim, type SimResult } from "@/engine/sim";
import { applyMods, type CityMod } from "@/engine/analysis";
import { planById, type CustomParams } from "@/engine/plans";

export interface Layers {
  power: boolean;
  water: boolean;
  roads: boolean;
  telecom: boolean;
  hospitals: boolean;
}

export interface AppStore {
  view: "landing" | "sim";
  theme: "dark" | "light";
  cityMods: CityMod[];
  presetId: string;
  triggers: string[];
  planId: string;
  custom: CustomParams;
  actionIds: string[];
  result: SimResult;
  hour: number;
  playing: boolean;
  speed: 1 | 4;
  layers: Layers;
  dayNight: "day" | "night";
  selectedNodeId: string | null;
  activeTab: "simulate" | "plans" | "weaklinks" | "command" | "report";
  set: (partial: Partial<AppStore>) => void;
  setPreset: (id: string, triggers: string[]) => void;
  setTriggers: (triggers: string[]) => void;
  toggleTrigger: (id: string) => void;
  setPlan: (id: string) => void;
  setCustom: (partial: Partial<CustomParams>) => void;
  toggleAction: (id: string) => void;
  addMod: (mod: CityMod) => void;
  removeMod: (label: string) => void;
  toggleLayer: (key: keyof Layers) => void;
  select: (id: string | null) => void;
  enterSim: () => void;
  setHour: (h: number) => void;
  togglePlay: () => void;
  setSpeed: (s: 1 | 4) => void;
  setActiveTab: (tab: "simulate" | "plans" | "weaklinks" | "command" | "report") => void;
  toggleTheme: () => void;
}

/** Recompute the effective city + simulation from current inputs. */
export function computeResult(s: {
  cityMods: CityMod[];
  triggers: string[];
  planId: string;
  custom: CustomParams;
  actionIds: string[];
}): SimResult {
  const city = applyMods(BASE_CITY, s.cityMods);
  const plan = planById(s.planId, s.custom);
  return runSim(city, s.triggers, plan, s.actionIds);
}

export const useAppStore = create<AppStore>((set) => ({
  view: "landing",
  theme: "dark",
  cityMods: [],
  presetId: "pipeline",
  triggers: ["PIPE1"],
  planId: "wait",
  custom: { crew: 5, repairSpeed: 0.5, hospitalBackup: 6, waterBuffer: 4, reroute: false },
  actionIds: [],
  result: computeResult({
    cityMods: [],
    triggers: ["PIPE1"],
    planId: "wait",
    custom: { crew: 5, repairSpeed: 0.5, hospitalBackup: 6, waterBuffer: 4, reroute: false },
    actionIds: [],
  }),
  hour: 0,
  playing: false,
  speed: 1,
  layers: { power: true, water: true, roads: true, telecom: true, hospitals: true },
  dayNight: "night",
  selectedNodeId: null,
  activeTab: "simulate",
  set: (partial) => set(partial),
  setPreset: (id, triggers) =>
    set((s) => {
      const next = { ...s, presetId: id, triggers, hour: 0, selectedNodeId: null };
      return { ...next, result: computeResult(next) };
    }),
  setTriggers: (triggers) =>
    set((s) => {
      const next = { ...s, triggers, presetId: "custom", hour: 0 };
      return { ...next, result: computeResult(next) };
    }),
  toggleTrigger: (id) =>
    set((s) => {
      const exists = s.triggers.includes(id);
      const triggers = exists ? s.triggers.filter((t) => t !== id) : [...s.triggers, id];
      const next = { ...s, triggers: triggers.length > 0 ? triggers : [id], presetId: "custom", hour: 0 };
      return { ...next, result: computeResult(next) };
    }),
  setPlan: (id) =>
    set((s) => {
      const next = { ...s, planId: id, hour: 0 };
      return { ...next, result: computeResult(next) };
    }),
  setCustom: (partial) =>
    set((s) => {
      const next = { ...s, custom: { ...s.custom, ...partial }, planId: "custom", hour: 0 };
      return { ...next, result: computeResult(next) };
    }),
  toggleAction: (id) =>
    set((s) => {
      const actionIds = s.actionIds.includes(id)
        ? s.actionIds.filter((a) => a !== id)
        : [...s.actionIds, id];
      const next = { ...s, actionIds, hour: 0 };
      return { ...next, result: computeResult(next) };
    }),
  addMod: (mod) =>
    set((s) => {
      const next = { ...s, cityMods: [...s.cityMods, mod], hour: 0 };
      return { ...next, result: computeResult(next) };
    }),
  removeMod: (label) =>
    set((s) => {
      const next = { ...s, cityMods: s.cityMods.filter((m) => m.label !== label), hour: 0 };
      return { ...next, result: computeResult(next) };
    }),
  toggleLayer: (key) => set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
  select: (id) => set({ selectedNodeId: id }),
  enterSim: () => set({ view: "sim" }),
  setHour: (h) => set({ hour: Math.max(0, Math.min(24, h)) }),
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  setSpeed: (speed) => set({ speed }),
  setActiveTab: (activeTab) => set({ activeTab }),
  toggleTheme: () =>
    set((s) => {
      const theme = s.theme === "dark" ? "light" : "dark";
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.classList.toggle("light", theme === "light");
      }
      return { theme };
    }),
}));

/** Subscribe a component to the current hour snapshot (single object). */
export function currentSnapshot(result: SimResult, hour: number) {
  const index = Math.min(Math.max(0, Math.round(hour)), Math.max(0, result.hours.length - 1));
  const snap = result.hours[index];
  if (snap) return snap;
  return (
    result.hours[0] ?? {
      hour: 0,
      affectedPopulation: 0,
      hospitalsDown: 0,
      systemsFailed: 0,
      lost: {},
      status: {},
    }
  );
}
