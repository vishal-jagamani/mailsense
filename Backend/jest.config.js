import { createDefaultPreset } from 'ts-jest';

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    clearMocks: true,
    transform: {
        ...tsJestTransformCfg,
    },
    moduleDirectories: ['node_modules', 'src'],
    moduleNameMapper: {
        '^@config$': '<rootDir>/src/core/config/index.ts',
        '^@constants$': '<rootDir>/src/core/constants/index.ts',
        '^@errors$': '<rootDir>/src/core/errors/index.ts',
        '^@middlewares$': '<rootDir>/src/middlewares/index.ts',
        '^@modules/(.*)\\.js$': '<rootDir>/src/modules/$1',
        '^@modules/(.*)$': '<rootDir>/src/modules/$1',
        '^@integrations/(.*)\\.js$': '<rootDir>/src/integrations/$1',
        '^@integrations/(.*)$': '<rootDir>/src/integrations/$1',
        '^@routes/(.*)\\.js$': '<rootDir>/src/routes/$1',
        '^@routes/(.*)$': '<rootDir>/src/routes/$1',
        '^@types$': '<rootDir>/src/core/types/index.ts',
        '^@utils$': '<rootDir>/src/shared/utils/index.ts',
        '^(core|integrations|middlewares|modules|shared)/(.*)\\.js$': '<rootDir>/src/$1/$2',
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
};
