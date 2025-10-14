/// <reference types="vitest" />

import { defineConfig } from "vite";
import type { UserConfig } from "vite";
import type { UserConfig as VitestUserConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

type ExtendedConfig = UserConfig & {
  test?: VitestUserConfig["test"];
};

const config = {
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    globals: true,
    css: true,
    coverage: {
      reporter: ["text", "html"],
    },
  },
} satisfies ExtendedConfig;

// https://vite.dev/config/
export default defineConfig(config);
