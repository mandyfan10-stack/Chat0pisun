// @ts-check
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const globals = require('globals');

module.exports = tseslint.config(
  // TypeScript source files
  {
    files: ['src/**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      // redis.ts uses require() for conditional ioredis-mock swap in tests
      '@typescript-eslint/no-require-imports': ['error', { allow: ['ioredis-mock'] }],
    },
  },
  // CJS test helpers — plain Node.js globals, no TS rules
  {
    files: ['src/test/**/*.cjs', 'scripts/**/*.cjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
);
