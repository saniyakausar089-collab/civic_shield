// Curated Hyderabad educational institutions, colleges, universities, and prominent civic POIs.
export interface PlacePOI {
  id: string;
  name: string;
  shortName?: string;
  category: "college" | "university" | "school" | "hospital" | "landmark" | "research" | "civic";
  categoryLabel: string;
  established?: number;
  subtext: string;
  address: string;
  lon: number;
  lat: number;
  altitude?: number;
}

export const HYDERABAD_COLLEGES_AND_PLACES: PlacePOI[] = [
  // --- Colleges & Universities ---
  {
    id: "col_ou",
    name: "Osmania University",
    shortName: "OU Main Campus",
    category: "university",
    categoryLabel: "University Campus",
    established: 1918,
    subtext: "One of India's oldest and premier multidisciplinary universities",
    address: "Osmania University Road, Amberpet / Tarnaka, Hyderabad 500007",
    lon: 78.5284,
    lat: 17.4138,
    altitude: 1800,
  },
  {
    id: "col_uceou",
    name: "University College of Engineering (UCE, OU)",
    shortName: "UCE Osmania",
    category: "college",
    categoryLabel: "Engineering College",
    established: 1929,
    subtext: "Historic premier autonomous engineering college under Osmania University",
    address: "Osmania University Campus, Amberpet, Hyderabad 500007",
    lon: 78.5302,
    lat: 17.4182,
    altitude: 1800,
  },
  {
    id: "col_jntu",
    name: "JNTU College of Engineering Hyderabad",
    shortName: "JNTUH Campus",
    category: "university",
    categoryLabel: "Tech University & College",
    established: 1965,
    subtext: "State technological university and flagship engineering college",
    address: "Kukatpally Housing Board Colony, Hyderabad 500085",
    lon: 78.3914,
    lat: 17.4932,
    altitude: 1900,
  },
  {
    id: "col_iiit",
    name: "IIIT Hyderabad",
    shortName: "IIIT-H",
    category: "university",
    categoryLabel: "IT Research University & College",
    established: 1998,
    subtext: "Autonomous premier computer science and AI research institute",
    address: "Professor CR Rao Road, Gachibowli, Hyderabad 500032",
    lon: 78.3498,
    lat: 17.4452,
    altitude: 1800,
  },
  {
    id: "col_hcu",
    name: "University of Hyderabad (HCU)",
    shortName: "HCU Central Univ",
    category: "university",
    categoryLabel: "Central University",
    established: 1974,
    subtext: "Institute of Eminence, central research university & postgraduate college",
    address: "Prof. C.R. Rao Road, Gachibowli, Hyderabad 500046",
    lon: 78.3314,
    lat: 17.46,
    altitude: 2200,
  },
  {
    id: "col_stfrancis",
    name: "St. Francis College for Women",
    shortName: "St. Francis College",
    category: "college",
    categoryLabel: "Degree & PG College",
    established: 1959,
    subtext: "Prestigious autonomous minority arts, science, and commerce college",
    address: "Street No. 6, Uma Nagar, Begumpet, Hyderabad 500016",
    lon: 78.4612,
    lat: 17.4428,
    altitude: 1600,
  },
  {
    id: "col_nizam",
    name: "Nizam College",
    shortName: "Nizam College",
    category: "college",
    categoryLabel: "Heritage Autonomous College",
    established: 1887,
    subtext: "Historic constituent college of OU, founded by Mir Mahbub Ali Khan",
    address: "Gun Foundry, Basheerbagh, Hyderabad 500001",
    lon: 78.4778,
    lat: 17.3996,
    altitude: 1600,
  },
  {
    id: "col_cbit",
    name: "Chaitanya Bharathi Institute of Technology (CBIT)",
    shortName: "CBIT Gandipet",
    category: "college",
    categoryLabel: "Engineering College",
    established: 1979,
    subtext: "Top-ranked autonomous engineering institution in Gandipet",
    address: "Chaitanya Bharathi PO, Kokapet / Gandipet, Hyderabad 500075",
    lon: 78.3195,
    lat: 17.3915,
    altitude: 1900,
  },
  {
    id: "col_vasavi",
    name: "Vasavi College of Engineering",
    shortName: "Vasavi College",
    category: "college",
    categoryLabel: "Engineering College",
    established: 1981,
    subtext: "Autonomous technical college located adjacent to historic Golconda",
    address: "Ibrahimbagh, Hyderabad 500031",
    lon: 78.3826,
    lat: 17.3804,
    altitude: 1800,
  },
  {
    id: "col_mjcet",
    name: "Muffakham Jah College of Engineering & Technology",
    shortName: "MJCET Banjara Hills",
    category: "college",
    categoryLabel: "Engineering College",
    established: 1980,
    subtext: "Premier minority engineering college on Mount Pleasant campus",
    address: "Road No. 3, Mount Pleasant, Banjara Hills, Hyderabad 500034",
    lon: 78.4418,
    lat: 17.4244,
    altitude: 1700,
  },
  {
    id: "col_omc",
    name: "Osmania Medical College",
    shortName: "OMC Koti",
    category: "college",
    categoryLabel: "Medical College & Hospital",
    established: 1846,
    subtext: "Historic medical college and tertiary research center",
    address: "Turrebaz Khan Road, Troop Bazaar, Koti, Hyderabad 500095",
    lon: 78.4842,
    lat: 17.3814,
    altitude: 1700,
  },
  {
    id: "col_gmc",
    name: "Gandhi Medical College",
    shortName: "Gandhi Medical",
    category: "college",
    categoryLabel: "Medical College & Hospital",
    established: 1954,
    subtext: "Major government medical college and teaching hospital",
    address: "Musheerabad, Padmarao Nagar, Secunderabad 500003",
    lon: 78.5028,
    lat: 17.4262,
    altitude: 1800,
  },
  {
    id: "col_stanns",
    name: "St. Ann's College for Women",
    shortName: "St. Ann's Mehdipatnam",
    category: "college",
    categoryLabel: "Degree & PG College",
    established: 1983,
    subtext: "Top-ranking NAAC A+ accredited women's degree college",
    address: "Santoshnagar Colony, Mehdipatnam, Hyderabad 500028",
    lon: 78.4402,
    lat: 17.3942,
    altitude: 1600,
  },
  {
    id: "col_loyola",
    name: "Loyola Academy Degree & PG College",
    shortName: "Loyola Academy",
    category: "college",
    categoryLabel: "Autonomous Degree College",
    established: 1976,
    subtext: "Jesuit-run autonomous higher education campus in Secunderabad",
    address: "Old Alwal, Secunderabad 500010",
    lon: 78.5012,
    lat: 17.4988,
    altitude: 1900,
  },
  {
    id: "col_wesley",
    name: "Wesley Degree College",
    shortName: "Wesley College",
    category: "college",
    categoryLabel: "Arts & Science College",
    established: 1984,
    subtext: "Co-educational undergraduate and post-graduate college",
    address: "Opposite Anand Theatre, Sardar Patel Road, Secunderabad 500003",
    lon: 78.498,
    lat: 17.442,
    altitude: 1700,
  },
  {
    id: "col_badruka",
    name: "Badruka College of Commerce and Arts",
    shortName: "Badruka College",
    category: "college",
    categoryLabel: "Commerce & Management College",
    established: 1950,
    subtext: "Pioneering commerce education institute in Kachiguda",
    address: "Station Road, Kachiguda, Hyderabad 500027",
    lon: 78.4924,
    lat: 17.3908,
    altitude: 1600,
  },
  {
    id: "col_isb",
    name: "Indian School of Business (ISB)",
    shortName: "ISB Hyderabad",
    category: "university",
    categoryLabel: "Business School",
    established: 2001,
    subtext: "Globally accredited top-tier business management institution",
    address: "Gachibowli, Hyderabad 500111",
    lon: 78.3582,
    lat: 17.4264,
    altitude: 1900,
  },
  {
    id: "col_nift",
    name: "National Institute of Fashion Technology (NIFT)",
    shortName: "NIFT Hyderabad",
    category: "college",
    categoryLabel: "Fashion & Design Institute",
    established: 1995,
    subtext: "Statutory institute under Ministry of Textiles for design education",
    address: "Opposite Cyber Towers, Madhapur, Hitec City, Hyderabad 500081",
    lon: 78.3784,
    lat: 17.4468,
    altitude: 1700,
  },
  {
    id: "col_gnits",
    name: "G. Narayanamma Institute of Technology & Science",
    shortName: "GNITS Shaikpet",
    category: "college",
    categoryLabel: "Women's Engineering College",
    established: 1997,
    subtext: "Leading autonomous engineering college for women",
    address: "Shaikpet, Hyderabad 500104",
    lon: 78.3986,
    lat: 17.4112,
    altitude: 1700,
  },
  {
    id: "col_stanley",
    name: "Stanley College of Engineering and Technology for Women",
    shortName: "Stanley College",
    category: "college",
    categoryLabel: "Engineering College",
    established: 2008,
    subtext: "Prominent women's engineering and technology college near Abids",
    address: "Chapel Road, Fateh Maidan, Abids, Hyderabad 500001",
    lon: 78.4798,
    lat: 17.3912,
    altitude: 1600,
  },
  {
    id: "col_vnr",
    name: "VNR Vignana Jyothi Institute of Engineering & Technology",
    shortName: "VNR VJIET",
    category: "college",
    categoryLabel: "Engineering College",
    established: 1995,
    subtext: "Premier autonomous engineering and technology institution",
    address: "Vignana Jyothi Nagar, Pragathi Nagar, Bachupally, Hyderabad 500090",
    lon: 78.3842,
    lat: 17.5388,
    altitude: 2000,
  },
  {
    id: "col_asci",
    name: "Administrative Staff College of India (ASCI)",
    shortName: "ASCI Bella Vista",
    category: "college",
    categoryLabel: "Policy & Management Institute",
    established: 1956,
    subtext: "Historic palace-campus management training institute",
    address: "Bella Vista, Raj Bhavan Road, Khairatabad, Hyderabad 500082",
    lon: 78.4608,
    lat: 17.4142,
    altitude: 1700,
  },

  // --- Prominent Hospitals & Health Sciences ---
  {
    id: "hosp_apollo",
    name: "Apollo Health City",
    shortName: "Apollo Jubilee Hills",
    category: "hospital",
    categoryLabel: "Super-Specialty Hospital & Medical Campus",
    subtext: "Asia's first integrated health city with tertiary medical departments",
    address: "Road No. 72, Film Nagar, Jubilee Hills, Hyderabad 500033",
    lon: 78.4112,
    lat: 17.4168,
    altitude: 1800,
  },
  {
    id: "hosp_nims",
    name: "Nizam's Institute of Medical Sciences (NIMS)",
    shortName: "NIMS Punjagutta",
    category: "hospital",
    categoryLabel: "State University & Hospital",
    subtext: "Apex state medical institute and emergency referral hospital",
    address: "Punjagutta, Hyderabad 500082",
    lon: 78.4526,
    lat: 17.4214,
    altitude: 1700,
  },
  {
    id: "hosp_care",
    name: "CARE Hospitals Banjara Hills",
    shortName: "CARE Banjara",
    category: "hospital",
    categoryLabel: "Multi-Specialty Hospital",
    subtext: "Renowned cardiac and multi-organ critical care center",
    address: "Road No. 1, Banjara Hills, Hyderabad 500034",
    lon: 78.4484,
    lat: 17.4128,
    altitude: 1700,
  },

  // --- Heritage Landmarks & Major Civic Hubs ---
  {
    id: "lm_charminar",
    name: "Charminar",
    category: "landmark",
    categoryLabel: "Historical Monument",
    established: 1591,
    subtext: "Global landmark of Hyderabad and historical city center",
    address: "Charminar Road, Char Kaman, Ghansi Bazaar, Hyderabad 500002",
    lon: 78.4747,
    lat: 17.3616,
    altitude: 1600,
  },
  {
    id: "lm_golconda",
    name: "Golconda Fort",
    category: "landmark",
    categoryLabel: "Historical Fortress",
    subtext: "Qutb Shahi medieval citadel and acoustic engineering marvel",
    address: "Ibrahim Bagh, Hyderabad 500008",
    lon: 78.4011,
    lat: 17.3833,
    altitude: 1900,
  },
  {
    id: "lm_tankbund",
    name: "Hussain Sagar & Tank Bund",
    category: "landmark",
    categoryLabel: "Civic Lake & Promenade",
    subtext: "Heart of the twin cities featuring the monolithic Buddha statue",
    address: "Tank Bund Road, Hyderabad 500029",
    lon: 78.4744,
    lat: 17.4239,
    altitude: 2200,
  },
  {
    id: "lm_cybertowers",
    name: "Cyber Towers",
    category: "landmark",
    categoryLabel: "Technology & IT Landmark",
    established: 1998,
    subtext: "Iconic hub of HITEC City and Hyderabad's tech revolution",
    address: "HITEC City Main Road, Madhapur, Hyderabad 500081",
    lon: 78.3814,
    lat: 17.4504,
    altitude: 1800,
  },
  {
    id: "lm_salarjung",
    name: "Salar Jung Museum",
    category: "landmark",
    categoryLabel: "National Museum",
    subtext: "One of the three National Museums of India on Musi River bank",
    address: "Darusshifa, Hyderabad 500002",
    lon: 78.4804,
    lat: 17.3713,
    altitude: 1700,
  },
];

