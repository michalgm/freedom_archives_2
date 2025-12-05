import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import { defineConfig } from 'eslint/config'
import compat from 'eslint-plugin-compat'
import importPlugin from 'eslint-plugin-import'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import storybook from 'eslint-plugin-storybook'
import globals from 'globals'
// const __filename = fileURLToPath(import.meta.url);what about this war
// const __dirname = path.dirname(__filename);
// const compat = new FlatCompat({
//     baseDirectory: __dirname,
//     recommendedConfig: js.configs.recommended,
//     allConfig: js.configs.all
// });

const eslintConfig = [
  ...storybook.configs['flat/recommended'],
  // stylistic.configs.customize({
  //   // the following options are the default values
  //   indent: 2,
  //   // quotes: '',
  //   semi: true,
  //   jsx: true,
  //   // ...
  // }),
  // stylistic.configs.recommended,
  {
    name: 'recommended',
    ignores: ['sharp-libvips', 'frontend/dist/**/*'],
    ...js.configs.recommended,
    ...importPlugin.flatConfigs.recommended,
    plugins: {
      "import": importPlugin,
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/quotes': 'off',
      '@stylistic/semi': 'off',
      '@stylistic/array-element-newline': ['warn', 'consistent'],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/comma-dangle': ['warn', 'always-multiline'],
      'import/order': [
        'error',
        {
          'groups': [['builtin', 'external'], 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          'alphabetize': { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',
      'import/newline-after-import': 'error',
      'no-unused-vars': [
        'warn',
        {
          caughtErrors: 'none',
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],

    },
  },
  {
    ...js.configs.recommended,
    name: 'backend',
    files: ['backend/*.{js,mjs,cjs}', 'backend/**/*.{js,mjs,cjs}', 'test/**/*.js'],
    plugins: {
      js,
      import: importPlugin,
      stylistic,
    },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha,
      },

      ecmaVersion: 2022,
      sourceType: 'module',
    },

    rules: {
      ...js.configs.recommended.rules,
      'indent': ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'semi': ['error', 'always'],
      'no-undef': 'warn',
    },
  },
  {
    ...compat.configs['flat/recommended'],
    ...reactPlugin.configs.flat.recommended,
    ...reactPlugin.configs.flat['jsx-runtime'],
    ...reactHooks.configs['recommended-latest'],
    name: 'frontend',
    files: ['frontend/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.mocha,
        logger: 'readonly',
      },
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: 'module',
        project: './frontend/tsconfig.json', // Add this line
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react': reactPlugin,
      'import': importPlugin,
      '@typescript-eslint': tseslint,
      'compat': compat,
    },
    ignores: ['frontend/dist/**/*', 'frontend/public/**/*'],

    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/no-object-type-as-default-prop': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
      'prefer-const': 'error',
      'react/no-array-index-key': 'warn',
      'react/no-danger': 'warn',
      'react/jsx-key': 'error',
      'import/no-unresolved': 'off',
      'import/named': 'error',
      'import/default': 'error',
      'import/no-named-as-default': 'warn',
      'no-undef': 'error',
      'no-unused-vars': 'off',
      // "padding-line-between-statements": [
      //     "error",
      //     { blankLine: "always", prev: ["multiline-const", "multiline-let", "export", "function"], next: ["multiline-const", "multiline-let", "export", "function"] },
      // ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'compat/compat': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
      lintAllEsApis: true,
    },
  },
  // {
  //     name: "typescript",
  //     files: ["frontend/**/*.{ts,tsx}"],
  //     languageOptions: {
  //         parser: tsParser,
  //         parserOptions: {
  //             project: './frontend/tsconfig.json',
  //         },
  //     },
  //     plugins: {
  //         "@typescript-eslint": tseslint,
  //     },
  //     rules: {
  //         // TypeScript-specific rules
  //         "@typescript-eslint/no-explicit-any": "warn",
  //         "@typescript-eslint/explicit-function-return-type": "off",
  //         "@typescript-eslint/explicit-module-boundary-types": "off",
  //     },
  // },
  reactRefresh.configs.vite,
]

// "no-unused-vars": ["warn", { "ignoreRestSiblings": true }],
// {
//     "env": {
//         "es6": true,
//             "node": true,
//                 "mocha": true
//     },
//     "parserOptions": {
//         "ecmaVersion": 2021
//     },
//     "extends": "eslint:recommended",
//         "rules": {
//         "indent": ["error", 2],
//             "linebreak-style": ["error", "unix"],
//                 "semi": ["error", "always"]
//     }
// }

//   "eslintConfig": {
//     "env": {
//       "browser": true,
//       "es2021": true
//     },
//     "extends": [
//       "eslint:recommended",
//       "plugin:react/recommended",
//       "plugin:react-hooks/recommended"
//     ],
//     "plugins": [
//       "react",
//       "react-hooks"
//     ],
//     "rules": {
//       "indent": "off",
//       "react/prop-types": "off"
//     },
//     "parserOptions": {
//       "sourceType": "module"
//     }
//   },
//   "eslintConfig": {
//     "env": {
//       "browser": true,
//       "es2021": true
//     },
//     "extends": [
//       "eslint:recommended",
//       "plugin:react/recommended",
//       "plugin:react-hooks/recommended"
//     ],
//     "plugins": [
//       "react",
//       "react-hooks"
//     ],
//     "rules": {
//       "indent": "off",
//       "react/prop-types": "off"
//     },
//     "parserOptions": {
//       "sourceType": "module"
//     }
//   },

// import js from "@eslint/js";
// import globals from "globals";
// import json from "@eslint/json";
// import { defineConfig } from "eslint/config";

// export default defineConfig([
//     { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"] },
//     { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser } },
//     { files: ["**/*.json"], plugins: { json }, language: "json/json", extends: ["json/recommended"] },
//     { files: ["**/*.jsonc"], plugins: { json }, language: "json/jsonc", extends: ["json/recommended"] },
// ]);
export default defineConfig(eslintConfig)
