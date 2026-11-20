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

// Key GIS Coordinates in Hyderabad Testbed for Dramatic Low-Altitude Viewing
export const GIS_NODES = {
  CITY_CENTER: { lon: 78.4867, lat: 17.3850, alt: 3800, pitch: -34, heading: 15 },
  PIPE1: { id: "PIPE1", name: "Main Pipeline", network: "water", lon: 78.4800, lat: 17.3700, alt: 680, pitch: -34, heading: 40 },
  UJ1: { id: "UJ1", name: "East Underpass", network: "road", lon: 78.5050, lat: 17.3700, alt: 580, pitch: -32, heading: 310 },
  PUMPA: { id: "PUMPA", name: "Pump Station A", network: "water", lon: 78.4980, lat: 17.3600, alt: 640, pitch: -34, heading: 25 },
  SUB2: { id: "SUB2", name: "Central Substation", network: "power", lon: 78.4820, lat: 17.3880, alt: 720, pitch: -35, heading: 170 },
  T2: { id: "T2", name: "Telecom Tower 2", network: "telecom", lon: 78.4900, lat: 17.3800, alt: 660, pitch: -32, heading: 215 },
  H1: { id: "H1", name: "City General Hospital", network: "health", lon: 78.5100, lat: 17.3750, alt: 560, pitch: -30, heading: 295 },
};
