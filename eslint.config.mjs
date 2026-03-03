import { defineConfig, globalIgnores } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import importPlugin from 'eslint-plugin-import'
import react from "eslint-plugin-react";
import globals from "globals";
import babelParser from "@babel/eslint-parser";
import jest from "eslint-plugin-jest";
import jsxA11y from 'eslint-plugin-jsx-a11y'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores([
    "build/*",
    "dist/*",
    "e2e/reports/*",
    "etc/*",
    "legacy/*",
    "lib/*",
    "options/*",
    "reports/*",
    "tasks/temp/*",
    "test/*",
    "web/build/*",
    "web/dist/*",
    "web/ext/*",
    "web/js/lib/*",
]), {
    plugins: {
        import: importPlugin
    },
    extends: compat.extends("plugin:n/recommended"),
    rules: {
        "new-cap": ["error", {}],

        camelcase: ["error", {
            ignoreDestructuring: true,
            properties: "never",
        }],

        "n/no-path-concat": "warn",
        "n/no-deprecated-api": "warn",
        "no-async-promise-executor": "warn",
        "n/no-unpublished-require": "off",
        "n/no-unpublished-import": "off",
        "n/no-extraneous-import": "off",
    },
}, {
    files: [
    '**/*.cjs',
    '**/*.config.js',
    '**/webpack*.js',
    '**/jest*.js',
    '**/scripts/**/*.js',
    '**/tasks/**/*.js',
    "**/*.spec.js"
    ],
    languageOptions: {
        sourceType: "commonjs",
        globals: {
           ...globals.node
        }
    }
}, {
    files: ["web/**/*.js"],
    plugins: {
        react,
        jest,
        import: importPlugin,
        'jsx-a11y': jsxA11y
    },
    extends: compat.extends("plugin:n/recommended"),
    languageOptions: {
        globals: {
            ...globals.browser,
            ...jest.environments.globals.globals,
        },

        parser: babelParser,
        ecmaVersion: "latest",
        sourceType: "module",

        parserOptions: {
            requireConfigFile: false,
            ecmaFeatures: {
                jsx: true,
            },
            babelOptions: {
                presets: [
                    '@babel/preset-react',
                    '@babel/preset-env',
                ],
            }
        },
    },

    settings: {
        react: {
            version: "detect",
        },
        "import/core-modules": [
            "@edsc/earthdata-react-icons/horizon-design-system/earthdata/ui",
            "@edsc/earthdata-react-icons/horizon-design-system/hds/ui",
        ],
        'import/resolver': {
            node: {
            extensions: ['.js', '.jsx', '.json']
            }
        }
    },

    rules: {
        "no-unused-vars": ["error", {
            vars: "all",
            args: "none",
        }],

        camelcase: ["error", {
            allow: ["^UNSAFE_"],
            properties: "never",
        }],
        "n/no-unpublished-require": "off",
        "n/no-unsupported-features/node-builtins": "off",
        "n/no-unpublished-require": "off",
        "n/no-unpublished-import": "off",
        "n/no-extraneous-import": "off",
        "no-useless-call": "error",
        "no-extra-parens": "error",
        "space-before-function-paren": "off",
        "import/extensions": "off",
        "no-multiple-empty-lines": "off",
        "import/no-extraneous-dependencies": ["error", {
            devDependencies: ["**/*test.js", "**/*config.js", "**/*conf.js"],
        }],

        'no-restricted-globals': ['error', 'localStorage', 'sessionStorage'],

        "max-len": [ "error", {"code": 120}],
        "no-underscore-dangle": "error",
        "import/no-cycle": "warn",
        "jsx-a11y/no-noninteractive-tabindex": "off",
        "jsx-a11y/no-noninteractive-element-interactions": "off",
        "jsx-a11y/anchor-has-content": "off",
        "jsx-a11y/control-has-associated-label": "off",
        "jsx-a11y/anchor-is-valid": "off",
        "jsx-a11y/label-has-associated-control": "off",
        "jsx-a11y/alt-text": "off",
        "jsx-a11y/mouse-events-have-key-events": "off",
        "jsx-a11y/click-events-have-key-events": "off",
        "react/jsx-props-no-spreading": "error",
        "react/jsx-filename-extension": "off",
        "react/jsx-no-bind": "error",

        "react/sort-comp": ["error", {
            order: ["static-methods", "lifecycle", "everything-else", "render"],

            groups: {
                lifecycle: [
                    "displayName",
                    "propTypes",
                    "contextTypes",
                    "childContextTypes",
                    "mixins",
                    "statics",
                    "defaultProps",
                    "constructor",
                    "getDefaultProps",
                    "state",
                    "getInitialState",
                    "getChildContext",
                    "getDerivedStateFromProps",
                    "componentWillMount",
                    "UNSAFE_componentWillMount",
                    "componentDidMount",
                    "componentWillReceiveProps",
                    "UNSAFE_componentWillReceiveProps",
                    "shouldComponentUpdate",
                    "componentWillUpdate",
                    "UNSAFE_componentWillUpdate",
                    "getSnapshotBeforeUpdate",
                    "componentDidUpdate",
                    "componentDidCatch",
                    "componentWillUnmount",
                ],
            },
        }],

        "react/require-default-props": "off",
        "react/no-unused-class-component-methods": "error",
        "react/no-unknown-property": "error",
        "react/jsx-no-useless-fragment": "error",
        "react/no-unstable-nested-components": "error",
        "react/prop-types": "error",
        "react/no-unused-prop-types": "error",
        "prefer-regex-literals": "error",
        "no-promise-executor-return": "error",
    },
}, {
    files: [
        "**/reducer.js",
        "**/reducer.test.js",
        "**/reducers.js",
        "**/reducers.test.js",
        "**/combine-reducers.js",
    ],
    rules: {
        "default-param-last": "warn",
    },
}, {
  files: ['web/js/app.js'],
  rules: {
    'import/no-cycle': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/no-unresolved': 'off',
    'import/named': 'off',
    'import/default': 'off',
    'import/namespace': 'off'
  }
}]);