// Usage: cascade_cli network.json neighborhoods.geojson cases.json > results.json
// cases.json = [ { "scenario": {...}, "opts": {...} }, ... ]
#include <chrono>
#include <fstream>
#include <iostream>
#include "cascade.hpp"

static civicshield::json readJson(const char* path) {
  if (path != nullptr && std::string(path) == "-") {
    return civicshield::json::parse(std::cin);
  }
  std::ifstream f(path);
  if (!f) throw std::runtime_error(std::string("cannot open ") + path);
  return civicshield::json::parse(f);
}

int main(int argc, char** argv) {
  if (argc < 3) { std::cerr << "usage: cascade_cli network.json hoods.geojson [cases.json|-]\n"; return 2; }
  try {
    using namespace civicshield;
    Model m = loadModel(readJson(argv[1]), readJson(argv[2]));
    json cases = (argc >= 4) ? readJson(argv[3]) : civicshield::json::parse(std::cin);
    json out = json::array();
    auto t0 = std::chrono::steady_clock::now();
    for (const auto& c : cases) out.push_back(simulate(m, c.at("scenario"), c.value("opts", json::object())));
    auto ms = std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - t0).count();
    std::cerr << "C++ engine: " << cases.size() << " cases in " << ms << " ms\n";
    std::cout << out.dump();
  } catch (const std::exception& e) {
    std::cerr << "error: " << e.what() << "\n";
    return 1;
  }
  return 0;
}
