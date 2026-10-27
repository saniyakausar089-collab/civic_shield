# CivicShield — City Failure Simulator

> **"Break one thing. Watch the city follow."**

CivicShield is an interactive 3D urban infrastructure resilience simulator modeling systemic, cascading failures across interdependent city networks: power grids, water works, hospitals, transportation corridors, and telecommunications.

---

## Overview

Modern cities are deeply interconnected networks of networks. A single pipeline rupture or substation outage does not remain isolated:
1. When the **Main Pipeline** fails, the **East Underpass** floods within minutes.
2. The blocked underpass isolates neighborhoods from emergency routes and severes pump supplies.
3. As pump stations exhaust their buffer hours, **Eastside Medical** and **Riverside Hospital** switch to emergency diesel backup.
4. When autonomous reserves deplete, dependent medical facilities and residential neighborhoods cascade into failure.

CivicShield allows civil engineers, disaster planners, and urban researchers to trigger failures, test response plans, run 200-iteration Monte Carlo analyses, and optimize emergency budgets.

---

## Key Features

### 1. Real-Time 3D City Visualization
- **Extruded 26-Node Topology**: 3D extruded buildings whose heights represent served population.
- **System Layer Color Coding**:
  - Power Grid: Amber
  - Water Treatment & Mains: Cyan
  - Telecommunication Towers: Violet
  - Residential Neighborhoods: Mint
  - Hospital Medical Centers: Pink (with 3D cross markers)
  - Transport Links & Underpasses: Slate
- **Dynamic Cascade Visuals**:
  - Failed nodes pulse red.
  - Stressed nodes display amber warning cages.
  - Dependency arcs glow with dynamic flowing red particles along collapsed supply lines.
  - Pulsing rings spotlight failure trigger nodes.
- **Mobile-First Touch & Orbit Controls**:
  - Single-finger orbit and tilt with natural inertia damping.
  - Pinch zoom and two-finger pan.
  - Tap any node to inspect causal chain, dependency status, and backup hours.
  - Dedicated one-touch camera reset.

### 2. Time-Scrubber & Multi-Speed Simulation
- 24-hour simulation horizon with 1-hour discrete ticks.
- Play/pause scrubber with 1x and 4x playback speeds.
- Interactive sparkline chart showing the trajectory of affected citizens across time.
- Real-time stat cards tracking:
  - Affected residents without service
  - Hospitals down
  - Total systems collapsed

### 3. Response Strategy Comparison
- Side-by-side evaluation of 4 disaster response plans:
  1. **Wait it out**: No intervention; natural repair pace.
  2. **Valve & reroute**: Cuts the flood link, extends water buffers, accelerates repairs by 40%.
  3. **Hospitals first**: Prioritizes emergency generators and water tankers for medical centers.
  4. **Full triage**: Comprehensive multi-agency deployment.
- Automated **"Best Value"** determination balancing person-hours saved against crew expenditure.
- Custom Plan Builder with granular sliders for crew units, repair speed, hospital buffer extension, water tanks, and traffic rerouting.

### 4. Weak Links & Stochastic Monte Carlo Analysis
- **Criticality Heuristic Ranking**: Evaluates systemic harm across all 26 nodes to identify the city's single points of failure.
- **Monte Carlo Engine**: Runs 200 stochastic simulations per trigger set with randomized failure thresholds, repair delays, and buffer depletion rates.
- **Probability Band Visualization**: Renders Min-Max envelope, 25th-75th interquartile bands, and median outcome trajectories.
- **Cascade Probability Score**: Calculates the likelihood of systemic breakdown (&ge;3 cascading system failures).

### 5. Emergency Command & What-If Infrastructure Hardening
- **Emergency Actions**: Deploy water tankers, mobilize mobile generators, close flooded roads, and activate community emergency shelters.
- **City Resilience Gauge (0–100)**: Evaluates composite city survivability across five multi-hazard disaster presets.
- **What-If Builder**: Experiment with capital improvements before disaster strikes:
  - Backup generators at Eastside Medical (`H1`) and Riverside Hospital (`H2`).
  - Redundant electrical feeder loop for Central Substation (`SUB2`).
  - Secondary water main from South Water Works (`WT2`).
  - Flood barrier gates and pump valves for the East Underpass (`UJ1`).
- **Automated Budget Optimizer**: Evaluates all 256 capital upgrade combinations against budget constraints to recommend the highest harm-reduction investments.

### 6. Incident Reporting, Voice Briefing & PWA
- **Live Event Log**: Timestamped critical, warning, and informational incident events.
- **"Explain Why" Causal Chains**: Plain-language natural diagnostics detailing why a node failed, which dependency failed first, and when backups ran dry.
- **Voice Briefing**: Synthesizes executive situational summaries aloud via the Web SpeechSynthesis API.
- **Export**: One-click printable briefing report and formatted markdown clipboard export.
- **PWA & Offline Support**: Progressive Web App with service worker caching for offline access.
- **Accessibility**: Honors OS `prefers-reduced-motion` settings.

---

## Tech Stack

