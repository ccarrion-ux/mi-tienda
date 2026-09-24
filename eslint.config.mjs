import tsParser from "eslint-config-next/parser.js";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
    languageOptions: {
      parser: tsParser
    },
    rules: {}
  }
];
