import { baseConfig, ignoresConfig } from "@ecommerce/config/eslint/base";
import { reactConfig } from "@ecommerce/config/eslint/react";
import { nextConfig } from "@ecommerce/config/eslint/next";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...ignoresConfig,
  ...baseConfig,
  ...reactConfig,
  ...nextConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Add any app-specific overrides here
    },
  },
  {
    // Relaxed rules for shadcn/ui components
    files: ["**/components/ui/**/*.tsx"],
    rules: {
      "jsx-a11y/anchor-has-content": "off",
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/no-autofocus": "off",
      "react/prop-types": "off",
    },
  },
  {
    // Allow autoFocus in specific admin components (intentional UX)
    files: ["**/features/admin/**/*.tsx", "**/features/global-search/**/*.tsx"],
    rules: {
      "jsx-a11y/no-autofocus": "warn",
    },
  },
];
