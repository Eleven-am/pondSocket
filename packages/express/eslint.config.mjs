import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import stylisticEslintPluginTs from '@stylistic/eslint-plugin-ts';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import fileProgress from 'eslint-plugin-file-progress';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [
    {
        ignores: [],
    }, ...fixupConfigRules(compat.extends(
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
    )), {
        plugins: {
            '@typescript-eslint': fixupPluginRules(typescriptEslint),
            '@stylistic/ts': stylisticEslintPluginTs,
            'file-progress': fileProgress,
        },

        languageOptions: {
            globals: {
                ...globals.node,
            },

            parser: tsParser,
            ecmaVersion: 12,
            sourceType: 'module',

            parserOptions: {
                project: './tsconfig.json',
            },
        },

        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.ts'],
                },
            },

            progress: {
                hide: false,
                successMessage: 'ESLint finished',
            },
        },

        rules: {
            'file-progress/activate': 1,
            '@typescript-eslint/ban-types': 'off',

            '@stylistic/ts/type-annotation-spacing': [
                'error', {
                    before: true,
                    after: true,

                    overrides: {
                        colon: {
                            before: false,
                            after: true,
                        },
                    },
                },
            ],

            '@typescript-eslint/naming-convention': [
                'error', {
                    selector: 'interface',
                    format: ['PascalCase'],
                },
            ],

            '@stylistic/ts/member-delimiter-style': [
                'error', {
                    multiline: {
                        delimiter: 'semi',
                        requireLast: true,
                    },

                    singleline: {
                        delimiter: 'comma',
                        requireLast: false,
                    },
                },
            ],

            '@stylistic/ts/indent': ['error', 4],
            '@typescript-eslint/no-unused-vars': 'off',

            '@typescript-eslint/no-use-before-define': [
                'error', {
                    classes: true,
                    functions: true,
                    variables: true,
                },
            ],

            '@typescript-eslint/no-var-requires': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'accessor-pairs': 'error',
            'array-bracket-newline': 'error',
            'array-bracket-spacing': 'error',
            'array-callback-return': 'off',
            'array-element-newline': ['error', 'consistent'],
            'arrow-body-style': 'error',
            'arrow-parens': 'error',
            'arrow-spacing': 'error',
            'block-scoped-var': 'error',
            'block-spacing': 'error',
            'brace-style': 'error',
            'callback-return': 'error',
            'comma-dangle': ['error', 'always-multiline'],
            'comma-spacing': 'error',
            'comma-style': 'error',
            complexity: 'off',
            'computed-property-spacing': 'error',
            'consistent-this': 'error',
            curly: 'error',
            'default-case': 'error',
            'default-case-last': 'error',
            'default-param-last': 'error',
            'dot-location': ['error', 'property'],
            'dot-notation': 'off',
            'eol-last': 'error',
            eqeqeq: 'error',
            'func-call-spacing': 'error',
            'func-name-matching': 'error',
            'func-names': 'error',
            'function-call-argument-newline': ['error', 'consistent'],
            'function-paren-newline': ['error', 'consistent'],
            'generator-star-spacing': 'error',
            'global-require': 'warn',
            'grouped-accessor-pairs': 'error',
            'guard-for-in': 'error',
            'handle-callback-err': 'error',
            'id-blacklist': 'error',
            'id-denylist': 'error',

            'id-length': [
                'error', {
                    max: 50,
                    min: 1,
                },
            ],

            'id-match': 'error',
            'implicit-arrow-linebreak': 'error',
            'import/named': 'off',

            'import/no-cycle': [
                'warn', {
                    maxDepth: '∞',
                },
            ],

            'import/no-unresolved': 'off',

            'import/order': [
                'error', {
                    alphabetize: {
                        caseInsensitive: true,
                        order: 'asc',
                    },

                    groups: ['builtin', 'external', 'internal'],
                    'newlines-between': 'always',

                    pathGroups: [
                        {
                            group: 'external',
                            pattern: 'react',
                            position: 'before',
                        },
                    ],

                    pathGroupsExcludedImportTypes: ['react'],
                },
            ],

            'key-spacing': 'error',
            'keyword-spacing': 'error',
            'line-comment-position': 'error',
            'linebreak-style': 'off',

            'lines-around-comment': [
                'error', {
                    allowBlockStart: true,
                },
            ],

            'lines-around-directive': 'error',
            'lines-between-class-members': 'error',
            'max-nested-callbacks': 'error',
            'max-statements-per-line': 'error',
            'multiline-ternary': ['error', 'always-multiline'],
            'new-cap': 'off',
            'new-parens': 'error',
            'newline-after-var': 'error',
            'newline-before-return': 'error',
            'newline-per-chained-call': 'error',
            'no-alert': 'error',
            'no-array-constructor': 'error',
            'no-async-promise-executor': 'warn',
            'no-buffer-constructor': 'error',
            'no-caller': 'error',
            'no-case-declarations': 'warn',
            'no-catch-shadow': 'off',

            'no-console': [
                'warn', {
                    allow: ['warn', 'error'],
                },
            ],

            'no-constructor-return': 'error',
            'no-div-regex': 'error',
            'no-duplicate-imports': 'error',
            'no-else-return': 'error',
            'no-empty-function': 'off',
            'no-eq-null': 'error',
            'no-eval': 'error',
            'no-extend-native': 'error',
            'no-extra-bind': 'error',
            'no-extra-label': 'error',
            'no-floating-decimal': 'error',
            'no-implicit-coercion': 'error',
            'no-implicit-globals': 'error',
            'no-implied-eval': 'error',
            'no-inline-comments': 'error',
            'no-invalid-this': 'error',
            'no-iterator': 'error',
            'no-label-var': 'error',
            'no-labels': 'error',
            'no-lone-blocks': 'error',
            'no-lonely-if': 'error',
            'no-loop-func': 'error',
            'no-loss-of-precision': 'error',
            'no-mixed-requires': 'error',
            'no-multi-assign': 'error',
            'no-multi-spaces': 'error',
            'no-multi-str': 'error',
            'no-multiple-empty-lines': 'error',
            'no-native-reassign': 'error',
            'no-negated-in-lhs': 'error',
            'no-new-func': 'error',
            'no-new-object': 'error',
            'no-new-require': 'error',
            'no-new-wrappers': 'error',
            'no-octal-escape': 'error',
            'no-param-reassign': 'off',
            'no-path-concat': 'error',
            'no-plusplus': 'off',
            'no-process-exit': 'warn',
            'no-proto': 'error',
            'no-restricted-exports': 'error',
            'no-restricted-globals': 'error',
            'no-restricted-imports': 'error',
            'no-restricted-modules': 'error',
            'no-restricted-properties': 'error',
            'no-return-assign': 'off',
            'no-return-await': 'error',
            'no-script-url': 'error',
            'no-self-compare': 'error',
            'no-sequences': 'error',
            'no-spaced-func': 'error',
            'no-sync': 'off',
            'no-tabs': 'error',
            'no-template-curly-in-string': 'error',
            'no-ternary': 'off',
            'no-throw-literal': 'error',
            'no-trailing-spaces': 'error',
            'no-undef-init': 'error',
            'no-unmodified-loop-condition': 'error',
            'no-unneeded-ternary': 'error',
            'no-unreachable-loop': 'error',
            'no-unused-expressions': 'warn',
            'no-unused-vars': 'warn',
            'no-useless-backreference': 'error',
            'no-useless-call': 'error',
            'no-useless-computed-key': 'error',
            'no-useless-concat': 'error',
            'no-useless-constructor': 'off',
            'no-useless-escape': 'off',
            'no-useless-rename': 'error',
            'no-useless-return': 'error',
            'no-var': 'error',
            'no-void': 'off',

            'no-warning-comments': [
                1, {
                    terms: ['todo'],
                },
            ],

            'no-whitespace-before-property': 'error',
            'nonblock-statement-body-position': 'error',
            'object-curly-spacing': ['error', 'always'],
            'object-property-newline': 'error',
            'object-shorthand': 'error',
            'one-var': ['error', 'never'],
            'one-var-declaration-per-line': 'error',
            'operator-assignment': 'error',

            'operator-linebreak': [
                'error', 'after', {
                    overrides: {
                        ':': 'ignore',
                        '?': 'ignore',
                    },
                },
            ],

            'padded-blocks': ['error', 'never'],
            'padding-line-between-statements': 'error',
            'prefer-arrow-callback': 'error',
            'prefer-const': 'error',
            'prefer-exponentiation-operator': 'error',
            'prefer-named-capture-group': 'off',
            'prefer-numeric-literals': 'error',
            'prefer-object-spread': 'error',
            'prefer-promise-reject-errors': 'error',
            'prefer-regex-literals': 'error',
            'prefer-rest-params': 'error',
            'prefer-spread': 'error',
            'prefer-template': 'error',

            'quote-props': [
                'error', 'as-needed', {
                    keywords: true,
                    unnecessary: true,
                },
            ],

            quotes: ['error', 'single'],
            radix: 'error',
            'require-await': 'warn',
            'rest-spread-spacing': 'error',
            semi: 'error',
            'semi-spacing': 'error',
            'semi-style': 'error',

            'sort-imports': [
                'error', {
                    ignoreDeclarationSort: true,
                    ignoreMemberSort: true,
                },
            ],

            'sort-vars': 'error',
            'space-before-blocks': 'error',
            'space-before-function-paren': 'error',
            'space-in-parens': 'error',
            'space-infix-ops': 'error',
            'space-unary-ops': 'error',
            'spaced-comment': 'error',
            strict: 'error',
            'switch-colon-spacing': 'error',
            'symbol-description': 'error',
            'template-curly-spacing': 'error',
            'template-tag-spacing': 'error',
            'unicode-bom': 'error',
            'vars-on-top': 'error',
            'wrap-iife': 'error',
            'wrap-regex': 'error',
            'yield-star-spacing': 'error',
            yoda: 'error',
        },
    },
];
