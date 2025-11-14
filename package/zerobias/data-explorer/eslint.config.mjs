import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", 'eslint:recommended'),
  {
    rules: {
      // Disable React undefined errors (Next.js uses automatic JSX transform)
      'no-undef': 'off',
      // Allow 'any' types (this is a practical app, not a type-safety showcase)
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow unused vars starting with _ (common pattern)
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Allow unescaped entities in JSX (quotes, apostrophes)
      'react/no-unescaped-entities': 'off',
    }
  }
];

export default eslintConfig;
