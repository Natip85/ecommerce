import baseConfig from "@ecommerce/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist/**"],
  },
  ...baseConfig,
  {
    files: ["src/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
];
