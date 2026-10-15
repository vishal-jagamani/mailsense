import eslint from '@eslint/js';
import unusedImports from 'eslint-plugin-unused-imports';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
    {
        ignores: ['dist/**', 'coverage/**', 'node_modules/**', '.pnpm-store/**'],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['src/**/*.ts'],
        plugins: {
            'unused-imports': unusedImports,
        },
        rules: {
            semi: 'off',
            quotes: ['error', 'single', { allowTemplateLiterals: true }],
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'error',
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'error',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                },
            ],
            // Code Size Guardrails
            'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
            'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
            'max-params': ['warn', { max: 6 }],
            'max-depth': ['warn', { max: 4 }],
            complexity: ['warn', { max: 10 }],
            'no-console': 'error',

            // Global AST Constraints
            'no-restricted-syntax': [
                'error',
                {
                    selector: "TSTypeReference[typeName.name='unknown']",
                    message: 'Use explicit TypeScript types, interfaces, or generics instead of unknown.',
                },
                {
                    selector: "TSTypeReference[typeName.name='never']",
                    message: 'The never type is forbidden unless used in exhaustive switch checks.',
                },
                {
                    selector: 'CatchClause[body.body.length=0]',
                    message: 'Empty catch blocks are strictly forbidden. Log or rethrow errors.',
                },
            ],
        },
    },
    // Non-types source files: Strictly prohibit inline object types
    {
        files: ['src/**/*.ts'],
        ignores: [
            'src/**/*.types.ts',
            'src/**/*.interface.ts',
            'src/**/*.d.ts',
            'src/**/__tests__/**',
            'src/**/__mocks__/**',
            'src/**/*.test.ts',
            'src/**/*.spec.ts',
        ],
        rules: {
            'no-restricted-syntax': [
                'error',
                {
                    selector: "TSTypeReference[typeName.name='unknown']",
                    message: 'Use explicit TypeScript types, interfaces, or generics instead of unknown.',
                },
                {
                    selector: "TSTypeReference[typeName.name='never']",
                    message: 'The never type is forbidden unless used in exhaustive switch checks.',
                },
                {
                    selector: 'CatchClause[body.body.length=0]',
                    message: 'Empty catch blocks are strictly forbidden. Log or rethrow errors.',
                },
                {
                    selector: 'TSTypeLiteral',
                    message: 'Inline object types are strictly forbidden. Define named interfaces in dedicated types files.',
                },
            ],
        },
    },
    // Unit tests overrides
    {
        files: [
            'src/**/__tests__/**/*.ts',
            'src/**/__mocks__/**/*.ts',
            'src/**/*.test.ts',
            'src/**/*.spec.ts',
        ],
        rules: {
            'max-lines': 'off',
            'max-lines-per-function': 'off',
            'max-params': 'off',
            'max-depth': 'off',
            complexity: 'off',
            'no-console': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'no-restricted-syntax': 'off',
        },
    },
);
