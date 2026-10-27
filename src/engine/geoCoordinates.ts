// Geographic coordinates and GIS properties for CivicShield 26-node simulated infrastructure network
// Placed on realistic urban geographic coordinates (Riverfront Metro Basin, lat ~37.77, lng ~-122.42)
// providing accurate real-world GIS projection while preserving the exact 26-node simulation topology.

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

// Coordinate anchor center
export const GIS_ORIGIN = {
  lat: 37.7749,
  lng: -122.4194,
  cityName: "Bay Central District (Simulated Twin)",
  epsg: "EPSG:4326 (WGS 84) / Web Mercator",
};

// 1 grid step in simulation (x: 0..8, y: 0..6) maps realistically onto ~6.5km x 4.8km urban basin
export const GEO_NODES: Record<string, GeoLocation> = {
  PP1: {
    id: "PP1",
    name: "Central Grid Plant",
    lat: 37.7750,
    lng: -122.4550,
    elevation: 12,
    district: "West Industrial Port",
    footprintType: "industrial",
    footprintDimensions: [85, 65],
  },
  SUB1: {
    id: "SUB1",
    name: "North Substation",
    lat: 37.7910,
    lng: -122.4380,
    elevation: 25,
    district: "Northside Heights",
    footprintType: "substation",
    footprintDimensions: [50, 45],
  },
  SUB2: {
    id: "SUB2",
    name: "Central Substation",
    lat: 37.7745,
    lng: -122.4290,
    elevation: 18,
    district: "Central Civic Core",
    footprintType: "substation",
    footprintDimensions: [55, 50],
  },
  SUB3: {
    id: "SUB3",
    name: "South Substation",
    lat: 37.7580,
    lng: -122.4375,
    elevation: 22,
    district: "South Valley Gateway",
    footprintType: "substation",
    footprintDimensions: [50, 45],
  },
  WT1: {
    id: "WT1",
    name: "North Water Works",
    lat: 37.7990,
    lng: -122.4200,
    elevation: 8,
    district: "North Bay Reservoir",
    footprintType: "infrastructure",
    footprintDimensions: [70, 60],
  },
  WT2: {
    id: "WT2",
    name: "South Water Works",
    lat: 37.7500,
    lng: -122.4200,
    elevation: 10,
    district: "Estuary Water Plant",
    footprintType: "infrastructure",
    footprintDimensions: [75, 65],
  },
  PIPE1: {
    id: "PIPE1",
    name: "Main Pipeline",
    lat: 37.7748,
    lng: -122.4110,
    elevation: 14,
    district: "Metro Spine Corridor",
    footprintType: "infrastructure",
    footprintDimensions: [30, 90],
  },
  PUMPA: {
    id: "PUMPA",
    name: "Pump Station A",
    lat: 37.7915,
    lng: -122.4020,
    elevation: 16,
    district: "Northeast Pressurization",
    footprintType: "infrastructure",
    footprintDimensions: [40, 35],
  },
  PUMPB: {
    id: "PUMPB",
    name: "Pump Station B",
    lat: 37.7665,
    lng: -122.4025,
    elevation: 15,
    district: "East Central Pump Zone",
    footprintType: "infrastructure",
    footprintDimensions: [42, 38],
  },
  PUMPC: {
    id: "PUMPC",
    name: "Pump Station C",
    lat: 37.7585,
    lng: -122.4115,
    elevation: 14,
    district: "Southeast Distribution",
    footprintType: "infrastructure",
    footprintDimensions: [40, 35],
  },
  H1: {
    id: "H1",
    name: "Eastside Medical",
    lat: 37.7830,
    lng: -122.3930,
    elevation: 20,
    district: "Healthcare Complex East",
    footprintType: "hospital",
    footprintDimensions: [80, 75],
  },
  H2: {
    id: "H2",
    name: "Riverside Hospital",
    lat: 37.7580,
    lng: -122.3935,
    elevation: 16,
    district: "South Waterfront Health District",
    footprintType: "hospital",
    footprintDimensions: [75, 70],
  },
  N1: {
    id: "N1",
    name: "Harborview",
    lat: 37.7995,
    lng: -122.4555,
    elevation: 32,
    district: "Harbor District",
    footprintType: "residential",
    footprintDimensions: [95, 85],
  },
  N2: {
    id: "N2",
    name: "Old Town",
    lat: 37.7830,
    lng: -122.4465,
    elevation: 28,
    district: "Historic Sector",
    footprintType: "residential",
    footprintDimensions: [110, 90],
  },
  N3: {
    id: "N3",
    name: "Riverside",
    lat: 37.7665,
    lng: -122.4460,
    elevation: 18,
    district: "Canal Quarter",
    footprintType: "residential",
    footprintDimensions: [115, 95],
  },
  N4: {
    id: "N4",
    name: "Millbrook",
    lat: 37.7748,
    lng: -122.4375,
    elevation: 20,
    district: "Central Midtown",
    footprintType: "residential",
    footprintDimensions: [90, 80],
  },
  N5: {
    id: "N5",
    name: "Hillcrest",
    lat: 37.7915,
    lng: -122.4290,
    elevation: 45,
    district: "Uptown Ridge",
    footprintType: "residential",
    footprintDimensions: [100, 85],
  },
  N6: {
    id: "N6",
    name: "Southgate",
    lat: 37.7580,
    lng: -122.4290,
    elevation: 15,
    district: "Southgate Urban Commons",
    footprintType: "residential",
    footprintDimensions: [110, 90],
  },
  N7: {
    id: "N7",
    name: "Eastgate",
    lat: 37.7915,
    lng: -122.3840,
    elevation: 12,
    district: "Eastgate Residential Basin",
    footprintType: "residential",
    footprintDimensions: [105, 90],
  },
  N8: {
    id: "N8",
    name: "Docklands",
    lat: 37.7580,
    lng: -122.3840,
    elevation: 8,
    district: "Maritime Basin",
    footprintType: "residential",
    footprintDimensions: [95, 80],
  },
  RJ1: {
    id: "RJ1",
    name: "North Junction",
    lat: 37.7915,
    lng: -122.4110,
    elevation: 15,
    district: "North Arterial Interchange",
    footprintType: "corridor",
    footprintDimensions: [60, 60],
  },
  RJ2: {
    id: "RJ2",
    name: "South Junction",
    lat: 37.7500,
    lng: -122.4020,
    elevation: 12,
    district: "Southern Ring Junction",
    footprintType: "corridor",
    footprintDimensions: [60, 60],
  },
  UJ1: {
    id: "UJ1",
    name: "East Underpass",
    lat: 37.7748,
    lng: -122.4020,
    elevation: 4, // Depressed elevation (flood bowl)
    district: "Subsurface Railway Arterial",
    footprintType: "corridor",
    footprintDimensions: [75, 40],
  },
  T1: {
    id: "T1",
    name: "Harbor Tower",
    lat: 37.7995,
    lng: -122.3845,
    elevation: 50,
    district: "North Bay Telecom Mast",
    footprintType: "infrastructure",
    footprintDimensions: [25, 25],
  },
  T2: {
    id: "T2",
    name: "Central Tower",
    lat: 37.7748,
    lng: -122.3840,
    elevation: 55,
    district: "Metropolitan Relay",
    footprintType: "infrastructure",
    footprintDimensions: [28, 28],
  },
  T3: {
    id: "T3",
    name: "South Tower",
    lat: 37.7500,
    lng: -122.3840,
    elevation: 48,
    district: "South Ridge Relay",
    footprintType: "infrastructure",
    footprintDimensions: [25, 25],
  },
};

