// CIVICSHIELD cascade engine, C++17 port of src/engine/cascade.ts.
// Same model, same iteration order, same rounding, so results match the TypeScript engine exactly.
#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <deque>
#if __has_include(<optional>)
#include <optional>
#elif __has_include(<experimental/optional>)
#include <experimental/optional>
namespace std {
  using experimental::optional;
}
#endif
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

#include "third_party/json.hpp"

namespace civicshield {

using json = nlohmann::ordered_json;

enum EdgeType { WATER = 0, POWER = 1, TELECOM = 2, ROAD = 3, HAZARD = 4, N_TYPES = 5 };
enum Status { NORMAL = 0, DEGRADED = 1, FAILED = 2 };
static const char* const STATUS_NAME[3] = {"normal", "degraded", "failed"};

inline double r3(double x) { return std::floor(x * 1000.0 + 0.5) / 1000.0; }  // == JS Math.round(x*1000)/1000
inline double jsRound(double x) { return std::floor(x + 0.5); }                // == JS Math.round

inline int edgeTypeOf(const std::string& s) {
  if (s == "water") return WATER;
  if (s == "power") return POWER;
  if (s == "telecom") return TELECOM;
  if (s == "road") return ROAD;
  if (s == "hazard") return HAZARD;
  throw std::runtime_error("unknown edge type: " + s);
}

struct Node {
  std::string id, name, type, network;
  double backupPower = 0, backupWater = 0;
};

struct Edge {
  int src = 0, tgt = 0, type = 0, delay = 0;
  double weight = 0;
};

struct Hood {
  std::string id;
  double population = 0;
  std::vector<std::pair<double, int>> served;  // (impact weight, node index) in impact-weight order
};

struct Model {
  double degradedBelow = 0.8, failedBelow = 0.4;
  int horizon = 24;
  std::vector<Node> nodes;
  std::vector<Edge> edges;
  std::vector<std::vector<int>> incoming;  // edge indices per target node, in file order
  std::vector<int> order;                  // topological order
  std::vector<int> hospitals;
  std::vector<Hood> hoods;
  double totalPop = 0;
  std::unordered_map<std::string, int> idx;
};

inline Model loadModel(const json& network, const json& hoods) {
  Model m;
  const json& d = network.at("engine_defaults");
  m.degradedBelow = d.at("degraded_below").get<double>();
  m.failedBelow = d.at("failed_below").get<double>();
  m.horizon = d.at("horizon_h").get<int>();

  for (const auto& n : network.at("nodes")) {
    Node node;
    node.id = n.at("id").get<std::string>();
    node.name = n.at("name").get<std::string>();
    node.type = n.at("type").get<std::string>();
    node.network = n.at("network").get<std::string>();
    node.backupPower = n.value("backup_power_hours", 0.0);
    node.backupWater = n.value("backup_water_hours", 0.0);
    m.idx[node.id] = static_cast<int>(m.nodes.size());
    if (node.type == "hospital") m.hospitals.push_back(static_cast<int>(m.nodes.size()));
    m.nodes.push_back(node);
  }
  const int N = static_cast<int>(m.nodes.size());
  m.incoming.assign(N, {});
  std::vector<std::vector<int>> adj(N);
  std::vector<int> indeg(N, 0);
  for (const auto& e : network.at("edges")) {
    Edge ed;
    ed.src = m.idx.at(e.at("source").get<std::string>());
    ed.tgt = m.idx.at(e.at("target").get<std::string>());
    ed.type = edgeTypeOf(e.at("type").get<std::string>());
    ed.weight = e.at("weight").get<double>();
    ed.delay = e.at("delay_h").get<int>();
    m.incoming[ed.tgt].push_back(static_cast<int>(m.edges.size()));
    adj[ed.src].push_back(ed.tgt);
    indeg[ed.tgt]++;
    m.edges.push_back(ed);
  }

  std::deque<int> q;
  for (int i = 0; i < N; i++) if (indeg[i] == 0) q.push_back(i);
  while (!q.empty()) {
    int u = q.front(); q.pop_front();
    m.order.push_back(u);
    for (int v : adj[u]) if (--indeg[v] == 0) q.push_back(v);
  }
  if (static_cast<int>(m.order.size()) != N) throw std::runtime_error("Dependency graph has a cycle");

  std::vector<std::pair<std::string, double>> iw;
  for (const auto& item : d.at("neighborhood_impact_weights").items()) iw.emplace_back(item.key(), item.value().get<double>());
  for (const auto& f : hoods.at("features")) {
    const json& p = f.at("properties");
    Hood h;
    h.id = p.at("id").get<std::string>();
    h.population = p.at("population").get<double>();
    for (const auto& item : iw) {
      const auto& net = item.first;
      const auto& w = item.second;
      if (!p.at("served_by").contains(net)) continue;
      auto it = m.idx.find(p.at("served_by").at(net).get<std::string>());
      if (it != m.idx.end()) h.served.emplace_back(w, it->second);
    }
    m.totalPop += h.population;
    m.hoods.push_back(h);
  }
  return m;
}

inline Status statusOf(double f, double degradedBelow, double failedBelow) {
  return f < failedBelow ? FAILED : f < degradedBelow ? DEGRADED : NORMAL;
}

struct Trigger {
  int node = 0, t = 0, index = 0;
  double severity = 1;
  std::string event;
};

inline json simulate(const Model& m, const json& scenario, const json& optsIn) {
  const json opts = optsIn.is_object() ? optsIn : json::object();
  const int N = static_cast<int>(m.nodes.size());
  const int E = static_cast<int>(m.edges.size());
  int H = m.horizon;
  if (opts.contains("horizonH") && opts["horizonH"].is_number()) H = opts["horizonH"].get<int>();
  const double affectedThr = (opts.contains("affectedThreshold") && opts["affectedThreshold"].is_number())
                                 ? opts["affectedThreshold"].get<double>() : 0.25;

  // scenario triggers (last trigger per node wins, like the JS Map constructor)
  std::vector<std::optional<Trigger>> trigOf(N);
  {
    int i = 0;
    for (const auto& t : scenario.at("triggers")) {
      auto it = m.idx.find(t.at("node").get<std::string>());
      if (it != m.idx.end()) {
        Trigger tr;
        tr.node = it->second;
        tr.t = t.at("t_hours").get<int>();
        tr.severity = t.at("severity").get<double>();
        tr.event = t.at("event").get<std::string>();
        tr.index = i;
        trigOf[it->second] = tr;
      }
      i++;
    }
  }

  std::vector<std::optional<double>> restoreAt(N);
  if (opts.contains("restore") && opts["restore"].is_object())
    for (const auto& item : opts["restore"].items()) {
      const auto& k = item.key();
      const auto& v = item.value();
      auto it = m.idx.find(k);
      if (it != m.idx.end()) restoreAt[it->second] = v.get<double>();
    }

  std::vector<double> scale(E, 1.0);
  if (opts.contains("edgeScale") && opts["edgeScale"].is_object())
    for (int e = 0; e < E; e++) {
      std::string key = m.nodes[m.edges[e].src].id + ">" + m.nodes[m.edges[e].tgt].id;
      if (opts["edgeScale"].contains(key)) scale[e] = opts["edgeScale"][key].get<double>();
    }

  std::vector<double> boostPower(N, 0.0), boostWater(N, 0.0);
  if (opts.contains("backupBoost") && opts["backupBoost"].is_object())
    for (const auto& item : opts["backupBoost"].items()) {
      const auto& k = item.key();
      const auto& v = item.value();
      auto it = m.idx.find(k);
      if (it == m.idx.end()) continue;
      boostPower[it->second] = v.value("power", 0.0);
      boostWater[it->second] = v.value("water", 0.0);
    }

  std::vector<std::vector<double>> hist(N), histD(N);
  std::vector<std::array<int, N_TYPES>> lossStart(N);
  for (auto& a : lossStart) a.fill(-1);
  std::vector<int> prevStatus(N, NORMAL);

  struct FrameStat {
    double affected = 0;
    int hospDown = 0;
    int failedCount = 0;
    std::vector<double> f;
  };
  std::vector<FrameStat> stats;
  json frames = json::array(), allEvents = json::array();

  for (int t = 0; t <= H; t++) {
    std::vector<double> fNow(N, 0.0), dNow(N, 0.0);
    std::vector<int> mainSource(N, -1);

    for (int id : m.order) {
      std::array<double, N_TYPES> groups{};
      double best = 0;
      int bestSrc = -1;
      for (int ei : m.incoming[id]) {
        const Edge& e = m.edges[ei];
        double lossOfSource;
        if (e.type == HAZARD) {
          lossOfSource = e.delay == 0 ? dNow[e.src] : (t - e.delay < 0 ? 0.0 : histD[e.src][t - e.delay]);
        } else {
          double fs = e.delay == 0 ? fNow[e.src] : (t - e.delay < 0 ? 1.0 : hist[e.src][t - e.delay]);
          lossOfSource = 1 - fs;
        }
        double w = e.weight * scale[ei];
        double contrib = w * lossOfSource;
        groups[e.type] += contrib;
        if (contrib > best) { best = contrib; bestSrc = e.src; }
      }

      double keep = 1;
      for (int type = 0; type < N_TYPES; type++) {
        double loss = std::min(1.0, groups[type]);
        if (loss > 1e-9) {
          if (lossStart[id][type] < 0) lossStart[id][type] = t;
          double baseBackup = type == POWER ? m.nodes[id].backupPower : type == WATER ? m.nodes[id].backupWater : 0.0;
          double boost = type == POWER ? boostPower[id] : type == WATER ? boostWater[id] : 0.0;
          double backup = baseBackup + boost;
          if (backup != 0 && t - lossStart[id][type] < backup) loss = 0;
        } else {
          lossStart[id][type] = -1;
        }
        keep *= 1 - loss;
      }

      double f = keep;
      double triggerDamage = 0;
      const auto& tr = trigOf[id];
      if (tr && t >= tr->t && !(restoreAt[id] && t >= *restoreAt[id])) {
        f = std::min(f, 1 - tr->severity);
        triggerDamage = tr->severity;
      }
      double damage = std::max(triggerDamage, std::min(1.0, groups[HAZARD]));
      dNow[id] = damage;
      histD[id].push_back(damage);

      f = r3(std::max(0.0, std::min(1.0, f)));
      fNow[id] = f;
      hist[id].push_back(f);
      mainSource[id] = bestSrc;
    }

    // statuses + events
    std::vector<int> status(N);
    std::vector<json> evs;
    std::vector<int> evKey;
    for (int i = 0; i < N; i++) {
      Status s = statusOf(fNow[i], m.degradedBelow, m.failedBelow);
      status[i] = s;
      int prev = prevStatus[i];
      if (s == prev) continue;
      const auto& tr = trigOf[i];
      const Node& n = m.nodes[i];
      if (static_cast<int>(s) > prev) {
        if (tr && t == tr->t) {
          evs.push_back({{"t", t}, {"node", n.id}, {"kind", "trigger"}, {"to", STATUS_NAME[s]}, {"text", tr->event}});
          evKey.push_back(tr->index);
        } else {
          std::string text = n.name + " " + STATUS_NAME[s];
          if (mainSource[i] >= 0) text += " (loss of " + m.nodes[mainSource[i]].name + ")";
          evs.push_back({{"t", t}, {"node", n.id}, {"kind", "cascade"}, {"to", STATUS_NAME[s]}, {"text", text}});
          evKey.push_back(1000);
        }
      } else {
        evs.push_back({{"t", t}, {"node", n.id}, {"kind", "recovery"}, {"to", STATUS_NAME[s]},
                       {"text", n.name + (s == NORMAL ? " recovered" : " partly restored")}});
        evKey.push_back(1000);
      }
      prevStatus[i] = s;
    }
    std::vector<int> ord(evs.size());
    for (size_t i = 0; i < ord.size(); i++) ord[i] = static_cast<int>(i);
    std::stable_sort(ord.begin(), ord.end(), [&](int a, int b) { return evKey[a] < evKey[b]; });
    json events = json::array();
    for (int i : ord) { events.push_back(evs[i]); allEvents.push_back(evs[i]); }

    // neighborhoods
    json impact = json::object();
    double affected = 0, serviceLoss = 0;
    for (const auto& h : m.hoods) {
      double v = 0;
      for (const auto& item : h.served) v += item.first * (1 - fNow[item.second]);
      v = r3(std::min(1.0, v));
      impact[h.id] = v;
      if (v >= affectedThr) affected += h.population;
      serviceLoss += h.population * v;
    }

    json fn = json::object(), st = json::object(), failed = json::array(), degraded = json::array();
    for (int i = 0; i < N; i++) {
      fn[m.nodes[i].id] = fNow[i];
      st[m.nodes[i].id] = STATUS_NAME[status[i]];
      if (status[i] == FAILED) failed.push_back(m.nodes[i].id);
      if (status[i] == DEGRADED) degraded.push_back(m.nodes[i].id);
    }
    int hd = 0, hdg = 0;
    for (int hi : m.hospitals) { if (status[hi] == FAILED) hd++; if (status[hi] == DEGRADED) hdg++; }

    frames.push_back({{"t", t}, {"functionality", fn}, {"status", st}, {"failed", failed}, {"degraded", degraded},
                      {"neighborhood_impact", impact}, {"affected_pop", affected},
                      {"service_loss_pop", jsRound(serviceLoss)}, {"hospitals_down", hd},
                      {"hospitals_degraded", hdg}, {"events", events}});
    stats.push_back({affected, hd, static_cast<int>(failed.size()), fNow});
  }

  // summary
  size_t peak = 0;
  double nodeHours = 0, affH = 0;
  int hospH = 0, peakHosp = 0;
  int firstHosp = -1;
  for (size_t i = 0; i < stats.size(); i++) {
    const auto& s = stats[i];
    if (s.affected > stats[peak].affected) peak = i;
    affH += s.affected;
    hospH += s.hospDown;
    peakHosp = std::max(peakHosp, s.hospDown);
    if (firstHosp < 0 && s.hospDown > 0) firstHosp = static_cast<int>(i);
    for (int n = 0; n < N; n++) nodeHours += 1 - s.f[n];
  }
  json summary = {{"peak_affected_pop", stats[peak].affected},
                  {"peak_t", static_cast<int>(peak)},
                  {"final_failed", stats.back().failedCount},
                  {"final_degraded", frames.back().at("degraded").size()},
                  {"peak_hospitals_down", peakHosp},
                  {"first_hospital_down_t", firstHosp < 0 ? json(nullptr) : json(firstHosp)},
                  {"affected_pop_hours", affH},
                  {"hospital_downtime_h", hospH},
                  {"node_hours_lost", r3(nodeHours)}};

  return json{{"scenario_id", scenario.at("id")}, {"horizon_h", H}, {"total_population", m.totalPop},
              {"frames", frames}, {"events", allEvents}, {"summary", summary}};
}

}  // namespace civicshield
