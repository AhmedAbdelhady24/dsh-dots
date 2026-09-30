import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  test: {
    environment: "node",
    env: {
      PLAYWRIGHT_BROWSERS_PATH: path.resolve(__dirname, "../../.playwright-browsers"),
    },
  },
})
