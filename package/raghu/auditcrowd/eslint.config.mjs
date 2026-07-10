import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

// Next 16 ships flat config natively — no FlatCompat needed.
const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  { ignores: ["dist/**", ".next/**", "node_modules/**"] },
  {
    // Ported from the proven v1 AuditCrowd app (PR #56 lineage) — kept byte-close
    // to the original rather than lint-churned. Tighten as these files evolve.
    files: [
      "src/app/page.tsx",
      "src/app/not-found.tsx",
      "src/app/engagement/**",
      "src/components/ui/**",
      "src/components/forms/**",
      "src/context/CurrentUserContext.tsx",
      "src/lib/types.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
];

export default eslintConfig;
