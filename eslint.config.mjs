import { baseConfig, ignoresConfig } from "@ecommerce/config/eslint/base";
import { reactConfig } from "@ecommerce/config/eslint/react";
import { nextConfig } from "@ecommerce/config/eslint/next";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...ignoresConfig,
  ...baseConfig,
  // React/Next.js rules for web app
  {
    files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
    ...reactConfig[0],
  },
  {
    files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
    ...nextConfig[0],
  },
  {
    // Relaxed rules for shadcn/ui components
    files: ["apps/web/src/components/ui/**/*.tsx"],
    rules: {
      "jsx-a11y/anchor-has-content": "off",
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/no-autofocus": "off",
    },
  },
  {
    // Allow autoFocus in admin/search components
    files: [
      "apps/web/src/features/admin/**/*.tsx",
      "apps/web/src/features/global-search/**/*.tsx",
    ],
    rules: {
      "jsx-a11y/no-autofocus": "warn",
    },
  },
];
