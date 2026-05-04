// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import angularPlugin from '@angular-eslint/eslint-plugin';
import angularTemplatePlugin from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';

const angularEslintOverride = {
  languageOptions: {
    parserOptions: {
      project: './tsconfig.app.json',
      sourceType: 'module',
      ecmaVersion: 'latest',
      ecmaFeatures: {
        jsx: true
      }
    }
  }
};

export default [
  // Global ignores
  {
    ignores: ['node_modules/**', 'dist/**', '.angular/**', '.next/**', 'scripts/**/*.mjs', 'scripts/**/*.js', 'scripts/**/*.py', 'scripts/**/*.sh']
  },

  // TypeScript configuration
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      ...angularEslintOverride.languageOptions
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      '@angular-eslint': angularPlugin
    },
    rules: {
      // Pattern 5: Ban CommonModule import
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@angular/common',
              importNames: ['CommonModule'],
              message: 'CommonModule should not be imported in standalone components. Use individual directives/pipes from @angular/common as needed.'
            }
          ]
        }
      ],

      // Pattern 7: Ban @Output() decorator
      'no-restricted-syntax': [
        'error',
        {
          selector: "PropertyDefinition > Decorator[expression.callee.name='Output']",
          message: "@Output() decorator is legacy; use output() signal function instead. Example: readonly save = output<Item>();"
        }
      ],

      // Pattern 1: Standalone only
      '@angular-eslint/prefer-standalone': ['error'],

      // Pattern 2: inject() over constructor DI
      '@angular-eslint/prefer-inject': ['error'],

      // Pattern 3: Signal inputs/outputs
      '@angular-eslint/prefer-signals': [
        'error',
        {
          preferInputSignals: true,
          preferQuerySignals: true,
          preferReadonlySignalProperties: true
        }
      ]
    }
  },

  // scripts/demo CLI tools (separate scripts/demo/tsconfig.json)
  // Baseline-only rule scope: Angular modernization rules disabled (no Angular code here).
  // Revisit if scripts/demo grows Angular-shaped.
  {
    files: ['scripts/demo/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './scripts/demo/tsconfig.json',
        sourceType: 'module',
        ecmaVersion: 'latest'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      '@angular-eslint': angularPlugin
    },
    rules: {
      '@angular-eslint/prefer-standalone': 'off',
      '@angular-eslint/prefer-inject': 'off',
      '@angular-eslint/prefer-signals': 'off'
    }
  },

  // Spec-specific configuration (separate tsconfig.spec.json)
  {
    files: ['**/*.spec.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.spec.json',
        sourceType: 'module',
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      '@angular-eslint': angularPlugin
    },
    rules: {
      '@angular-eslint/prefer-standalone': 'off'
    }
  },

  // Template files
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: angularTemplateParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest'
      }
    },
    plugins: {
      '@angular-eslint/template': angularTemplatePlugin
    },
    rules: {
      // Pattern 4: Control flow syntax
      '@angular-eslint/template/prefer-control-flow': ['error']
    }
  }
];
