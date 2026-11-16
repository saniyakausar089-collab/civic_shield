import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  MapPin,
  Building,
  Zap,
  Droplets,
  Activity,
  Radio,
  Car,
  X,
  Navigation,
  Globe,
  Sparkles,
  Command,
} from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { HYDERABAD_COLLEGES_AND_PLACES } from "@/data/hyderabadPlaces";
import { toast } from "sonner";

export interface SearchResultItem {
  id: string;
  name: string;
  category: "neighborhood" | "asset" | "landmark" | "geocoded";
  subtitle: string;
  lon: number;
  lat: number;
  altitude?: number;
  nodeId?: string;
  hoodId?: string;
  type?: string;
}

// Prominent Hyderabad Urban Landmarks & Commercial Hubs
const HYDERABAD_LANDMARKS: SearchResultItem[] = [
  {
    id: "lm_charminar",
    name: "Charminar",
    category: "landmark",
    subtitle: "Historic 1591 Monument & Old City Core",
    lon: 78.4747,
    lat: 17.3616,
    altitude: 1800,
  },
  {
    id: "lm_hussainsagar",
    name: "Hussain Sagar & Tank Bund",
    category: "landmark",
    subtitle: "Heart of Twin Cities, Buddha Statue & Lake",
    lon: 78.4744,
    lat: 17.4239,
    altitude: 2500,
  },
  {
    id: "lm_cybertowers",
    name: "Cyber Towers & Hitec City",
    category: "landmark",
    subtitle: "Madhapur IT Hub & Cyber Corridor",
    lon: 78.3814,
    lat: 17.4504,
    altitude: 2000,
  },
  {
    id: "lm_golconda",
    name: "Golconda Fort",
    category: "landmark",
    subtitle: "Historic Medieval Citadel & Acoustics",
    lon: 78.4011,
    lat: 17.3833,
    altitude: 2200,
  },
  {
    id: "lm_birlamandir",
    name: "Birla Mandir",
    category: "landmark",
    subtitle: "Naubat Pahad Hilltop Temple Overlook",
    lon: 78.4716,
    lat: 17.4062,
    altitude: 1900,
  },
  {
    id: "lm_salarjung",
    name: "Salar Jung Museum",
    category: "landmark",
    subtitle: "Musi River Heritage & National Museum",
    lon: 78.4804,
    lat: 17.3713,
    altitude: 1800,
  },
  {
    id: "lm_gachibowli",
    name: "Gachibowli Financial District",
    category: "landmark",
    subtitle: "Nanakramguda Banking & Tech Towers",
    lon: 78.3412,
    lat: 17.418,
    altitude: 2400,
  },
  {
    id: "lm_begumpet",
    name: "Begumpet Airport & Weather Station",
    category: "landmark",
    subtitle: "Meteorological Radar & Air Base",
    lon: 78.4682,
    lat: 17.4526,
    altitude: 2200,
  },
  {
    id: "lm_secunderabad",
    name: "Secunderabad Railway Junction",
    category: "landmark",
    subtitle: "South Central Railway Transit Gateway",
    lon: 78.5034,
    lat: 17.4344,
    altitude: 2000,
  },
  {
    id: "lm_kbrpark",
    name: "KBR National Park",
    category: "landmark",
    subtitle: "Jubilee Hills Urban Forest Sanctuary",
    lon: 78.4234,
    lat: 17.4244,
    altitude: 2200,
  },
  {
    id: "lm_ameerpet",
    name: "Ameerpet Metro Interchange",
    category: "landmark",
    subtitle: "Red & Blue Metro Line Crossroad",
    lon: 78.4483,
    lat: 17.4375,
    altitude: 1900,
  },
  {
    id: "lm_mehdipatnam",
    name: "Mehdipatnam Commercial Hub",
    category: "landmark",
    subtitle: "Inner Ring Road Transit Junction",
    lon: 78.4388,
    lat: 17.3916,
    altitude: 2000,
  },
];

