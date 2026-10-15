import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

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
    {
        files: ['src/**/*.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'error',
            'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
            'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
            'max-params': ['warn', { max: 6 }],
            'max-depth': ['warn', { max: 4 }],
            complexity: ['warn', { max: 10 }],
            'no-console': ['error', { allow: ['warn', 'error'] }],
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
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
        files: ['src/**/*.{ts,tsx}'],
        ignores: [
            'src/**/*.types.ts',
            'src/**/*.interface.ts',
            'src/**/*.d.ts',
            'src/**/__tests__/**',
            'src/**/__mocks__/**',
            'src/**/*.test.{ts,tsx}',
            'src/**/*.spec.{ts,tsx}',
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
];

export default eslintConfig;
