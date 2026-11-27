// The rule set eslint-config-next's core-web-vitals + typescript presets gave
// us, without the Next plugin itself (Phase 3b, docs/EMDASH-MIGRATION-PLAN.md):
// React and React Hooks recommended, a few accessibility and import rules, and
// typescript-eslint recommended for TypeScript.
import { defineConfig, globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    plugins: { react, "react-hooks": reactHooks, import: importPlugin, "jsx-a11y": jsxA11y },
    languageOptions: {
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "import/no-anonymous-default-export": "warn",
      "react/no-unknown-property": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/jsx-no-target-blank": "off",
      "jsx-a11y/alt-text": ["warn", { elements: ["img"], img: ["Image"] }],
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
    },
  },
  // As in eslint-config-next, these apply to every file, not only TypeScript.
  ...tseslint.configs.recommended,
  { rules: { "@typescript-eslint/no-unused-vars": "warn", "@typescript-eslint/no-unused-expressions": "warn" } },
  globalIgnores(["out/**", "build/**", "dist/**", ".astro/**", ".cloudflare/**", ".wrangler/**"]),
]);
