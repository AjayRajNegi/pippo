import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const isWatch = process.argv.includes("--watch");
const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "out");

const config = {
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outdir: outDir,
  entryPoints: [resolve(__dirname, "src/extension.ts")],
  external: ["vscode"],
  sourcemap: true,
  sourcesContent: false,
  treeShaking: true,
  keepNames: true,
  logLevel: "info",
  plugins: [
    {
      name: "watch-rebuild",
      setup(build) {
        if (isWatch) {
          build.onEnd((result) => {
            if (result.errors.length === 0) {
              console.log("[esbuild] Watch rebuild complete");
            }
          });
        }
      },
    },
  ],
};

async function run() {
  if (isWatch) {
    const ctx = await build({ ...config, watch: true });
    console.log("[esbuild] Watching for changes...");
    // Keep process alive
    process.on("SIGINT", () => {
      ctx.dispose();
      process.exit(0);
    });
  } else {
    await build(config);
    console.log("[esbuild] Build complete");
  }
}

run();
