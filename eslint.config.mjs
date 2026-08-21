import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";

/**
 * Standalone flat config.
 * eslint-config-next is currently unusable because its typescript-eslint
 * dependency does not support TypeScript 7 yet - once it does, this can be
 * replaced with compat.extends("next/core-web-vitals", "next/typescript").
 */
export default [
  {
    ignores: [".next/**", "node_modules/**", ".venv/**", "next-env.d.ts"],
  },
  js.configs.recommended,
  {
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
