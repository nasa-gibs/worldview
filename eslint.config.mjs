// import path from 'node:path';
// import { fileURLToPath } from 'node:url';
// import { defineConfig, globalIgnores } from 'eslint/config';
// import { FlatCompat } from '@eslint/eslintrc';
// import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import babelParser from '@babel/eslint-parser';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import jest from 'eslint-plugin-jest';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import neostandard from 'neostandard';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const compat = new FlatCompat({
//   baseDirectory: __dirname,
//   recommendedConfig: js.configs.recommended,
//   allConfig: js.configs.all,
// });

export default [
  ...neostandard({
    ignores: [
      '**/node_modules/**',
      '**/build/**',
      '**/dist/**',
      '**/coverage/**',
      '**/reports/**',
      'e2e/reports/**',
      'web/build/**',
      'web/dist/**',
      'web/ext/**',
      'web/js/lib/**',
    ],
    semi: true
  }),
  {
    files: ['**/*.{js,mjs}'],
    plugins: { import: importPlugin },
    // extends: [
    //   js.configs.recommended,
    //   ...compat.extends('plugin:n/recommended'),
    // ],
    rules: {
      'new-cap': ['error', {}],
      camelcase: ['error', { ignoreDestructuring: true, properties: 'never' }],

      'no-async-promise-executor': 'warn',
      'n/no-path-concat': 'warn',
      'n/no-deprecated-api': 'warn',
      'n/no-unpublished-require': 'off',
      'n/no-unpublished-import': 'off',
      'n/no-extraneous-import': 'off',
    },
  },

  // CommonJS-only areas (configs/scripts/tests)
  {
    files: [
      '**/*.cjs',
      '**/*.config.js',
      '**/webpack*.js',
      '**/jest*.js',
      '**/scripts/**/*.js',
      '**/tasks/**/*.js',
      '**/*.spec.js',
    ],
    plugins: {
      stylistic
    },
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      '@stylistic/semi': 'off',
    }
  },
  {
    files: ['web/**/*.js'],
    plugins: {
      import: importPlugin,
      jest,
      'jsx-a11y': jsxA11y,
      react,
      stylistic
    },
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      parser: babelParser,
      globals: {
        ...globals.browser,
        ...jest.environments.globals.globals,
      },
      parserOptions: {
        requireConfigFile: false,
        ecmaFeatures: { jsx: true },
        babelOptions: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
        },
      },
    },
    settings: {
      react: { version: 'detect' },
      'import/core-modules': [
        '@edsc/earthdata-react-icons/horizon-design-system/earthdata/ui',
        '@edsc/earthdata-react-icons/horizon-design-system/hds/ui',
      ],
      'import/resolver': {
        node: { extensions: ['.js', '.json'] },
      },
    },
    rules: {
      camelcase: ['error', {
        allow: ['^UNSAFE_'],
        properties: 'never'
      }],
      'max-len': ['error', {
        code: 100,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true
      }],
      'no-multiple-empty-lines': 'off',
      'no-promise-executor-return': 'error',
      'no-restricted-globals': ['error', 'localStorage', 'sessionStorage'],
      'no-unused-vars': ['error', { vars: 'all', args: 'none' }],
      'no-useless-call': 'error',
      'no-underscore-dangle': 'error',
      'prefer-regex-literals': 'error',
      'space-before-function-paren': 'off',

      'n/no-unsupported-features/node-builtins': 'off',

      'import/no-extraneous-dependencies': ['error', {
        devDependencies: ['**/*test.js', '**/*config.js', '**/*conf.js'],
      }],
      'import/extensions': 'off',
      'import/no-cycle': 'warn',

      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/alt-text': 'off',
      'jsx-a11y/anchor-has-content': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/control-has-associated-label': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/mouse-events-have-key-events': 'off',
      'jsx-a11y/no-noninteractive-tabindex': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'jsx-a11y/img-redundant-alt': 'error',

      'react/jsx-boolean-value': 'error',
      'react/jsx-closing-bracket-location': 'error',
      'react/jsx-filename-extension': 'off',
      'react/jsx-no-bind': ['error', { allowFunctions: true, allowArrowFunctions: true }],
      'react/jsx-no-useless-fragment': 'error',
      'react/jsx-pascal-case': 'error',
      'react/jsx-props-no-spreading': 'error',
      'react/jsx-tag-spacing': 'error',
      'react/jsx-uses-vars': 'error',
      'react/jsx-wrap-multilines': 'error',
      'react/no-unknown-property': 'error',
      'react/no-unstable-nested-components': 'error',
      'react/no-unused-class-component-methods': 'error',
      'react/no-unused-prop-types': 'error',
      'react/prop-types': 'error',
      'react/require-default-props': 'off',
      'react/self-closing-comp': 'error',
      'react/sort-comp': 'error',

      '@stylistic/array-bracket-spacing': 'error',
      '@stylistic/comma-style': 'error',
      '@stylistic/eol-last': 'error',
      '@stylistic/indent': ['error', 2],
      '@stylistic/jsx-quotes': 'error',
      '@stylistic/keyword-spacing': 'error',
      '@stylistic/newline-per-chained-call': 'error',
      '@stylistic/no-multi-spaces': 'error',
      '@stylistic/object-curly-spacing': 'off',
      '@stylistic/semi': 'error',
      '@stylistic/space-before-blocks': 'error',
      '@stylistic/space-before-function-paren': 'off',
      '@stylistic/space-infix-ops': 'error',
      '@stylistic/space-in-parens': 'error',
      '@stylistic/no-trailing-spaces': 'error',
    },
  }
];
