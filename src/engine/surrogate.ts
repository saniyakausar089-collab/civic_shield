/**
 * CIVICSHIELD cascade-risk surrogate (ML).
 *
 * A random-forest model trained (ml/train.py) on thousands of runs of the real cascade engine.
 * It gives an INSTANT estimate for a set of simultaneous failures without running the simulator:
 *   - affected population-hours, hospital downtime, peak affected population, failed assets
 *   - the probability that each asset fails somewhere in the cascade
 * It is an approximation of the engine (see model.metrics for held-out accuracy), not a replacement.
 * Failure probabilities are masked by graph reachability, so an asset that no failed asset feeds can never be listed.
 * No runtime imports.
 */
export interface SurrogateTree {
  f: number[];
  th: number[];
  l: number[];
  r: number[];
  v: (number[] | null)[];
}

export interface SurrogateHead {
  targets: string[];
  scale: number[];
  trees: SurrogateTree[];
}

export interface SurrogateModel {
  version: number;
  features: string[];
  /** assetId -> assets downstream of it (any dependency edge). Used as a physical constraint. */
  descendants?: Record<string, string[]>;
  heads: { agg: SurrogateHead; fail: SurrogateHead };
  trained_on: number;
  tested_on: number;
  metrics: Record<string, { r2_model: number; r2_additive_baseline: number } | number>;
  note: string;
}

export interface SurrogatePrediction {
  affected_pop_hours: number;
  hospital_downtime_h: number;
  peak_affected_pop: number;
  final_failed: number;
  /** assetId -> probability (0-1) that it fails at some point */
  asset_failure_probability: Record<string, number>;
  /** false when the input is outside what the model was trained on (0 or more than 5 assets) */
  in_distribution: boolean;
}

function forest(head: SurrogateHead, x: number[]): number[] {
  const out = new Array<number>(head.targets.length).fill(0);
  for (const t of head.trees) {
    let node = 0;
    while ((t.l[node] ?? -1) !== -1) {
      node = (x[t.f[node] ?? 0] ?? 0) <= (t.th[node] ?? 0) ? (t.l[node] as number) : (t.r[node] as number);
    }
    const leaf = t.v[node] ?? [];
    for (let i = 0; i < out.length; i++) out[i] = (out[i] ?? 0) + (leaf[i] ?? 0);
  }
  return out.map((s, i) => (s / head.trees.length) * (head.scale[i] ?? 1));
}

/** failedAssets: ids of assets assumed to fail simultaneously at T+0h. */
export function predictSurrogate(model: SurrogateModel, failedAssets: string[]): SurrogatePrediction {
  const failed = new Set(failedAssets);
  const x = model.features.map((id) => (failed.has(id) ? 1 : 0));
  const count = x.reduce((a, b) => a + b, 0);
  const a = forest(model.heads.agg, x);
  const f = forest(model.heads.fail, x);
  // an asset can only fail if it is a trigger or downstream of one: zero everything else
  let reachable: Set<string> | null = null;
  if (model.descendants) {
    reachable = new Set(failed);
    for (const id of failed) (model.descendants[id] ?? []).forEach((d) => reachable!.add(d));
  }
  const prob: Record<string, number> = {};
  model.heads.fail.targets.forEach((name, i) => {
    const id = name.replace(/^fail:/, "");
    prob[id] = reachable && !reachable.has(id) ? 0 : Math.min(1, Math.max(0, f[i] ?? 0));
  });
  const nz = (v: number | undefined) => Math.max(0, v ?? 0);
  return {
    affected_pop_hours: Math.round(nz(a[0])),
    hospital_downtime_h: Math.round(nz(a[1]) * 10) / 10,
    peak_affected_pop: Math.round(nz(a[2])),
    final_failed: Math.round(nz(a[3])),
    asset_failure_probability: prob,
    in_distribution: count >= 1 && count <= 5,
  };
}
