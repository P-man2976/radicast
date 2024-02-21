import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/cli/index.ts"],
	sourcemap: true,
	format: "esm",
	splitting: false,
	clean: true,
});
