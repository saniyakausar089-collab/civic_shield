export interface ChapterInfo {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  shortLabel: string;
}

export const CHAPTERS: ChapterInfo[] = [
  {
    id: 1,
    slug: "city-flyover",
    title: "A City That Works",
    subtitle: "Hyderabad Infrastructure Grid",
    shortLabel: "01 // City Flyover",
  },
  {
    id: 2,
    slug: "pipe-burst",
    title: "One Pipe Bursts",
    subtitle: "Critical Water Main Rupture",
    shortLabel: "02 // Rupture Point",
  },
  {
    id: 3,
    slug: "chain-reaction",
    title: "The Chain Reaction",
    subtitle: "Systemic Interdependent Cascade",
    shortLabel: "03 // Cascade T+14h",
  },
  {
    id: 4,
    slug: "test-the-fix",
    title: "Test The Fix First",
    subtitle: "Real Simulation Plan Comparison",
    shortLabel: "04 // Plan Triage",
  },
  {
    id: 5,
    slug: "ai-report",
    title: "Incident Intelligence",
    subtitle: "Gemini AI Strategic Debrief",
    shortLabel: "05 // AI Report",
  },
  {
    id: 6,
    slug: "simulator-cta",
    title: "Take Command",
    subtitle: "Operational Twin Workspace",
    shortLabel: "06 // Launch Twin",
  },
];

// Key GIS Coordinates in Hyderabad Testbed
export const GIS_NODES = {
  CITY_CENTER: { lon: 78.4867, lat: 17.3850, alt: 4800, pitch: -38, heading: 0 },
  PIPE1: { id: "PIPE1", name: "Main Pipeline", network: "water", lon: 78.4800, lat: 17.3700, alt: 750, pitch: -42, heading: 25 },
  UJ1: { id: "UJ1", name: "East Underpass", network: "road", lon: 78.5050, lat: 17.3700, alt: 600, pitch: -35, heading: 320 },
  PUMPA: { id: "PUMPA", name: "Pump Station A", network: "water", lon: 78.4980, lat: 17.3600, alt: 700, pitch: -38, heading: 15 },
  SUB2: { id: "SUB2", name: "Central Substation", network: "power", lon: 78.4820, lat: 17.3880, alt: 800, pitch: -45, heading: 180 },
  T2: { id: "T2", name: "Telecom Tower 2", network: "telecom", lon: 78.4900, lat: 17.3800, alt: 700, pitch: -40, heading: 220 },
  H1: { id: "H1", name: "City General Hospital", network: "health", lon: 78.5100, lat: 17.3750, alt: 650, pitch: -36, heading: 300 },
};
