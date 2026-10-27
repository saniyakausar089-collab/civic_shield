// Geographic coordinates for CIVICSHIELD Synthetic Urban Infrastructure
// Supports both Hyderabad (HITEC City / Musi Basin) and San Francisco Bay Basin testbeds.
// All infrastructure assets are clearly tagged as SYNTHETIC SIMULATION MODELS.

export interface GeoLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  elevation: number;
  district: string;
  footprintType: "industrial" | "commercial" | "substation" | "infrastructure" | "hospital" | "residential" | "corridor";
  footprintDimensions: [number, number]; // width, depth in meters
}

export interface CityRegion {
  id: "hyderabad" | "sanfrancisco";
  name: string;
  sublabel: string;
  origin: {
    lat: number;
    lng: number;
    elevation: number;
  };
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  nodes: Record<string, GeoLocation>;
}

// ── Hyderabad Region (Synthetic HITEC City / Musi River Drainage & Power Corridor) ──
export const HYDERABAD_REGION: CityRegion = {
  id: "hyderabad",
  name: "Hyderabad Urban Sector (Synthetic Testbed)",
  sublabel: "HITEC City & Gachibowli Infrastructure Corridor",
  origin: {
    lat: 17.4399,
    lng: 78.3755,
    elevation: 540,
  },
  bounds: {
    minLat: 17.4000,
    maxLat: 17.4800,
    minLng: 78.3200,
    maxLng: 78.4300,
  },
  nodes: {
    PP1: {
      id: "PP1",
      name: "Central Thermal / Sub-grid Plant",
      lat: 17.4410,
      lng: 78.3300,
      elevation: 545,
      district: "West Industrial Substation Belt",
      footprintType: "industrial",
      footprintDimensions: [90, 70],
    },
    SUB1: {
      id: "SUB1",
      name: "North Gachibowli Substation",
      lat: 17.4580,
      lng: 78.3550,
      elevation: 550,
      district: "Financial District Grid",
      footprintType: "substation",
      footprintDimensions: [50, 45],
    },
    SUB2: {
      id: "SUB2",
      name: "HITEC Central Substation",
      lat: 17.4435,
      lng: 78.3770,
      elevation: 542,
      district: "Cyberabad Civic Center",
      footprintType: "substation",
      footprintDimensions: [55, 50],
    },
    SUB3: {
      id: "SUB3",
      name: "South Madhapur Substation",
      lat: 17.4260,
      lng: 78.3700,
      elevation: 538,
      district: "South Madhapur Gateway",
      footprintType: "substation",
      footprintDimensions: [50, 45],
    },
    WT1: {
      id: "WT1",
      name: "North Water Works (Durgam Reservoir)",
      lat: 17.4650,
      lng: 78.3880,
      elevation: 535,
      district: "Durgam Cheruvu Basin",
      footprintType: "infrastructure",
      footprintDimensions: [75, 65],
    },
    WT2: {
      id: "WT2",
      name: "South Water Treatment Complex",
      lat: 17.4180,
      lng: 78.3880,
      elevation: 530,
      district: "Kavuri Hills Water Works",
      footprintType: "infrastructure",
      footprintDimensions: [75, 65],
    },
    PIPE1: {
      id: "PIPE1",
      name: "Main Water Transmission Trunk",
      lat: 17.4420,
      lng: 78.3960,
      elevation: 536,
      district: "Mindspace Water Spine",
      footprintType: "infrastructure",
      footprintDimensions: [30, 95],
    },
    PUMPA: {
      id: "PUMPA",
      name: "Pump Station A (Cyber Towers)",
      lat: 17.4585,
      lng: 78.4060,
      elevation: 540,
      district: "HITEC Junction Booster",
      footprintType: "infrastructure",
      footprintDimensions: [40, 35],
    },
    PUMPB: {
      id: "PUMPB",
      name: "Pump Station B (Inorbit Loop)",
      lat: 17.4340,
      lng: 78.4065,
      elevation: 535,
      district: "Durgam Cheruvu Outlet",
      footprintType: "infrastructure",
      footprintDimensions: [42, 38],
    },
    PUMPC: {
      id: "PUMPC",
      name: "Pump Station C (Jubilee Link)",
      lat: 17.4250,
      lng: 78.3965,
      elevation: 534,
      district: "South Water Feed",
      footprintType: "infrastructure",
      footprintDimensions: [40, 35],
    },
    H1: {
      id: "H1",
      name: "Eastside Medical (AIG / Care Hub)",
      lat: 17.4500,
      lng: 78.4160,
      elevation: 545,
      district: "Gachibowli Health City",
      footprintType: "hospital",
      footprintDimensions: [85, 75],
    },
    H2: {
      id: "H2",
      name: "Riverside Hospital (Apollo Outreach)",
      lat: 17.4245,
      lng: 78.4165,
      elevation: 542,
      district: "Jubilee Enclave Healthcare",
      footprintType: "hospital",
      footprintDimensions: [80, 70],
    },
    N1: {
      id: "N1",
      name: "Harborview Enclave",
      lat: 17.4660,
      lng: 78.3310,
      elevation: 555,
      district: "Financial North Sector",
      footprintType: "residential",
      footprintDimensions: [95, 85],
    },
    N2: {
      id: "N2",
      name: "Old Cyber Town",
      lat: 17.4505,
      lng: 78.3410,
      elevation: 548,
      district: "Cyberabad Old Quarter",
      footprintType: "residential",
      footprintDimensions: [110, 90],
    },
    N3: {
      id: "N3",
      name: "Riverside Residential",
      lat: 17.4335,
      lng: 78.3415,
      elevation: 540,
      district: "Bio-Diversity Park Enclave",
      footprintType: "residential",
      footprintDimensions: [115, 95],
    },
    N4: {
      id: "N4",
      name: "Millbrook Colony",
      lat: 17.4420,
      lng: 78.3510,
      elevation: 544,
      district: "Gachibowli Midtown",
      footprintType: "residential",
      footprintDimensions: [90, 80],
    },
    N5: {
      id: "N5",
      name: "Hillcrest Heights",
      lat: 17.4590,
      lng: 78.3610,
      elevation: 560,
      district: "Kondapur Ridge",
      footprintType: "residential",
      footprintDimensions: [100, 85],
    },
    N6: {
      id: "N6",
      name: "Southgate Enclave",
      lat: 17.4240,
      lng: 78.3610,
      elevation: 538,
      district: "Khajaguda Commons",
      footprintType: "residential",
      footprintDimensions: [110, 90],
    },
    N7: {
      id: "N7",
      name: "Eastgate Tech Zone",
      lat: 17.4590,
      lng: 78.4250,
      elevation: 538,
      district: "Kavuri Hills Commercial",
      footprintType: "residential",
      footprintDimensions: [105, 90],
    },
    N8: {
      id: "N8",
      name: "Docklands Logistic Hub",
      lat: 17.4240,
      lng: 78.4250,
      elevation: 532,
      district: "Madhapur Logistics Basin",
      footprintType: "residential",
      footprintDimensions: [95, 80],
    },
    RJ1: {
      id: "RJ1",
      name: "North Junction (Cyber Towers Flyover)",
      lat: 17.4590,
      lng: 78.3960,
      elevation: 541,
      district: "Outer Ring Interchange North",
      footprintType: "corridor",
      footprintDimensions: [60, 60],
    },
    RJ2: {
      id: "RJ2",
      name: "South Junction (Gachibowli ORR Flyover)",
      lat: 17.4160,
      lng: 78.4060,
      elevation: 535,
      district: "ORR South Junction",
      footprintType: "corridor",
      footprintDimensions: [60, 60],
    },
    UJ1: {
      id: "UJ1",
      name: "East Underpass (Mindspace Flood Sump)",
      lat: 17.4420,
      lng: 78.4060,
      elevation: 526, // Low drainage point prone to monsoon flooding
      district: "Depressed Grade Rail Corridor",
      footprintType: "corridor",
      footprintDimensions: [75, 40],
    },
    T1: {
      id: "T1",
      name: "Harbor Telecom Tower",
      lat: 17.4670,
      lng: 78.4260,
      elevation: 570,
      district: "North Microwave Relay Mast",
      footprintType: "infrastructure",
      footprintDimensions: [25, 25],
    },
    T2: {
      id: "T2",
      name: "Central 5G Telecom Mast",
      lat: 17.4420,
      lng: 78.4260,
      elevation: 575,
      district: "Cyberabad Spine Tower",
      footprintType: "infrastructure",
      footprintDimensions: [28, 28],
    },
    T3: {
      id: "T3",
      name: "South Tower Relay",
      lat: 17.4160,
      lng: 78.4260,
      elevation: 565,
      district: "South Ridge Mast",
      footprintType: "infrastructure",
      footprintDimensions: [25, 25],
    },
  },
};

