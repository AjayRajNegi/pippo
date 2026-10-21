import tseslint from "typescript-eslint";
import pluginPrettier from "eslint-plugin-prettier";

export default tseslint.config(
  {
    files: ["**/*.ts"],
    ignores: ["**/out/**", "**/node_modules/**", "**/*.d.ts", "esbuild.config.mjs", "vitest.config.ts"]
  },
  ...tseslint.configs.recommended,
  {
    plugins: {
      prettier: pluginPrettier
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        globalThis: "readonly",
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        exports: "readonly",
        module: "readonly",
        require: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        Promise: "readonly",
        Map: "readonly",
        Set: "readonly",
        WeakMap: "readonly",
        WeakSet: "readonly",
        Symbol: "readonly",
        Object: "readonly",
        Array: "readonly",
        String: "readonly",
        Number: "readonly",
        Boolean: "readonly",
        Date: "readonly",
        RegExp: "readonly",
        Error: "readonly",
        JSON: "readonly",
        Math: "readonly",
        Reflect: "readonly",
        Intl: "readonly",
        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
        DataView: "readonly",
        ArrayBuffer: "readonly"
      }
    },
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "import",
          format: ["camelCase", "PascalCase"]
        }
      ],
      "curly": "warn",
      "eqeqeq": "warn",
      "no-throw-literal": "warn",
      "semi": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/consistent-type-imports": "warn"
    }
  }
);