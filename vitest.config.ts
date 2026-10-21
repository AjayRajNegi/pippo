import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.ts"],
		exclude: ["**/out/**", "**/node_modules/**", "**/*.d.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"**/*.test.ts",
				"**/out/**",
				"**/node_modules/**",
				"src/extension.ts",
			],
		},
		setupFiles: [],
		testTimeout: 10000,
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
});
