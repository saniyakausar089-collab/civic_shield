// Global app state (Zustand) shared between the 3D scene and the HUD.
import { create } from "zustand";
import { BASE_CITY } from "@/engine/city";
import { applyMods, type CityMod } from "@/engine/analysis";
import { planById, type CustomParams } from "@/engine/plans";
import {
  simulate,
  type SimResult as CascadeSimResult,
  type Scenario,
  type Frame,
  type NetworkData,
  type NeighborhoodsData,
} from "@/engine/cascade";
import { loadCivicShieldData } from "@/gis/civicshieldLayer";
import { toast } from "sonner";

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

  // Phase 3 simulation state
  selectedScenario: Scenario | null;
  result: CascadeSimResult | null;
  t: number;
  hour: number;
  playing: boolean;
  speed: 1 | 2 | 4;
  networkData: NetworkData | null;
  neighborhoodsData: NeighborhoodsData | null;
  engineError: string | null;

  layers: Layers;
  dayNight: "day" | "night";
  selectedNodeId: string | null;
  selectedGisNode: any | null;
  viewportMode: "cesium" | "three";
  cesiumBuildingStyle: "year" | "height" | "tall" | "none";
  activeTab: "simulate" | "plans" | "weaklinks" | "command" | "report";
  civicShieldLayer: any | null;
  scenariosData: Scenario[];

  set: (partial: Partial<AppStore>) => void;
  runSim: () => Promise<void>;
  play: () => void;
  pause: () => void;
  setT: (t: number) => void;
  setHour: (h: number) => void;
  setSpeed: (s: 1 | 2 | 4) => void;
  resetSim: () => void;
  selectScenario: (scenario: Scenario) => void;
  setCivicShieldData: (data: {
    network: NetworkData;
    neighborhoods: NeighborhoodsData;
    scenarios: Scenario[];
  }) => void;

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
  setSelectedGisNode: (node: any | null) => void;
  setCivicShieldLayer: (layer: any | null) => void;
  setScenariosData: (scenarios: Scenario[]) => void;
  previewScenario: (scenario: any) => void;
  resetAllLayers: () => void;
  enterSim: () => void;
  togglePlay: () => void;
  setActiveTab: (tab: "simulate" | "plans" | "weaklinks" | "command" | "report") => void;
  toggleTheme: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  view: "landing",
  theme: "dark",
  cityMods: [],
  presetId: "monsoon_flood",
  triggers: ["PIPE1", "WT2", "UJ1"],
  planId: "wait",
  custom: { crew: 5, repairSpeed: 0.5, hospitalBackup: 6, waterBuffer: 4, reroute: false },
  actionIds: [],

  // Phase 3 Initial State
  selectedScenario: null,
  result: null,
  t: 0,
  hour: 0,
  playing: false,
  speed: 1,
  networkData: null,
  neighborhoodsData: null,
  engineError: null,

  layers: { power: true, water: true, roads: true, telecom: true, hospitals: true },
  dayNight: "night",
  selectedNodeId: null,
  selectedGisNode: null,
  viewportMode: "cesium",
  cesiumBuildingStyle: "year",
  activeTab: "simulate",
  civicShieldLayer: null,
  scenariosData: [],

  set: (partial) => set(partial),

  runSim: async () => {
    const state = get();
    let network = state.networkData;
    let hoods = state.neighborhoodsData;
    let scenarios = state.scenariosData;

    // Load data if not already cached in store
    if (!network || !hoods || scenarios.length === 0) {
      try {
        const loaded = await loadCivicShieldData();
        network = loaded.network as NetworkData;
        hoods = loaded.neighborhoods as NeighborhoodsData;
        scenarios = loaded.scenarios as Scenario[];
        set({ networkData: network, neighborhoodsData: hoods, scenariosData: scenarios });
      } catch (e: any) {
        console.error("[CIVICSHIELD] Error loading data for simulation:", e);
        toast.error(`Failed to load network data: ${e.message || e}`);
        set({ engineError: `Failed to load network data: ${e.message || e}`, playing: false });
        return;
      }
    }

    // Determine target scenario
    let sc = state.selectedScenario;
    if (!sc) {
      const pId = state.presetId;
      sc =
        scenarios.find(
          (s) =>
            s.id === pId ||
            (pId === "pipeline" && s.id === "pipeline_burst") ||
            (pId === "monsoon" && s.id === "monsoon_flood") ||
            (pId === "heatwave" && s.id === "heatwave_overload") ||
            (pId === "cyber" && s.id === "cyberattack") ||
            (pId === "quake" && s.id === "earthquake")
        ) ??
        scenarios[0] ??
        null;
    }

    if (!sc) {
      toast.error("No scenario found to simulate");
      return;
    }

    try {
      // Clear pulsing preview rings when run starts (Requirement 2)
      if (state.civicShieldLayer && typeof state.civicShieldLayer.clearPreview === "function") {
        state.civicShieldLayer.clearPreview();
      }

      // Synchronously execute cascade simulation (Requirement 2)
      const res = simulate(network, hoods, sc);

      // Apply initial frame 0 (Requirement 4)
      const frame0 = res.frames[0];
      if (frame0 && state.civicShieldLayer) {
        if (typeof state.civicShieldLayer.setNodeStatus === "function") {
          state.civicShieldLayer.setNodeStatus(frame0.status);
        }
        if (typeof state.civicShieldLayer.setNeighborhoodImpact === "function") {
          state.civicShieldLayer.setNeighborhoodImpact(frame0.neighborhood_impact);
        }
      }

      set({
        selectedScenario: sc,
        presetId: sc.id,
        result: res,
        t: 0,
        hour: 0,
        playing: true,
        engineError: null,
      });
    } catch (err: any) {
      console.error("[CIVICSHIELD] Simulation engine error:", err);
      toast.error(`Simulation Engine Error: ${err.message || err}`);
      set({ engineError: `Engine error: ${err.message || err}`, playing: false });
    }
  },

  play: () => {
    const { t, result } = get();
    if (!result) {
      get().runSim();
      return;
    }
    if (t >= 24) {
      get().setT(0);
    }
    set({ playing: true });
  },

  pause: () => {
    set({ playing: false });
  },

  togglePlay: () => {
    const { playing } = get();
    if (playing) {
      get().pause();
    } else {
      get().play();
    }
  },

  setT: (tInput: number) => {
    const t = Math.max(0, Math.min(24, Math.round(tInput)));
    const { result, civicShieldLayer } = get();
    if (result?.frames && result.frames[t]) {
      const frame = result.frames[t]!;
      if (civicShieldLayer) {
        if (typeof civicShieldLayer.setNodeStatus === "function") {
          civicShieldLayer.setNodeStatus(frame.status);
        }
        if (typeof civicShieldLayer.setNeighborhoodImpact === "function") {
          civicShieldLayer.setNeighborhoodImpact(frame.neighborhood_impact);
        }
      }
    }
    set({ t, hour: t });
  },

  setHour: (h: number) => {
    get().setT(h);
  },

  setSpeed: (speed: 1 | 2 | 4) => {
    set({ speed });
  },

  resetSim: () => {
    const { civicShieldLayer, selectedScenario } = get();
    if (civicShieldLayer && typeof civicShieldLayer.resetAll === "function") {
      civicShieldLayer.resetAll();
    }
    if (selectedScenario && civicShieldLayer && typeof civicShieldLayer.previewScenario === "function") {
      civicShieldLayer.previewScenario(selectedScenario);
    }
    set({
      result: null,
      t: 0,
      hour: 0,
      playing: false,
      engineError: null,
      selectedNodeId: null,
      selectedGisNode: null,
    });
  },

  selectScenario: (scenario: Scenario) => {
    const { civicShieldLayer } = get();
    if (civicShieldLayer && typeof civicShieldLayer.resetAll === "function") {
      civicShieldLayer.resetAll();
    }
    if (civicShieldLayer && typeof civicShieldLayer.previewScenario === "function") {
      civicShieldLayer.previewScenario(scenario);
    }
    const triggerNodes = scenario.triggers ? scenario.triggers.map((tr) => tr.node) : [];
    set({
      selectedScenario: scenario,
      presetId: scenario.id,
      triggers: triggerNodes,
      result: null,
      t: 0,
      hour: 0,
      playing: false,
      engineError: null,
      selectedNodeId: null,
      selectedGisNode: null,
    });
  },

  setCivicShieldData: (data) => {
    const pId = get().presetId;
    const initialSc =
      data.scenarios.find(
        (s) =>
          s.id === pId ||
          (pId === "pipeline" && s.id === "pipeline_burst") ||
          (pId === "monsoon" && s.id === "monsoon_flood") ||
          (pId === "heatwave" && s.id === "heatwave_overload") ||
          (pId === "cyber" && s.id === "cyberattack") ||
          (pId === "quake" && s.id === "earthquake")
      ) ?? data.scenarios[0] ?? null;

    set({
      networkData: data.network,
      neighborhoodsData: data.neighborhoods,
      scenariosData: data.scenarios,
      selectedScenario: initialSc,
    });
  },

  setPreset: (id, triggers) => {
    const { scenariosData } = get();
    const match = scenariosData.find(
      (sc) =>
        sc.id === id ||
        (id === "pipeline" && sc.id === "pipeline_burst") ||
        (id === "monsoon" && sc.id === "monsoon_flood") ||
        (id === "heatwave" && sc.id === "heatwave_overload") ||
        (id === "cyber" && sc.id === "cyberattack") ||
        (id === "quake" && sc.id === "earthquake")
    );
    if (match) {
      get().selectScenario(match);
    } else {
      set({ presetId: id, triggers, t: 0, hour: 0, result: null });
    }
  },

  setTriggers: (triggers) =>
    set({ triggers, presetId: "custom", t: 0, hour: 0, result: null }),

  toggleTrigger: (id) =>
    set((s) => {
      const exists = s.triggers.includes(id);
      const triggers = exists ? s.triggers.filter((tr) => tr !== id) : [...s.triggers, id];
      return { triggers: triggers.length > 0 ? triggers : [id], presetId: "custom", t: 0, hour: 0, result: null };
    }),

  setPlan: (id) => set({ planId: id, t: 0, hour: 0 }),
  setCustom: (partial) => set((s) => ({ custom: { ...s.custom, ...partial }, planId: "custom", t: 0, hour: 0 })),
  toggleAction: (id) =>
    set((s) => ({
      actionIds: s.actionIds.includes(id) ? s.actionIds.filter((a) => a !== id) : [...s.actionIds, id],
      t: 0,
      hour: 0,
    })),
  addMod: (mod) => set((s) => ({ cityMods: [...s.cityMods, mod], t: 0, hour: 0 })),
  removeMod: (label) => set((s) => ({ cityMods: s.cityMods.filter((m) => m.label !== label), t: 0, hour: 0 })),

  toggleLayer: (key) =>
    set((s) => {
      const nextLayers = { ...s.layers, [key]: !s.layers[key] };
      const layer = s.civicShieldLayer;
      if (layer && typeof layer.setNetworkVisible === "function") {
        if (key === "power") layer.setNetworkVisible("power", nextLayers.power);
        if (key === "water") layer.setNetworkVisible("water", nextLayers.water);
        if (key === "roads") layer.setNetworkVisible("road", nextLayers.roads);
        if (key === "telecom") layer.setNetworkVisible("telecom", nextLayers.telecom);
      }
      return { layers: nextLayers };
    }),

  select: (id) => set({ selectedNodeId: id }),
  setSelectedGisNode: (selectedGisNode) => set({ selectedGisNode }),
  setCivicShieldLayer: (civicShieldLayer) => set({ civicShieldLayer }),
  setScenariosData: (scenariosData) => set({ scenariosData }),

  previewScenario: (scenario) => {
    get().selectScenario(scenario);
  },

  resetAllLayers: () => {
    get().resetSim();
  },

  enterSim: () => set({ view: "sim" }),
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

