// WebAssembly entry points. Build with `make -C cpp wasm` (needs Emscripten).
// JS flow: cs_load(networkJson, hoodsJson) once, then cs_run(scenarioJson, optsJson) per simulation.
// cs_run returns a malloc'd JSON string (a SimResult, or {"error": "..."}); free it with cs_free.
#include <cstdlib>
#include <cstring>
#include <string>
#include "cascade.hpp"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#define CS_EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define CS_EXPORT
#endif

static civicshield::Model* g_model = nullptr;

static char* dupString(const std::string& s) {
  char* p = static_cast<char*>(std::malloc(s.size() + 1));
  std::memcpy(p, s.c_str(), s.size() + 1);
  return p;
}

extern "C" {

CS_EXPORT int cs_load(const char* networkJson, const char* hoodsJson) {
  try {
    auto* model = new civicshield::Model(
        civicshield::loadModel(civicshield::json::parse(networkJson), civicshield::json::parse(hoodsJson)));
    delete g_model;
    g_model = model;
    return 0;
  } catch (...) {
    return 1;
  }
}

CS_EXPORT char* cs_run(const char* scenarioJson, const char* optsJson) {
  using civicshield::json;
  try {
    if (!g_model) throw std::runtime_error("cs_load must be called first");
    json opts = (optsJson && *optsJson) ? json::parse(optsJson) : json::object();
    return dupString(civicshield::simulate(*g_model, json::parse(scenarioJson), opts).dump());
  } catch (const std::exception& e) {
    return dupString(json{{"error", e.what()}}.dump());
  }
}

CS_EXPORT void cs_free(char* p) { std::free(p); }

}  // extern "C"
