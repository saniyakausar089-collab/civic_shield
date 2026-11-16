CXX ?= g++
CXXFLAGS ?= -std=c++17 -O2 -Wall -Wextra
BUILD := build

ifeq ($(OS),Windows_NT)
  TARGET := $(BUILD)/cascade_cli.exe
else
  TARGET := $(BUILD)/cascade_cli
endif

all: $(TARGET)

$(TARGET): cli.cpp cascade.hpp third_party/json.hpp
	mkdir -p $(BUILD)
	$(CXX) $(CXXFLAGS) cli.cpp -o $@

# Native compile check of the WASM entry points (no Emscripten needed)
check-wasm-source: wasm.cpp cascade.hpp
	mkdir -p $(BUILD)
	$(CXX) $(CXXFLAGS) -c wasm.cpp -o $(BUILD)/wasm_check.o

# WebAssembly build (requires emsdk: https://emscripten.org). Output is one self-contained JS file.
wasm: wasm.cpp cascade.hpp third_party/json.hpp
	mkdir -p ../public/wasm
	em++ -std=c++17 -O2 -fexceptions wasm.cpp -o ../public/wasm/cascade.js \
	  -s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORT_NAME=createCascadeModule \
	  -s EXPORTED_FUNCTIONS=_cs_load,_cs_run,_cs_free,_malloc,_free \
	  -s EXPORTED_RUNTIME_METHODS=cwrap,UTF8ToString \
	  -s ALLOW_MEMORY_GROWTH=1 -s ENVIRONMENT=web -s SINGLE_FILE=1

clean:
	rm -rf $(BUILD)

.PHONY: all wasm check-wasm-source clean
