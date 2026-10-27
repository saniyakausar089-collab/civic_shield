export interface StageInfo {
  index: number;
  badge: string;
  headline: string;
  body: string;
  subtext?: string;
  metricLabel?: string;
  metricValue?: string;
}

export const SCROLL_STAGES: StageInfo[] = [
  {
    index: 0,
    badge: "INITIALIZE // CIVICSHIELD",
    headline: "Break one thing. Watch the city follow.",
    body: "Every city is a living graph of hidden dependencies. When one critical artery fractures, systemic failure cascades in silence.",
    subtext: "Scroll to initiate full-spectrum infrastructure descent.",
  },
  {
    index: 1,
    badge: "ORBITAL TWIN // 01",
    headline: "See the whole city as connected systems.",
    body: "Power, potable water, telemetry, and transport grids do not exist in silos. CivicShield maps all interdependent vectors onto a synchronized 3D GIS twin.",
    subtext: "26 critical nodes • 9x7 topological matrix • Sub-second graph resolution",
    metricLabel: "Active District Graph",
    metricValue: "4 Interconnected Layers",
  },
  {
    index: 2,
    badge: "STREET DESCENT // 02",
    headline: "Neighborhoods, hospitals, roads and power, modeled as one network.",
    body: "Descending into the urban core. Every neighborhood residential block draws from specific substations, pump houses, and high-voltage feeder circuits.",
    subtext: "High-density zoning • 186,000 simulated residents at risk",
    metricLabel: "Grid Density",
    metricValue: "186k Pop / 8 Districts",
  },
  {
    index: 3,
    badge: "SUBTERRANEAN SLICE // 03",
    headline: "Every pipe and cable is a dependency.",
    body: "Peeling back the street level reveals subterranean lifelines. High-pressure water mains, 132kV power conduits, and emergency storm drains routed beneath traffic arteries.",
    subtext: "Metallic conduits • Dual-feed redundancies • Pressure telemetry",
    metricLabel: "Underground Infrastructure",
    metricValue: "42 Subsurface Conduits",
  },
  {
    index: 4,
    badge: "VULNERABILITY PROFILING // 04",
    headline: "Find the weak links before they fail.",
    body: "Graph centrality and stress propagation algorithms analyze the network 24 hours ahead, exposing invisible single points of failure.",
    subtext: "Dynamic criticality score computed via iterative graph simulation",
    metricLabel: "Top Criticality Bottleneck",
    metricValue: "PIPE1 Main Pipeline (#1)",
  },
  {
    index: 5,
    badge: "CRITICAL HEALTHCARE // 05",
    headline: "Protect what matters most.",
    body: "Eastside Medical and Riverside Hospital depend on continuous municipal water pressure for chilling and clean surgery, backed by on-site diesel generators.",
    subtext: "Standard autonomy buffer: 8 to 10 hours before critical ward shutdown",
    metricLabel: "Emergency Backup Autonomy",
    metricValue: "8.0 Hours Generator",
  },
  {
    index: 6,
    badge: "PUBLIC SERVICES // 06",
    headline: "Every service has a lifeline.",
    body: "Emergency shelters, civic schools, and cellular towers rely on continuous power. If a substation fails, cell towers drop within 4 hours, blinding emergency coordination.",
    subtext: "Harbor, Central, and South telecom masts with battery reserves",
    metricLabel: "Telecom Lifeline",
    metricValue: "4.0h Battery Reserve",
  },
  {
    index: 7,
    badge: "SYSTEMIC COLLAPSE // 07",
    headline: "Watch the failure spread hour by hour.",
    body: "The Main Pipeline ruptures at 04:00. High-pressure water floods the East Underpass. Pump stations cavitate. Neighborhoods run dry, and hospital backups start draining.",
    subtext: "Scrub scroll to advance time hour-by-hour through the 24h horizon",
    metricLabel: "Simulated Horizon",
    metricValue: "Hour 0 to Hour 24",
  },
  {
    index: 8,
    badge: "MITIGATION FORMULATION // 08",
    headline: "Test every response before it's real.",
    body: "Compare 4 mitigation strategies in real-time. Deploy valve isolation, dispatch mobile generators to medical centers, and reroute transit before the second wave hits.",
    subtext: "Wait • Valve & Reroute • Hospitals First • Full Triage",
    metricLabel: "Optimal Strategy",
    metricValue: "Full Triage (-78% Harm)",
  },
  {
    index: 9,
    badge: "EXECUTIVE COMMAND // 09",
    headline: "Full-Spectrum Urban Resilience Platform.",
    body: "Take command of the simulation. Run 200-iteration Monte Carlo risk envelopes, configure custom response playbooks, and export forensic incident debriefs.",
    subtext: "Ready to launch simulation workspace",
    metricLabel: "Resilience Rating",
    metricValue: "92 / 100 Calibrated",
  },
];
