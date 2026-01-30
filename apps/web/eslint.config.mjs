import baseConfig, { restrictEnvAccess } from "@ecommerce/eslint-config/base";
import nextjsConfig from "@ecommerce/eslint-config/nextjs";
import reactConfig from "@ecommerce/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
