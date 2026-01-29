import { baseConfig, ignoresConfig } from "@ecommerce/config/eslint/base";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...ignoresConfig,
  ...baseConfig,
  {
    files: ["**/*.ts"],
    rules: {
      // Add any package-specific overrides here
    },
  },
];
