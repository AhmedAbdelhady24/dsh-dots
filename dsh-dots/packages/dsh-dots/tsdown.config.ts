import { defineConfig } from "tsdown"

export default defineConfig({
  fixedExtension: false,
  deps: { neverBundle: true },
})
