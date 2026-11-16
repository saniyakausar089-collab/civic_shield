// Causal chains in plain language for the "Explain why" feature.
import type { City } from "./types";
import type { SimResult } from "./sim";
import { nodeById } from "./city";

export function explainFailure(
  result: SimResult | null | undefined,
  city: City,
  nodeId: string,
  depth = 0
): string {
  if (!result || !result.causes) {
    return "No active simulation results. Select or run a scenario to view causal chain analysis.";
  }
  const node = nodeById(city, nodeId);
  if (!node) return "";
  const cause = result.causes[nodeId];

  if (!cause) {
    const fh = result.failHours ? result.failHours[nodeId] : undefined;
    if (fh !== undefined) {
      return `${node.name} went down at hour ${fh} as part of the initial event and was repaired after ${node.repairHours}h.`;
    }
    return `${node.name} never failed in this scenario.`;
  }

  const bufferWord =
    node.kind === "pump" ? `${cause.backupHours}-hour tank ran dry` : `${cause.backupHours}-hour backup was exhausted`;
  const base = `${node.name} failed at hour ${result.failHours?.[nodeId] ?? "?"} because ${cause.depName} failed at hour ${cause.depFailHour} and ${node.name}'s ${bufferWord}.`;
  if (depth < 2 && result.causes[cause.depId]) {
    return `${base} ${explainFailure(result, city, cause.depId, depth + 1)}`;
  }
  if (depth < 2 && result.failHours?.[cause.depId] === 0 && !result.causes[cause.depId]) {
    return `${base} ${cause.depName} was part of the initial event (hour 0).`;
  }
  return base;
}

export function situationSummary(
  result: SimResult | null | undefined,
  city: City,
  hour: number,
  planName: string,
): string {
  if (!result || !Array.isArray(result.hours)) return "";
  const snap = result.hours[Math.min(Math.max(0, hour), result.hours.length - 1)];
  if (!snap) return "";
  const failedNames = Object.entries(snap.status)
    .filter(([, s]) => s === "failed")
    .map(([id]) => nodeById(city, id)?.name ?? id);
  const parts: string[] = [];
  parts.push(`Situation report, hour ${hour}, plan ${planName}.`);
  parts.push(`${snap.affectedPopulation.toLocaleString()} residents without service.`);
  parts.push(`${snap.hospitalsDown} hospitals down.`);
  parts.push(`${snap.systemsFailed} systems currently failed.`);
  if (failedNames.length) parts.push(`Systems down: ${failedNames.slice(0, 6).join(", ")}.`);
  parts.push(`Cumulative: ${Math.round(result.personHoursLost).toLocaleString()} person-hours lost so far.`);
  return parts.join(" ");
}