// Geographic boundary polygon for the urban basin
export const BASIN_BOUNDS = {
  minLat: 37.745,
  maxLat: 37.805,
  minLng: -122.465,
  maxLng: -122.375,
};

// Realistic GIS arterial roads connecting the infrastructure districts
export interface RoadFeature {
  id: string;
  name: string;
  type: "arterial" | "highway" | "connector";
  coords: [number, number][]; // [lng, lat] GeoJSON standard
}

export const GIS_ROADS: RoadFeature[] = [
  // West-East Central Highway
  {
    id: "Hwy-101",
    name: "Central Metro Expressway",
    type: "highway",
    coords: [
      [-122.458, 37.775],
      [-122.438, 37.775],
      [-122.411, 37.775],
      [-122.402, 37.775], // Through East Underpass
      [-122.384, 37.775],
    ],
  },
  // North-South Arterial
  {
    id: "Art-NorthSouth",
    name: "Grand Avenue Corridor",
    type: "arterial",
    coords: [
      [-122.411, 37.800],
      [-122.411, 37.7915], // North Junction
      [-122.411, 37.775],
      [-122.411, 37.758],
      [-122.402, 37.750], // South Junction
    ],
  },
  // North Loop Highway
  {
    id: "Loop-North",
    name: "Harbor Ring",
    type: "highway",
    coords: [
      [-122.456, 37.7995],
      [-122.438, 37.791],
      [-122.411, 37.7915],
      [-122.385, 37.7995],
    ],
  },
  // South Loop Highway
  {
    id: "Loop-South",
    name: "Southern Perimeter Ring",
    type: "highway",
    coords: [
      [-122.446, 37.7665],
      [-122.4375, 37.758],
      [-122.4115, 37.758],
      [-122.402, 37.750],
      [-122.384, 37.750],
    ],
  },
  // Medical Access Corridor
  {
    id: "Med-Corridor",
    name: "Hospital Emergency Link",
    type: "connector",
    coords: [
      [-122.402, 37.775],
      [-122.393, 37.783], // Eastside Medical
      [-122.3935, 37.758], // Riverside Hospital
      [-122.402, 37.750],
    ],
  },
];
