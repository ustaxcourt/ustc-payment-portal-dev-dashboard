import js from '@eslint/js'
import react from 'eslint-plugin-react'
import spellcheck from 'eslint-plugin-spellcheck'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react,
      spellcheck,
    },
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
      'no-inline-comments': ['warn', { ignorePattern: '^\\s*eslint-disable' }],
      'react/jsx-tag-spacing': ['error', { beforeSelfClosing: 'always', afterOpening: 'never' }],
      'react/jsx-equals-spacing': ['error', 'never'],
      'react/jsx-curly-spacing': ['error', { when: 'never', children: true }],
      'spellcheck/spell-checker': [
        'warn',
        {
          comments: true,
          strings: false,
          identifiers: false,
          skipWords: ['metadata', 'tsx', 'ts', 'jsx', 'eslint', 'prettier', 'react', 'mui', 'dayjs'],
        },
      ],
    },
  },
])
