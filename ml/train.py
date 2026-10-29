"""Train the CIVICSHIELD cascade-risk surrogate (two random-forest heads) on engine-generated runs.
Run: python3 ml/train.py [ml/training-data.json] [public/data/surrogate-model.json]
  head "agg"  : affected_pop_hours, hospital_downtime_h, peak_affected_pop, final_failed
  head "fail" : probability that each asset fails at some point (26 outputs)
"""
import json, os, sys, time
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score
from sklearn.model_selection import train_test_split

src = sys.argv[1] if len(sys.argv) > 1 else "ml/training-data.json"
dst = sys.argv[2] if len(sys.argv) > 2 else "public/data/surrogate-model.json"
net_path = sys.argv[3] if len(sys.argv) > 3 else "public/data/network.json"
d = json.load(open(src))
X = np.array(d["X"], dtype=float); Y = np.array(d["Y"], dtype=float)
feat, targets = d["features"], d["targets"]
Xtr, Xte, Ytr, Yte = train_test_split(X, Y, test_size=0.2, random_state=7)
AGG, FAIL = [0, 1, 2, 3], list(range(4, Y.shape[1]))

def num(x):
    x = round(float(x), 4)
    return int(x) if x == int(x) else x

def export(rf, scale):
    trees = []
    for est in rf.estimators_:
        t = est.tree_
        leaf = t.children_left == -1
        trees.append({"f": [int(v) for v in t.feature], "th": [num(v) for v in t.threshold],
                      "l": [int(v) for v in t.children_left], "r": [int(v) for v in t.children_right],
                      "v": [[num(o[0]) for o in t.value[i]] if leaf[i] else None for i in range(t.node_count)]})
    return {"scale": [num(s) for s in scale], "trees": trees}

# physical constraint: an asset can only fail if it is a trigger or downstream (by any dependency edge) of one
net = json.load(open(net_path))
adj = {}
for e in net["edges"]: adj.setdefault(e["source"], []).append(e["target"])
def downstream(start):
    seen, stack = set(), [start]
    while stack:
        for w in adj.get(stack.pop(), []):
            if w not in seen: seen.add(w); stack.append(w)
    return sorted(seen)
descendants = {i: downstream(i) for i in feat}

heads, preds = {}, {}
t0 = time.time()
scale_a = np.maximum(Ytr[:, AGG].max(axis=0), 1.0)
rf_a = RandomForestRegressor(n_estimators=30, max_depth=14, min_samples_leaf=2, random_state=7, n_jobs=-1).fit(Xtr, Ytr[:, AGG] / scale_a)
preds["agg"] = rf_a.predict(Xte) * scale_a
heads["agg"] = {"targets": [targets[i] for i in AGG], **export(rf_a, scale_a)}
rf_f = RandomForestRegressor(n_estimators=30, max_depth=14, min_samples_leaf=1, random_state=7, n_jobs=-1).fit(Xtr, Ytr[:, FAIL])
preds["fail"] = rf_f.predict(Xte)
heads["fail"] = {"targets": [targets[i] for i in FAIL], **export(rf_f, np.ones(len(FAIL)))}
print(f"trained in {time.time()-t0:.1f}s")

# honest baseline: additive = sum of each asset's single-failure outcome
single = {int(np.argmax(x)): y for x, y in zip(Xtr, Ytr) if x.sum() == 1}
base = np.array([sum((single[i][AGG] for i in np.nonzero(x)[0] if i in single), np.zeros(4)) for x in Xte])
metrics = {}
for j, i in enumerate(AGG):
    metrics[targets[i]] = {"r2_model": round(float(r2_score(Yte[:, i], preds["agg"][:, j])), 3),
                           "r2_additive_baseline": round(float(r2_score(Yte[:, i], base[:, j])), 3)}
metrics["asset_failure_accuracy"] = round(float(((preds["fail"] >= 0.5) == (Yte[:, FAIL] >= 0.5)).mean()), 3)
print(json.dumps(metrics, indent=1))

model = {"version": 2, "kind": "random_forest_surrogate", "features": feat, "descendants": descendants, "heads": heads,
         "trained_on": int(len(Xtr)), "tested_on": int(len(Xte)), "metrics": metrics,
         "note": "Surrogate of the cascade engine for simultaneous failures at T+0h (1-5 assets). Trained on synthetic engine runs."}
json.dump(model, open(dst, "w"), separators=(",", ":"))
idx = list(range(0, len(Xte), max(1, len(Xte) // 25)))[:25]
json.dump({"X": Xte[idx].tolist(), "agg": preds["agg"][idx].tolist(), "fail": preds["fail"][idx].tolist()}, open("ml/fixtures.json", "w"))
print(f"model -> {dst} ({os.path.getsize(dst)/1024:.0f} KB)")