- **Framework**: React 19, TypeScript (strict mode, zero type errors)
- **3D Graphics & Cinema**: Three.js, React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`), `@react-three/postprocessing`
- **Smooth Scrolling Engine**: Lenis (`lenis`) with 10-stage CatmullRom spline trajectory
- **State Management**: Zustand
- **Routing & Server**: TanStack Start, TanStack Router (Cinematic Landing at `/`, Interactive Simulator at `/simulator`)
- **Styling**: Tailwind CSS v4, Lucide React icons
- **Testing**: Vitest

---

## Cinematic 3D Landing Experience (`/`)

The home page features a continuous WebGL scroll-driven documentary flight through the city across 10 distinct narrative stages:

- **Stage 00 // System Initialize**: Loading screen and master title *"CivicShield. Break one thing. Watch the city follow."* set against an authentic dusk sky.
- **Stage 01 // Orbital Twin**: High orbital vantage at blue hour showing illuminated windows, river canal, and the thin glowing dependency graph overlay across districts.
- **Stage 02 // Street Descent**: Camera punches through low-hanging atmospheric valley clouds and dives toward street level with handheld camera micro-drift.
- **Stage 03 // Subterranean Slice**: Geological cutaway trench revealing earth strata (asphalt, gravel, clay, bedrock), steel shoring, high-pressure water mains with animated cyan pulses, 132kV power cables, and telecom conduits.
- **Stage 04 // Vulnerability Profiling**: Substation transformers with vibration hum and municipal booster pumps with rotating drive shafts, displaying live #1 weak link data from `weakestLinks(BASE_CITY)`.
- **Stage 05 // Critical Healthcare**: Architectural cutaway of Eastside Medical showing the basement generator room, water cistern, ICU monitor glow, ambulance bay, and rooftop helipad, reflecting the engine's 8.0h autonomy buffer.
- **Stage 06 // Public Services**: Civic school, emergency evacuation shelter, and a 48m telecom lattice transmission mast with blinking aviation beacons and lifeline labels.
- **Stage 07 // Systemic Collapse**: Main pipeline rupture with cracked asphalt, high-pressure particle geyser spray, flooded underpass with submerged vehicles, and scroll-scrubbed hour-by-hour cascade blackout spreading across city buildings.
- **Stage 08 // Mitigation Formulation**: Skyward pullback as city re-lights under the optimal triage plan, featuring a 4-plan harm comparison.
- **Stage 09 // Executive Command**: Night metropolis panorama with the *"Launch Simulator"* CTA (`/simulator`), 5 core capability cards (Monte Carlo, Weak Links, Command Panel, Resilience Score, Voice Brief), and crisis presets.

### Cinematic Visual Quality & Performance Tuning
- **PBR Architectural Materials**: Procedural concrete, asphalt, soil cutaway, brushed metal, and emissive window grids generated dynamically in-memory.
- **Post-Processing**: ACES filmic tone mapping, selective emissive bloom, film grain, light vignette, and subtle chromatic aberration.
- **Adaptive Performance**: Built-in `PerformanceMonitor` adjusting DPR (1.0 to 1.5) and toggling post-processing on constrained devices.
- **Accessibility & Motion**: Full `prefers-reduced-motion` compliance, mobile-responsive layouts, and static WebGL fallback.

> **Architectural Note on Engine Integrity**:
> The core simulation engine in `src/engine/` (`types.ts`, `city.ts`, `sim.ts`, `plans.ts`, `analysis.ts`, `explain.ts`) is written in **pure, framework-agnostic TypeScript with zero React imports**. This design guarantees that the engine can be decoupled or compiled to WebAssembly without touching the UI layer.

---

## Getting Started

### Prerequisites
- Node.js &ge; 18
- npm

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/your-username/civic-shield.git
cd civic-shield

# Install dependencies
npm install

# Run TypeScript type check
npx tsc --noEmit -p tsconfig.app.json

# Run unit tests
npm test

# Launch development server
npm run dev
```

Visit `http://localhost:8080` (or the port indicated in terminal) in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## Simulation Limits & Honest Disclosures

CivicShield is an analytical prototype intended for educational, strategic planning, and concept exploration:
- **Synthetic Network**: The 26-node graph is a stylized model of urban dependencies, not an empirical digital twin of a specific municipality.
- **Rule-Based Cascades**: The propagation model uses weighted threshold-and-buffer logic rather than continuous Navier-Stokes hydraulic equations or nonlinear AC power-flow simulations.
- **Criticality Heuristic**: The Weak Links ranking is a deterministic harm score based on synthetic outage metrics rather than an actuarial risk assessment.

---

## Roadmap

- [ ] **C++ / WebAssembly Engine**: Compile the simulation core to C++ / WASM with SIMD acceleration to scale to 10,000+ nodes at 60 FPS.
- [ ] **Real OpenStreetMap & Utility Data**: Ingest OpenStreetMap road networks, Overpass API substations, and USGS water infrastructure for real-world cities.
- [ ] **ML Criticality Model**: Train graph neural networks (GNNs) on cascade datasets to predict high-order failure modes under multi-hazard disruptions.
- [ ] **Multi-Agent Evacuation**: Integrate agent-based population evacuation modeling during flood and blackout cascades.
