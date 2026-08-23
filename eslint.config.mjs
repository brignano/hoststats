import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/**
 * Flat config. `next lint` was removed in Next 16, so `npm run lint` calls
 * ESLint directly and this file has to stand on its own (the old version
 * imported @eslint/eslintrc, which was never a dependency).
 */
const eslintConfig = [
  { ignores: [".next/**", "out/**", "coverage/**", "node_modules/**"] },
  ...coreWebVitals,
  ...typescript,
];

export default eslintConfig;
