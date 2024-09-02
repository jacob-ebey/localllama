import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/server-runtime" {
  interface Future {
    unstable_singleFetch: true;
  }
}

export default defineConfig(({ command }) => ({
  ssr:
    command === "build"
      ? {
          noExternal: true,
          external: ["better-sqlite3", "drizzle-orm", "ollama"],
        }
      : undefined,
  plugins: [
    tsconfigPaths(),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        unstable_lazyRouteDiscovery: true,
        unstable_singleFetch: true,
      },
    }),
  ],
}));
