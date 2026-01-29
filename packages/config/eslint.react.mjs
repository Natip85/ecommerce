import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";

/** @type {import("eslint").Linter.Config[]} */
export const reactConfig = [
  {
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "jsx-a11y": pluginJsxA11y,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React
      ...pluginReact.configs.recommended.rules,
      ...pluginReact.configs["jsx-runtime"].rules,
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "react/jsx-no-target-blank": "warn",

      // React Hooks
      ...pluginReactHooks.configs.recommended.rules,

      // Accessibility
      ...pluginJsxA11y.configs.recommended.rules,
      "jsx-a11y/anchor-is-valid": "off", // Next.js Link component
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
    },
  },
];
