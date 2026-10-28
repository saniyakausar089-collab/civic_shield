import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import cesium from "vite-plugin-cesium";

export default defineConfig({
  plugins: [
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
