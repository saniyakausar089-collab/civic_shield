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

interface AppStore {
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
  set: (partial: Partial<AppStore>) => void;
  setPreset: (id: string, triggers: string[]) => void;
  setPlan: (id: string) => void;
  setCustom: (partial: Partial<CustomParams>) => void;
  toggleAction: (id: string) => void;
  addMod: (mod: CityMod) => void;
  removeMod: (label: string) => void;
  toggleLayer: (key: keyof Layers) => void;
  select: (id: string | null) => void;
  enterSim: () => void;
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
  result: computeResult({ cityMods: [], triggers: ["PIPE1"], planId: "wait", custom: { crew: 5, repairSpeed: 0.5, hospitalBackup: 6, waterBuffer: 4, reroute: false }, actionIds: [] }),
  hour: 0,
  playing: false,
  speed: 1,
  layers: { power: true, water: true, roads: true, telecom: true, hospitals: true },
  dayNight: "night",
  selectedNodeId: null,
  set: (partial) => set(partial),
  setPreset: (id, triggers) => set({ presetId: id, triggers, hour: 0, selectedNodeId: null }),
  setPlan: (id) => set({ planId: id, hour: 0 }),
  setCustom: (partial) => set((s) => ({ custom: { ...s.custom, ...partial }, planId: "custom", hour: 0 })),
  toggleAction: (id) =>
    set((s) => ({
      actionIds: s.actionIds.includes(id) ? s.actionIds.filter((a) => a !== id) : [...s.actionIds, id],
      hour: 0,
    })),
  addMod: (mod) => set((s) => ({ cityMods: [...s.cityMods, mod], hour: 0 })),
  removeMod: (label) => set((s) => ({ cityMods: s.cityMods.filter((m) => m.label !== label), hour: 0 })),
  toggleLayer: (key) => set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
  select: (id) => set({ selectedNodeId: id }),
  enterSim: () => set({ view: "sim" }),
}));

/** Subscribe a component to the current hour snapshot (single object). */
export function currentSnapshot(result: SimResult, hour: number) {
  return result.hours[Math.min(Math.max(0, Math.round(hour)), result.hours.length - 1)];
}
