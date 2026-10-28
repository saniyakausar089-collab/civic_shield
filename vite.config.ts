import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import cesium from "vite-plugin-cesium";
import type { Plugin } from "vite";
import { execFile } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

function cppCascadePlugin(): Plugin {
  return {
    name: "vite-plugin-cpp-cascade",
    configureServer(server) {
      server.middlewares.use("/api/cascade", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method Not Allowed" }));
          return;
        }

        let bodyStr = "";
        req.on("data", (chunk: any) => {
          bodyStr += chunk;
        });

        req.on("end", () => {
          try {
            const body = JSON.parse(bodyStr || "{}");
            const { scenario, opts = {} } = body;
            if (!scenario || !scenario.id) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Missing scenario in request body" }));
              return;
            }

            const root = path.resolve(".");
            const isWin = process.platform === "win32";
            const bin = isWin
              ? path.join(root, "build", "cascade_cli.exe")
              : path.join(root, "build", "cascade_cli");

            if (!fs.existsSync(bin)) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: `C++ binary not found at ${bin}` }));
              return;
            }

            const networkPath = path.join(root, "public", "data", "network.json");
            const hoodsPath = path.join(root, "public", "data", "neighborhoods.geojson");

            const payload = [{ scenario, opts }];
            const t0 = Date.now();

            const child = execFile(
              bin,
              [networkPath, hoodsPath, "-"],
              { timeout: 5000, maxBuffer: 10 * 1024 * 1024 },
              (err, stdout, stderr) => {
                const durationMs = Date.now() - t0;
                if (err) {
                  res.statusCode = 500;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ error: stderr ? stderr.trim() : err.message }));
                  return;
                }

                try {
                  const raw = stdout.trim();
                  const cleanJson = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
                  const parsed = JSON.parse(cleanJson);
                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.end(
                    JSON.stringify({
                      result: parsed[0],
                      engine: "cpp",
                      durationMs,
                    })
                  );
                } catch (parseErr: any) {
                  res.statusCode = 500;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ error: "Invalid JSON from C++ binary: " + parseErr.message }));
                }
              }
            );

            if (child.stdin) {
              child.stdin.write(JSON.stringify(payload));
              child.stdin.end();
            }
          } catch (jsonErr: any) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Invalid JSON body: " + jsonErr.message }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [
    cppCascadePlugin(),
    cesium({
      rebuildCesium: true,
    }),
  ],
  define: {
    // Tell Cesium where static build assets reside
    CESIUM_BASE_URL: JSON.stringify("/cesium"),
  },
  server: {
    fs: {
      strict: false,
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
