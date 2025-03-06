import js from "@eslint/js";
import importPlugin from 'eslint-plugin-import';
import reactPlugin from "eslint-plugin-react";
import reactHooks from 'eslint-plugin-react-hooks';
import globals from "globals";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const compat = new FlatCompat({
//     baseDirectory: __dirname,
//     recommendedConfig: js.configs.recommended,
//     allConfig: js.configs.all
// });

export default [
    {
        name: "recommended",
        ignores: ["sharp-libvips", "frontend/dist/**/*"],
        ...js.configs.recommended,
        plugins: {
            'import': importPlugin
        },
        rules: {
            // "import/order": ["error", {
            //     "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
            //     "newlines-between": "always",
            //     "alphabetize": { "order": "asc", "caseInsensitive": true }
            // }],
            // "import/no-duplicates": "error"
        }
    },
    {
        name: "backend",
        files: ["backend/**/*.js", "test/**/*.js"],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.mocha,
            },

            ecmaVersion: 2021,
            sourceType: "commonjs",
        },

        rules: {
            indent: ["error", 2],
            "linebreak-style": ["error", "unix"],
            semi: ["error", "always"],
        },
    },
    {
        name: "frontend",
        files: ["frontend/**/*.{js,jsx}"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.mocha,
            },
            // ecmaVersion: 2021,
            // sourceType: "module",
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
                sourceType: 'module',
            },
        },
        plugins: { 'react-hooks': reactHooks, 'react': reactPlugin },
        ignores: ["frontend/dist/**/*"],
        rules: {
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
            "react/jsx-uses-react": "error",
            "react/jsx-uses-vars": "error",
            "no-console": ["warn", { "allow": ["warn", "error"] }],
            "no-unused-expressions": ["error", { "allowShortCircuit": true, "allowTernary": true }],
            "prefer-const": "error",
            "react/no-array-index-key": "warn",
            "react/no-danger": "warn",
            "react/jsx-key": "error",
            "no-unused-vars": ["warn", {
                "varsIgnorePattern": "^_",
                "argsIgnorePattern": "^_",
                "destructuredArrayIgnorePattern": "^_",
            }],
        }

    },
];

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