export const MapAreaSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [geocodedResults, setGeocodedResults] = useState<SearchResultItem[]>([]);
  const [isSearchingGeocode, setIsSearchingGeocode] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const civicShieldLayer = useAppStore((s) => s.civicShieldLayer);
  const networkData = useAppStore((s) => s.networkData);
  const neighborhoodsData = useAppStore((s) => s.neighborhoodsData);
  const viewportMode = useAppStore((s) => s.viewportMode);
  const setStore = useAppStore((s) => s.set);
  const setSelectedGisNode = useAppStore((s) => s.setSelectedGisNode);
  const select = useAppStore((s) => s.select);

  // Keyboard shortcut: Press Ctrl+K or / to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && document.activeElement?.tagName !== "INPUT")) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Build searchable index from neighborhoods and network nodes
  const localItems = useMemo<SearchResultItem[]>(() => {
    const list: SearchResultItem[] = [];

    // 1. Add Neighborhoods
    if (neighborhoodsData?.features) {
      for (const feat of neighborhoodsData.features) {
        const p = feat.properties;
        const coords = feat.geometry?.coordinates?.[0] || [];
        if (coords.length > 0) {
          let sumLon = 0, sumLat = 0;
          for (const pt of coords) {
            sumLon += pt[0];
            sumLat += pt[1];
          }
          const lon = sumLon / coords.length;
          const lat = sumLat / coords.length;
          list.push({
            id: `hood_${p.id}`,
            name: `${p.name} (${p.id})`,
            category: "neighborhood",
            subtitle: `Population: ${Number(p.population).toLocaleString("en-IN")} residents`,
            lon,
            lat,
            altitude: 4500,
            hoodId: p.id,
          });
        }
      }
    }

    // 2. Add Infrastructure Nodes
    if (networkData?.nodes) {
      for (const node of networkData.nodes) {
        const typeLabel =
          node.type === "hospital"
            ? "Healthcare Facility"
            : node.type === "power"
            ? "Power Grid Asset"
            : node.type === "water"
            ? "Water Distribution Asset"
            : node.type === "telecom"
            ? "Telecom Infrastructure"
            : "Transport Corridor";

        list.push({
          id: `node_${node.id}`,
          name: `${node.name} [${node.id}]`,
          category: "asset",
          subtitle: `${typeLabel} · Lat ${node.lat.toFixed(3)}, Lon ${node.lon.toFixed(3)}`,
          lon: node.lon,
          lat: node.lat,
          altitude: 1800,
          nodeId: node.id,
          type: node.type,
        });
      }
    }

    // 3. Add Hyderabad Landmarks
    list.push(...HYDERABAD_LANDMARKS);

    // 4. Add Hyderabad Colleges & POIs
    for (const p of HYDERABAD_COLLEGES_AND_PLACES) {
      list.push({
        id: `poi_${p.id}`,
        name: p.name,
        category: "landmark",
        subtitle: `${p.categoryLabel} · ${p.subtext}`,
        lon: p.lon,
        lat: p.lat,
        altitude: p.altitude || 1800,
      });
    }

    return list;
  }, [neighborhoodsData, networkData]);

  // Filter local items
  const filteredLocal = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default suggested areas
      return localItems.slice(0, 8);
    }
    return localItems.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        (item.nodeId && item.nodeId.toLowerCase().includes(q)) ||
        (item.hoodId && item.hoodId.toLowerCase().includes(q))
      );
    });
  }, [localItems, query]);

  // Online Geocoding fallback with debounce (Photon API centered on Hyderabad)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3 || filteredLocal.length >= 4) {
      setGeocodedResults([]);
      setIsSearchingGeocode(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingGeocode(true);
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          q
        )}&lat=17.3850&lon=78.4867&limit=4`;
        const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
        if (res.ok) {
          const data = await res.json();
          if (data?.features) {
            const parsed: SearchResultItem[] = data.features.map((f: any, idx: number) => ({
              id: `geo_${idx}_${f.properties.osm_id || idx}`,
              name: f.properties.name || f.properties.street || "Location",
              category: "geocoded",
              subtitle: [f.properties.city, f.properties.state, f.properties.country]
                .filter(Boolean)
                .join(", ") || "Hyderabad Region",
              lon: f.geometry.coordinates[0],
              lat: f.geometry.coordinates[1],
              altitude: 2500,
            }));
            setGeocodedResults(parsed);
          }
        }
      } catch {
        // Geocode offline fallback: silent ignore
      } finally {
        setIsSearchingGeocode(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, filteredLocal.length]);

  // Combined Results
  const allResults = useMemo(() => {
    return [...filteredLocal, ...geocodedResults];
  }, [filteredLocal, geocodedResults]);

  // Action: Fly To Target
  const handleSelect = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery("");

    // Ensure we are in Cesium 3D mode for proper 3D flight
    if (viewportMode !== "cesium") {
      setStore({ viewportMode: "cesium" });
    }

    const layer = civicShieldLayer || (window as any).civicShieldLayer || (window as any).__CIVIC_LAYER__;

    if (layer) {
      if (item.nodeId && typeof layer.flyToNode === "function") {
        layer.flyToNode(item.nodeId);
        // Select node in HUD
        const targetNode = networkData?.nodes?.find((n) => n.id === item.nodeId);
        if (targetNode) {
          setSelectedGisNode(targetNode);
          select(item.nodeId);
        }
      } else if (item.hoodId && typeof layer.flyToNeighborhood === "function") {
        layer.flyToNeighborhood(item.hoodId);
      } else if (typeof layer.flyToCoordinates === "function") {
        layer.flyToCoordinates(item.lon, item.lat, item.altitude || 2200);
      }
    }

    if (item.id.startsWith("poi_")) {
      const poiId = item.id.replace("poi_", "");
      const match = HYDERABAD_COLLEGES_AND_PLACES.find((p) => p.id === poiId);
      if (match) {
        useAppStore.getState().setInspectedPlace({
          name: match.name,
          category: match.category,
          categoryLabel: match.categoryLabel,
          subtext: match.subtext,
          address: match.address,
          lon: match.lon,
          lat: match.lat,
          isCurated: true,
          details: {
            "Institution / Facility": match.shortName || match.name,
            "Established": match.established ? String(match.established) : "Historical",
            "Category": match.categoryLabel,
          },
        });
      }
    }

    toast.success(`Teleporting camera to ${item.name}`, {
      description: `Coordinates: ${item.lat.toFixed(4)}° N, ${item.lon.toFixed(4)}° E`,
      duration: 3000,
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__FAST_SEARCH__ = {
        flyTo: (nameOrId: string) => {
          const match = localItems.find(
            (item) =>
              item.id === nameOrId ||
              item.nodeId === nameOrId ||
              item.hoodId === nameOrId ||
              item.name.toLowerCase().includes(nameOrId.toLowerCase())
          );
          if (match) handleSelect(match);
          return match;
        },
        getItems: () => localItems,
      };
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).__FAST_SEARCH__;
      }
    };
  }, [localItems]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || allResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = allResults[selectedIndex];
      if (target) handleSelect(target);
    }
  };

  const getCategoryIcon = (category: string, type?: string) => {
    if (category === "neighborhood") return <Building className="w-3.5 h-3.5 text-[#38bdf8]" />;
    if (category === "landmark") return <MapPin className="w-3.5 h-3.5 text-[#e09f3e]" />;
    if (category === "geocoded") return <Globe className="w-3.5 h-3.5 text-[#9BAA76]" />;
    if (type === "power") return <Zap className="w-3.5 h-3.5 text-[#eab308]" />;
    if (type === "water") return <Droplets className="w-3.5 h-3.5 text-[#06b6d4]" />;
    if (type === "hospital") return <Activity className="w-3.5 h-3.5 text-[#ef4444]" />;
    if (type === "telecom") return <Radio className="w-3.5 h-3.5 text-[#a855f7]" />;
    return <Car className="w-3.5 h-3.5 text-[#94a3b8]" />;
  };

  return (
    <div className="relative z-30" ref={dropdownRef}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute left-2.5 pointer-events-none text-[#8a96a1]">
          <Search className="w-3.5 h-3.5 text-[#8a96a1]" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Fast search area or node... (/) "
          className="w-52 sm:w-64 md:w-72 bg-[#191F24]/95 backdrop-blur-md border border-[#303941] hover:border-[#4a5763] focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] rounded-md pl-8 pr-16 py-1.5 text-xs text-[#e5e9ec] placeholder-[#8a96a1] transition-all shadow-md outline-none"
        />

        {/* Clear Button / Hotkey Badge */}
        <div className="absolute right-2 flex items-center gap-1 text-[#8a96a1]">
          {query ? (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-0.5 rounded hover:text-[#f1f4f6]"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-0.5 px-1 py-0.5 rounded bg-[#242c33] border border-[#303941] text-[9px] font-mono text-[#8a96a1]">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
          )}
        </div>
      </div>

      {/* Autocomplete Results Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-80 sm:w-96 bg-[#191F24] border border-[#303941] rounded-lg shadow-2xl p-2 text-xs text-[#e5e9ec] z-50 animate-in fade-in zoom-in-95 duration-100 max-h-[380px] overflow-y-auto">
          {/* Quick Teleport Header Chips */}
          <div className="pb-2 mb-1.5 border-b border-[#303941]">
            <div className="text-[10px] uppercase font-mono text-[#8a96a1] mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#38bdf8]" />
              <span>Quick Teleport</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                { name: "Charminar", id: "lm_charminar" },
                { name: "Hitec City", id: "lm_cybertowers" },
                { name: "Central Substation", nodeId: "SUB2" },
                { name: "City Hospital", nodeId: "H1" },
                { name: "Banjara Hills", hoodId: "N4" },
                { name: "Hussain Sagar", id: "lm_hussainsagar" },
              ].map((pill) => (
                <button
                  key={pill.name}
                  onClick={() => {
                    const match = localItems.find(
                      (item) =>
                        (pill.id && item.id === pill.id) ||
                        (pill.nodeId && item.nodeId === pill.nodeId) ||
                        (pill.hoodId && item.hoodId === pill.hoodId) ||
                        item.name.toLowerCase().includes(pill.name.toLowerCase())
                    );
                    if (match) handleSelect(match);
                  }}
                  className="px-2 py-0.5 rounded bg-[#14191d] hover:bg-[#242c33] text-[#38bdf8] hover:text-[#7dd3fc] border border-[#303941] text-[10px] font-mono transition-colors"
                >
                  {pill.name}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-0.5">
            {allResults.length === 0 ? (
              <div className="py-4 text-center text-[#8a96a1] text-xs">
                {isSearchingGeocode ? (
                  <span>Searching Hyderabad region...</span>
                ) : (
                  <span>No location matches found for "{query}"</span>
                )}
              </div>
            ) : (
              allResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-start gap-2.5 p-2 rounded cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#242c33] text-[#f1f4f6] border border-[#38bdf8]/40"
                        : "hover:bg-[#1e252b] text-[#d2d8de] border border-transparent"
                    }`}
                  >
                    <div className="p-1 rounded bg-[#14191d] border border-[#303941] mt-0.5 shrink-0">
                      {getCategoryIcon(item.category, item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs truncate text-[#f1f4f6]">
                          {item.name}
                        </span>
                        <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-[#14191d] text-[#8a96a1] shrink-0 ml-1">
                          {item.category === "neighborhood"
                            ? "Zone"
                            : item.category === "asset"
                            ? item.type?.toUpperCase() || "Asset"
                            : item.category === "landmark"
                            ? "Landmark"
                            : "OSM"}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#8a96a1] truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                    <div className="shrink-0 text-[#8a96a1] hover:text-[#38bdf8] self-center">
                      <Navigation className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Navigation Tip */}
          <div className="pt-2 mt-2 border-t border-[#303941] flex items-center justify-between text-[10px] text-[#8a96a1]">
            <span>Press ↑↓ to navigate, Enter to fly</span>
            <span className="font-mono text-[9px]">Hyderabad Testbed</span>
          </div>
        </div>
      )}
    </div>
  );
};