// Haversine distance in meters
function getDistanceMeters(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find closest curated place within threshold distance
export function findNearestCuratedPlace(
  lon: number,
  lat: number,
  maxDistanceMeters = 600
): { place: PlacePOI; distanceMeters: number } | null {
  let closest: PlacePOI | null = null;
  let minDist = Number.POSITIVE_INFINITY;

  for (const place of HYDERABAD_COLLEGES_AND_PLACES) {
    const d = getDistanceMeters(lon, lat, place.lon, place.lat);
    if (d < minDist && d <= maxDistanceMeters) {
      minDist = d;
      closest = place;
    }
  }

  if (closest) {
    return { place: closest, distanceMeters: Math.round(minDist) };
  }
  return null;
}

export interface InspectedPlaceResult {
  name: string;
  category: string;
  categoryLabel: string;
  subtext: string;
  address: string;
  lon: number;
  lat: number;
  isCurated: boolean;
  distanceFromClickMeters?: number;
  details?: Record<string, string>;
}

// Reverse geocode any coordinate using OpenStreetMap Nominatim with local fallback
export async function identifyPlaceAtLocation(
  lon: number,
  lat: number
): Promise<InspectedPlaceResult> {
  // 1. Check if near a curated college or landmark first (0ms instantaneous lookup)
  const nearest = findNearestCuratedPlace(lon, lat, 750);
  if (nearest && nearest.distanceMeters < 350) {
    return {
      name: nearest.place.name,
      category: nearest.place.category,
      categoryLabel: nearest.place.categoryLabel,
      subtext: nearest.place.subtext,
      address: nearest.place.address,
      lon: nearest.place.lon,
      lat: nearest.place.lat,
      isCurated: true,
      distanceFromClickMeters: nearest.distanceMeters,
      details: {
        "Campus / Facility": nearest.place.shortName || nearest.place.name,
        "Established": nearest.place.established ? String(nearest.place.established) : "Historical",
        "Sector": nearest.place.categoryLabel,
      },
    };
  }

  // 2. Query OpenStreetMap Nominatim reverse geocoder
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "CivicShield-Hyderabad-Twin/1.0" },
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data) {
        const addr = data.address || {};
        // Detect exact place name (college, school, building, amenity, etc.)
        const specificName =
          addr.college ||
          addr.university ||
          addr.school ||
          addr.hospital ||
          addr.clinic ||
          addr.place_of_worship ||
          addr.building ||
          data.name ||
          addr.commercial ||
          addr.leisure ||
          addr.amenity ||
          addr.tourism ||
          addr.road ||
          "Identified Urban Location";

        const type = data.type || data.category || "location";
        let categoryLabel = "Urban Sector / Facility";
        if (addr.college || type === "college") categoryLabel = "College / Educational Institution";
        else if (addr.university || type === "university") categoryLabel = "University Campus";
        else if (addr.school || type === "school") categoryLabel = "School / Academy";
        else if (addr.hospital || type === "hospital") categoryLabel = "Healthcare / Hospital";
        else if (type === "place_of_worship") categoryLabel = "Religious / Heritage Site";
        else if (type === "commercial" || type === "retail") categoryLabel = "Commercial Complex";
        else if (type === "residential") categoryLabel = "Residential Community";
        else if (type === "highway" || type === "road") categoryLabel = "Road / Arterial Corridor";

        const sectorParts = [addr.suburb, addr.neighbourhood, addr.city || "Hyderabad"].filter(Boolean);

        return {
          name: specificName,
          category: type,
          categoryLabel,
          subtext: `${categoryLabel} · ${sectorParts.join(", ")}`,
          address: data.display_name || `${lat.toFixed(5)}° N, ${lon.toFixed(5)}° E`,
          lon,
          lat,
          isCurated: false,
          details: {
            "Type": type.replace(/_/g, " "),
            "Area": sectorParts.join(", "),
            "Postcode": addr.postcode || "500001",
            "Mandal": addr.county || addr.state_district || "Hyderabad",
          },
        };
      }
    }
  } catch {
    // Network offline or failed: fallback to nearest curated or coordinate descriptor
  }

  // 3. Fallback: closest known place or coordinate sector
  if (nearest) {
    return {
      name: `Near ${nearest.place.name}`,
      category: nearest.place.category,
      categoryLabel: nearest.place.categoryLabel,
      subtext: `Approx. ${nearest.distanceMeters}m from ${nearest.place.shortName || nearest.place.name}`,
      address: `Hyderabad Urban Sector · ${lat.toFixed(5)}° N, ${lon.toFixed(5)}° E`,
      lon,
      lat,
      isCurated: true,
      distanceFromClickMeters: nearest.distanceMeters,
    };
  }

  return {
    name: "Urban Infrastructure Location",
    category: "location",
    categoryLabel: "Hyderabad Urban Grid",
    subtext: `Coordinates: ${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`,
    address: `Greater Hyderabad Metropolitan Region (${lat.toFixed(5)}, ${lon.toFixed(5)})`,
    lon,
    lat,
    isCurated: false,
  };
}

