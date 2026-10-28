import { execFile } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import type { Scenario, SimOptions, SimResult } from "@/engine/cascade";

export interface CppEngineResult {
  result: SimResult;
  engine: "cpp";
  durationMs: number;
  stdout?: string;
  stderr?: string;
}

export function getCppBinaryPath(): string {
  const root = path.resolve(".");
  const isWin = process.platform === "win32";
  const preferred = isWin
    ? path.join(root, "build", "cascade_cli.exe")
    : path.join(root, "build", "cascade_cli");

  if (fs.existsSync(preferred)) return preferred;

  // Fallback to root binary if available
  const rootBin = isWin
    ? path.join(root, "cascade_cli.exe")
    : path.join(root, "cascade_cli");
  if (fs.existsSync(rootBin)) return rootBin;

  throw new Error(`C++ Cascade binary not found. Expected at ${preferred}`);
}

export function isCppEngineAvailable(): boolean {
  try {
    const bin = getCppBinaryPath();
    return fs.existsSync(bin);
  } catch {
    return false;
  }
}

export async function runCppSimulation(
  scenario: Scenario,
  opts: SimOptions = {}
): Promise<CppEngineResult> {
  const root = path.resolve(".");
  const bin = getCppBinaryPath();
  const networkPath = path.join(root, "public", "data", "network.json");
  const hoodsPath = path.join(root, "public", "data", "neighborhoods.geojson");

  if (!fs.existsSync(networkPath)) {
    throw new Error(`network.json not found at ${networkPath}`);
  }
  if (!fs.existsSync(hoodsPath)) {
    throw new Error(`neighborhoods.geojson not found at ${hoodsPath}`);
  }

  // Strict input validation
  if (!scenario || typeof scenario !== "object") {
    throw new Error("Invalid scenario: must be an object");
  }
  if (!scenario.id || typeof scenario.id !== "string") {
    throw new Error("Invalid scenario: missing or invalid scenario.id");
  }
  if (!Array.isArray(scenario.triggers)) {
    throw new Error("Invalid scenario: triggers must be an array");
  }
  for (const tr of scenario.triggers) {
    if (!tr.node || typeof tr.node !== "string") {
      throw new Error("Invalid scenario: each trigger must specify a string node");
    }
  }

  const payload = [
    {
      scenario,
      opts: opts || {},
    },
  ];

  const inputJson = JSON.stringify(payload);
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const child = execFile(
      bin,
      [networkPath, hoodsPath, "-"],
      {
        timeout: 5000,
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        const durationMs = Date.now() - startTime;
        if (error) {
          const errMsg = stderr ? stderr.trim() : error.message;
          return reject(new Error(`C++ engine execution failed: ${errMsg}`));
        }

        try {
          const raw = stdout.trim();
          const cleanJson = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
          const parsed = JSON.parse(cleanJson);
          if (!Array.isArray(parsed) || parsed.length === 0) {
            return reject(new Error("C++ engine returned empty or invalid results array"));
          }

          resolve({
            result: parsed[0] as SimResult,
            engine: "cpp",
            durationMs,
            stderr: stderr ? stderr.trim() : undefined,
          });
        } catch (parseErr: any) {
          reject(new Error(`Failed to parse C++ engine JSON output: ${parseErr.message}`));
        }
      }
    );

    child.on("error", (err) => {
      reject(new Error(`Failed to spawn C++ engine process: ${err.message}`));
    });

    if (child.stdin) {
      child.stdin.write(inputJson);
      child.stdin.end();
    }
  });
}

