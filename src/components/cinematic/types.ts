export interface ChapterInfo {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  shortLabel: string;
  ticker: string;
}

export const CHAPTERS: ChapterInfo[] = [
  {
    id: 1,
    slug: "city-flyover",
    title: "A City That Works",
    subtitle: "Hyderabad Infrastructure Grid",
    shortLabel: "01 // Flyover",
    ticker: "SYS_NORM // All lifelines nominal • 10.2M residents served • Grid freq 50.0 Hz",
  },
  {
    id: 2,
    slug: "pipe-burst",
    title: "One Pipe Bursts",
    subtitle: "Critical Trunk Line Rupture",
    shortLabel: "02 // Rupture",
    ticker: "CRITICAL_ALERT // PIPE1 trunk ruptured at 04:00 • 220 ML/d line pressure dropped to 0.0 BAR",
  },
  {
    id: 3,
    slug: "chain-reaction",
    title: "The Chain Reaction",
    subtitle: "Systemic Interdependent Cascade",
    shortLabel: "03 // Cascade T+14h",
    ticker: "CASCADE_ACTIVE // East Underpass flooded • Substation S2 tripped • City Hospital OFFLINE",
  },
  {
    id: 4,
    slug: "test-the-fix",
    title: "Test The Fix First",
    subtitle: "Real Simulation Plan Comparison",
    shortLabel: "04 // Plan Triage",
    ticker: "TRIAGE_ENGINE // Plan 1 isolation saves 83.5% pop-hours • Hospital downtime 11h → 0h",
  },
  {
    id: 5,
    slug: "ai-report",
    title: "Incident Intelligence",
    subtitle: "Gemini AI Strategic Debrief",
    shortLabel: "05 // AI Report",
    ticker: "AI_BRIEF // Incident brief generated • Executive dispatch directive verified",
  },
  {
    id: 6,
    slug: "simulator-cta",
    title: "Take Command",
    subtitle: "Operational Twin Workspace",
    shortLabel: "06 // Launch Twin",
    ticker: "TWIN_STANDBY // Interactive geospatial sandbox ready • 5 crisis presets available",
  },
];

// Key GIS Coordinates in Hyderabad Testbed
export const GIS_NODES = {
  CITY_CENTER: { lon: 78.4867, lat: 17.3850, alt: 3200, pitch: -36, heading: 25 },
  PIPE1: { id: "PIPE1", name: "Main Pipeline", network: "water", lon: 78.4800, lat: 17.3700, alt: 340, pitch: -30, heading: 42 },
  UJ1: { id: "UJ1", name: "East Underpass", network: "road", lon: 78.5050, lat: 17.3700, alt: 380, pitch: -29, heading: 68 },
  PUMPA: { id: "PUMPA", name: "Pump Station A", network: "water", lon: 78.4980, lat: 17.3600, alt: 420, pitch: -31, heading: 50 },
  SUB2: { id: "SUB2", name: "Central Substation", network: "power", lon: 78.4820, lat: 17.3880, alt: 520, pitch: -34, heading: 145 },
  T2: { id: "T2", name: "Telecom Tower 2", network: "telecom", lon: 78.4900, lat: 17.3800, alt: 480, pitch: -32, heading: 210 },
  H1: { id: "H1", name: "City General Hospital", network: "health", lon: 78.5100, lat: 17.3750, alt: 360, pitch: -28, heading: 295 },
};

export interface CameraKeyframe {
  progress: number;
  lon: number;
  lat: number;
  alt: number;
  pitch: number;
  heading: number;
}

// Continuous, Keyframed Camera Trajectory Across the Story
// Ensures dynamic motion with zero dead zones and minimum altitude >= 300m
export const CAMERA_SPLINE_KEYFRAMES: CameraKeyframe[] = [
  { progress: 0.00, lon: 78.4867, lat: 17.3850, alt: 3200, pitch: -36, heading: 25 },
  { progress: 0.15, lon: 78.4835, lat: 17.3780, alt: 1700, pitch: -33, heading: 32 },
  { progress: 0.22, lon: 78.4800, lat: 17.3700, alt: 340, pitch: -30, heading: 42 },
  { progress: 0.32, lon: 78.4950, lat: 17.3680, alt: 380, pitch: -29, heading: 68 },
  { progress: 0.44, lon: 78.4820, lat: 17.3880, alt: 520, pitch: -34, heading: 145 },
  { progress: 0.52, lon: 78.4900, lat: 17.3800, alt: 480, pitch: -32, heading: 210 },
  { progress: 0.60, lon: 78.5100, lat: 17.3750, alt: 360, pitch: -28, heading: 295 },
  { progress: 0.72, lon: 78.4950, lat: 17.3740, alt: 1200, pitch: -38, heading: 325 },
  { progress: 0.85, lon: 78.4920, lat: 17.3780, alt: 2100, pitch: -42, heading: 355 },
  { progress: 1.00, lon: 78.4880, lat: 17.3820, alt: 3500, pitch: -45, heading: 20 },
];

/**
 * Hermite / Smoothstep easing
 */
export function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

/**
 * Shortest-arc angle interpolation (degrees)
 */
export function lerpAngle(a: number, b: number, t: number): number {
  const diff = ((b - a + 540) % 360) - 180;
  return a + diff * t;
}

/**
 * Evaluate camera position & orientation along the continuous spline
 */
export function evaluateCameraSpline(progress: number): {
  lon: number;
  lat: number;
  alt: number;
  pitch: number;
  heading: number;
} {
  const p = Math.max(0, Math.min(1, progress));
  const frames = CAMERA_SPLINE_KEYFRAMES;

  if (p <= frames[0]!.progress) return { ...frames[0]! };
  if (p >= frames[frames.length - 1]!.progress) return { ...frames[frames.length - 1]! };

  let idx = 0;
  for (let i = 0; i < frames.length - 1; i++) {
    if (p >= frames[i]!.progress && p <= frames[i + 1]!.progress) {
      idx = i;
      break;
    }
  }

  const k1 = frames[idx]!;
  const k2 = frames[idx + 1]!;
  const segProgress = (p - k1.progress) / (k2.progress - k1.progress);
  const t = smoothstep(segProgress);

  return {
    lon: k1.lon + (k2.lon - k1.lon) * t,
    lat: k1.lat + (k2.lat - k1.lat) * t,
    alt: k1.alt + (k2.alt - k1.alt) * t,
    pitch: k1.pitch + (k2.pitch - k1.pitch) * t,
    heading: lerpAngle(k1.heading, k2.heading, t),
  };
}