// ── San Francisco Bay District (Existing reference testbed) ──
export const SF_REGION: CityRegion = {
  id: "sanfrancisco",
  name: "Bay Central District (Simulated Twin)",
  sublabel: "San Francisco Basin Synthetic Testbed",
  origin: {
    lat: 37.7749,
    lng: -122.4194,
    elevation: 20,
  },
  bounds: {
    minLat: 37.745,
    maxLat: 37.805,
    minLng: -122.465,
    maxLng: -122.375,
  },
  nodes: {
    PP1: { id: "PP1", name: "Central Grid Plant", lat: 37.7750, lng: -122.4550, elevation: 12, district: "West Industrial Port", footprintType: "industrial", footprintDimensions: [85, 65] },
    SUB1: { id: "SUB1", name: "North Substation", lat: 37.7910, lng: -122.4380, elevation: 25, district: "Northside Heights", footprintType: "substation", footprintDimensions: [50, 45] },
    SUB2: { id: "SUB2", name: "Central Substation", lat: 37.7745, lng: -122.4290, elevation: 18, district: "Central Civic Core", footprintType: "substation", footprintDimensions: [55, 50] },
    SUB3: { id: "SUB3", name: "South Substation", lat: 37.7580, lng: -122.4375, elevation: 22, district: "South Valley Gateway", footprintType: "substation", footprintDimensions: [50, 45] },
    WT1: { id: "WT1", name: "North Water Works", lat: 37.7990, lng: -122.4200, elevation: 8, district: "North Bay Reservoir", footprintType: "infrastructure", footprintDimensions: [70, 60] },
    WT2: { id: "WT2", name: "South Water Works", lat: 37.7500, lng: -122.4200, elevation: 10, district: "Estuary Water Plant", footprintType: "infrastructure", footprintDimensions: [75, 65] },
    PIPE1: { id: "PIPE1", name: "Main Pipeline", lat: 37.7748, lng: -122.4110, elevation: 14, district: "Metro Spine Corridor", footprintType: "infrastructure", footprintDimensions: [30, 90] },
    PUMPA: { id: "PUMPA", name: "Pump Station A", lat: 37.7915, lng: -122.4020, elevation: 16, district: "Northeast Pressurization", footprintType: "infrastructure", footprintDimensions: [40, 35] },
    PUMPB: { id: "PUMPB", name: "Pump Station B", lat: 37.7665, lng: -122.4025, elevation: 15, district: "East Central Pump Zone", footprintType: "infrastructure", footprintDimensions: [42, 38] },
    PUMPC: { id: "PUMPC", name: "Pump Station C", lat: 37.7585, lng: -122.4115, elevation: 14, district: "Southeast Distribution", footprintType: "infrastructure", footprintDimensions: [40, 35] },
    H1: { id: "H1", name: "Eastside Medical", lat: 37.7830, lng: -122.3930, elevation: 20, district: "Healthcare Complex East", footprintType: "hospital", footprintDimensions: [80, 75] },
    H2: { id: "H2", name: "Riverside Hospital", lat: 37.7580, lng: -122.3935, elevation: 16, district: "South Waterfront Health District", footprintType: "hospital", footprintDimensions: [75, 70] },
    N1: { id: "N1", name: "Harborview", lat: 37.7995, lng: -122.4555, elevation: 32, district: "Harbor District", footprintType: "residential", footprintDimensions: [95, 85] },
    N2: { id: "N2", name: "Old Town", lat: 37.7830, lng: -122.4465, elevation: 28, district: "Historic Sector", footprintType: "residential", footprintDimensions: [110, 90] },
    N3: { id: "N3", name: "Riverside", lat: 37.7665, lng: -122.4460, elevation: 18, district: "Canal Quarter", footprintType: "residential", footprintDimensions: [115, 95] },
    N4: { id: "N4", name: "Millbrook", lat: 37.7748, lng: -122.4375, elevation: 20, district: "Central Midtown", footprintType: "residential", footprintDimensions: [90, 80] },
    N5: { id: "N5", name: "Hillcrest", lat: 37.7915, lng: -122.4290, elevation: 45, district: "Uptown Ridge", footprintType: "residential", footprintDimensions: [100, 85] },
    N6: { id: "N6", name: "Southgate", lat: 37.7580, lng: -122.4290, elevation: 15, district: "Southgate Urban Commons", footprintType: "residential", footprintDimensions: [110, 90] },
    N7: { id: "N7", name: "Eastgate", lat: 37.7915, lng: -122.3840, elevation: 12, district: "Eastgate Residential Basin", footprintType: "residential", footprintDimensions: [105, 90] },
    N8: { id: "N8", name: "Docklands", lat: 37.7580, lng: -122.3840, elevation: 8, district: "Maritime Basin", footprintType: "residential", footprintDimensions: [95, 80] },
    RJ1: { id: "RJ1", name: "North Junction", lat: 37.7915, lng: -122.4110, elevation: 15, district: "North Arterial Interchange", footprintType: "corridor", footprintDimensions: [60, 60] },
    RJ2: { id: "RJ2", name: "South Junction", lat: 37.7500, lng: -122.4020, elevation: 12, district: "Southern Ring Junction", footprintType: "corridor", footprintDimensions: [60, 60] },
    UJ1: { id: "UJ1", name: "East Underpass", lat: 37.7748, lng: -122.4020, elevation: 4, district: "Subsurface Railway Arterial", footprintType: "corridor", footprintDimensions: [75, 40] },
    T1: { id: "T1", name: "Harbor Tower", lat: 37.7995, lng: -122.3845, elevation: 50, district: "North Bay Telecom Mast", footprintType: "infrastructure", footprintDimensions: [25, 25] },
    T2: { id: "T2", name: "Central Tower", lat: 37.7748, lng: -122.3840, elevation: 55, district: "Metropolitan Relay", footprintType: "infrastructure", footprintDimensions: [28, 28] },
    T3: { id: "T3", name: "South Tower", lat: 37.7500, lng: -122.3840, elevation: 48, district: "South Ridge Relay", footprintType: "infrastructure", footprintDimensions: [25, 25] },
  },
};

// Default active region
export const ACTIVE_REGION = HYDERABAD_REGION;
