import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import unusedImports from 'eslint-plugin-unused-imports';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    {
        ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
    },
    ...compat.extends('next/core-web-vitals', 'next/typescript'),
    // 1. Global Baseline Rules for all TypeScript / TSX files
    {
        files: ['src/**/*.{ts,tsx}'],
        plugins: {
            'unused-imports': unusedImports,
        },
        rules: {
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
            'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
            'max-params': ['warn', { max: 6 }],
            'max-depth': ['warn', { max: 4 }],
            // complexity: ['warn', { max: 10 }],
            'no-console': ['error', { allow: ['warn', 'error'] }],
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'off', // temporarily disabled locally
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

    // 2. General TypeScript Functions & Methods (Utilities, Services, API Clients, Libs)
    // Coding Standards: Preferred ≤30 lines, Refactoring Trigger >30, Hard Limit 50 lines
    {
        files: ['src/**/*.ts'],
        ignores: [
            'src/**/hooks/**',
            'src/**/use*.ts',
            'src/**/*.queries.ts',
            'src/**/*.types.ts',
            'src/**/*.interface.ts',
            'src/**/*.d.ts',
            'src/shared/ui/**',
            'src/**/__tests__/**',
            'src/**/__mocks__/**',
            'src/**/*.test.ts',
            'src/**/*.spec.ts',
        ],
        rules: {
            'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true, IIFEs: true }],
        },
    },

    // 3. React UI Components (*.tsx files)
    // Coding Standards: Preferred ≤150 lines, Refactoring Trigger >150, Hard Limit 200 lines
    {
        files: ['src/**/*.tsx', 'src/**/components/**/*.{ts,tsx}'],
        ignores: [
            'src/app/**',
            'src/**/pages/**',
            'src/**/hooks/**',
            'src/shared/ui/**',
            'src/**/__tests__/**',
            'src/**/__mocks__/**',
            'src/**/*.test.{ts,tsx}',
            'src/**/*.spec.{ts,tsx}',
        ],
        rules: {
            'max-lines': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
            'max-lines-per-function': ['warn', { max: 200, skipBlankLines: true, skipComments: true, IIFEs: true }],
        },
    },

    // 4. Page Components (Next.js App Router Pages & Feature Views)
    // Coding Standards: Preferred ≤180 lines, Refactoring Trigger >180, Hard Limit 250 lines
    {
        files: ['src/app/**/*.{ts,tsx}', 'src/**/pages/**/*.{ts,tsx}'],
        ignores: ['src/shared/ui/**', 'src/**/__tests__/**', 'src/**/__mocks__/**', 'src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
        rules: {
            'max-lines': ['warn', { max: 250, skipBlankLines: true, skipComments: true }],
            'max-lines-per-function': ['warn', { max: 250, skipBlankLines: true, skipComments: true, IIFEs: true }],
        },
    },

    // 5. Custom Hooks
    // Coding Standards: Preferred ≤80 lines, Refactoring Trigger >80, Hard Limit 120 lines
    {
        files: ['src/**/hooks/**/*.{ts,tsx}', 'src/**/use*.{ts,tsx}'],
        ignores: ['src/shared/ui/**', 'src/**/__tests__/**', 'src/**/__mocks__/**', 'src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
        rules: {
            'max-lines': ['warn', { max: 150, skipBlankLines: true, skipComments: true }],
            'max-lines-per-function': ['warn', { max: 120, skipBlankLines: true, skipComments: true, IIFEs: true }],
        },
    },

    // 6. React Query Files
    // Coding Standards: Preferred ≤120 lines, Refactoring Trigger >120, Hard Limit 180 lines
    {
        files: ['src/**/*.queries.ts'],
        rules: {
            'max-lines': ['warn', { max: 180, skipBlankLines: true, skipComments: true }],
        },
    },

    // 7. Non-types source files: Strictly prohibit type declarations and inline object types
    {
        files: ['src/**/*.{ts,tsx}'],
        ignores: [
            'src/**/*.types.ts',
            'src/**/*.interface.ts',
            'src/**/*.d.ts',
            'src/**/types/**',
            'src/**/interfaces/**',
            'src/**/__tests__/**',
            'src/**/__mocks__/**',
            'src/**/*.test.{ts,tsx}',
            'src/**/*.spec.{ts,tsx}',
            'src/shared/ui/**',
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
                    selector: 'TSInterfaceDeclaration',
                    message:
                        'Interface declarations are forbidden in source files. Declare named interfaces exclusively in dedicated types files (*.types.ts, *.interface.ts, or types/ directory).',
                },
                {
                    selector: 'TSTypeAliasDeclaration',
                    message:
                        'Type alias declarations are forbidden in source files. Declare named types exclusively in dedicated types files (*.types.ts, *.interface.ts, or types/ directory).',
                },
                {
                    selector: 'TSEnumDeclaration',
                    message:
                        'Enum declarations are forbidden in source files. Declare enums exclusively in dedicated types files (*.types.ts, *.interface.ts, or types/ directory).',
                },
                {
                    selector: 'TSTypeLiteral',
                    message: 'Inline object types are strictly forbidden. Define named interfaces in dedicated types files.',
                },
            ],
        },
    },

    // 8. Vendored / Third-Party Design System Primitives (shadcn/ui, Radix UI)
    {
        files: ['src/shared/ui/**/*.{ts,tsx}'],
        rules: {
            'max-lines': 'off',
            'max-lines-per-function': 'off',
            complexity: 'off',
            'max-depth': 'off',
            'max-params': 'off',
        },
    },

    // 9. Unit Tests & Mocks
    {
        files: ['src/**/__tests__/**/*.{ts,tsx}', 'src/**/__mocks__/**/*.{ts,tsx}', 'src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
        rules: {
            'max-lines': 'off',
            'max-lines-per-function': 'off',
            'max-params': 'off',
            'max-depth': 'off',
            complexity: 'off',
            'no-console': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'no-restricted-syntax': 'off',
            'unused-imports/no-unused-imports': 'off',
            'unused-imports/no-unused-vars': 'off',
        },
    },
];

export default eslintConfig;