if (typeof window !== "undefined") {
  (window as any).__CIVIC_STORE__ = useAppStore;
}

export interface Snapshot {
  hour: number;
  affectedPopulation: number;
  hospitalsDown: number;
  systemsFailed: number;
  lost: Record<string, number>;
  status: Record<string, "ok" | "stressed" | "failed">;
}

/** Subscribe a component to the current hour snapshot (single object). */
export function currentSnapshot(result: any | null, hour: number): Snapshot {
  if (!result) {
    return {
      hour: 0,
      affectedPopulation: 0,
      hospitalsDown: 0,
      systemsFailed: 0,
      lost: {},
      status: {},
    };
  }
  if (Array.isArray(result.frames)) {
    const idx = Math.min(Math.max(0, Math.round(hour)), result.frames.length - 1);
    const frame = result.frames[idx];
    if (!frame) {
      return {
        hour: 0,
        affectedPopulation: 0,
        hospitalsDown: 0,
        systemsFailed: 0,
        lost: {},
        status: {},
      };
    }
    const status: Record<string, "ok" | "stressed" | "failed"> = {};
    for (const [id, st] of Object.entries(frame.status || {})) {
      status[id] = st === "failed" ? "failed" : st === "degraded" ? "stressed" : "ok";
    }
    const lost: Record<string, number> = {};
    for (const [id, f] of Object.entries(frame.functionality || {})) {
      lost[id] = 1 - (f as number);
    }
    return {
      hour: frame.t,
      affectedPopulation: frame.affected_pop,
      hospitalsDown: frame.hospitals_down,
      systemsFailed: frame.failed.length,
      lost,
      status,
    };
  }
  if (Array.isArray(result.hours)) {
    const idx = Math.min(Math.max(0, Math.round(hour)), result.hours.length - 1);
    return (
      result.hours[idx] ?? {
        hour: 0,
        affectedPopulation: 0,
        hospitalsDown: 0,
        systemsFailed: 0,
        lost: {},
        status: {},
      }
    );
  }
  return {
    hour: 0,
    affectedPopulation: 0,
    hospitalsDown: 0,
    systemsFailed: 0,
    lost: {},
    status: {},
  };
}
