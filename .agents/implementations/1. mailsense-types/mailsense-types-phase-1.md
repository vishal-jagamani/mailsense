# Phase 1 Implementation Guide: `@vishaljagamani/mailsense-types` Repository Setup & Infrastructure

## Overview

This document provides the exact file definitions, configuration specs, and execution steps for **Phase 1: Repository Setup & Infrastructure Configuration** of the `@vishaljagamani/mailsense-types` library.

---

## 1. Repository Initial Files Specification

### 1.1 `package.json`
Location: `mailsense-types/package.json`

```json
{
  "name": "@vishaljagamani/mailsense-types",
  "version": "1.0.0",
  "description": "Official TypeScript constants, enums, interfaces, and DTO definitions for MailSense services",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "dist"
  ],
  "publishConfig": {
    "access": "public"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./common": {
      "types": "./dist/common/index.d.ts",
      "import": "./dist/common/index.js",
      "require": "./dist/common/index.cjs"
    },
    "./accounts": {
      "types": "./dist/accounts/index.d.ts",
      "import": "./dist/accounts/index.js",
      "require": "./dist/accounts/index.cjs"
    },
    "./emails": {
      "types": "./dist/emails/index.d.ts",
      "import": "./dist/emails/index.js",
      "require": "./dist/emails/index.cjs"
    },
    "./folders": {
      "types": "./dist/folders/index.d.ts",
      "import": "./dist/folders/index.js",
      "require": "./dist/folders/index.cjs"
    },
    "./user": {
      "types": "./dist/user/index.d.ts",
      "import": "./dist/user/index.js",
      "require": "./dist/user/index.cjs"
    },
    "./providers": {
      "types": "./dist/providers/index.d.ts",
      "import": "./dist/providers/index.js",
      "require": "./dist/providers/index.cjs"
    },
    "./events": {
      "types": "./dist/events/index.d.ts",
      "import": "./dist/events/index.js",
      "require": "./dist/events/index.cjs"
    },
    "./workers": {
      "types": "./dist/workers/index.d.ts",
      "import": "./dist/workers/index.js",
      "require": "./dist/workers/index.cjs"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "type-check": "tsc --noEmit",
    "lint": "eslint src",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "mailsense",
    "typescript",
    "types",
    "enums",
    "interfaces",
    "email"
  ],
  "author": "Vishal Jagamani",
  "license": "MIT",
  "devDependencies": {
    "tsup": "^8.3.6",
    "typescript": "^5.9.3"
  }
}
```

---

### 1.2 `tsconfig.json`
Location: `mailsense-types/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

### 1.3 `tsup.config.ts`
Location: `mailsense-types/tsup.config.ts`

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/common/index.ts',
    'src/accounts/index.ts',
    'src/emails/index.ts',
    'src/folders/index.ts',
    'src/user/index.ts',
    'src/providers/index.ts',
    'src/events/index.ts',
    'src/workers/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
});
```

---

### 1.4 `.gitignore`
Location: `mailsense-types/.gitignore`

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build Output
dist/
*.tsbuildinfo

# Environment & Local Configuration
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# OS Files
.DS_Store
Thumbs.db

# IDE Files
.vscode/*
!.vscode/extensions.json
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

---

### 1.5 `.npmignore`
Location: `mailsense-types/.npmignore`

```npmignore
# Source files (only publish compiled dist)
src/
.github/
.vscode/

# Config files
tsconfig.json
tsup.config.ts
.eslintrc*
.prettierrc*

# Logs & temp files
*.log
.DS_Store
```

---

## 2. CI/CD GitHub Actions Workflows

### 2.1 NPM Publishing Workflow (`.github/workflows/publish.yml`)
Location: `mailsense-types/.github/workflows/publish.yml`

```yaml
name: Publish Package to NPM

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install Dependencies
        run: npm ci

      - name: Run Type Check
        run: npm run type-check

      - name: Build Package
        run: npm run build

      - name: Publish to NPM
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

### 2.2 CI Pull Request Check Workflow (`.github/workflows/build-test.yml`)
Location: `mailsense-types/.github/workflows/build-test.yml`

```yaml
name: CI Build & Type Check

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Dependencies
        run: npm ci

      - name: Run Type Check
        run: npm run type-check

      - name: Build Package
        run: npm run build
```

---

## 3. Git Branching & Backup Setup Commands

Execute the following shell commands inside the `mailsense-types` repository directory to establish your Git workflow:

```bash
# 1. Ensure on main branch
git checkout -b main

# 2. Add initial files & commit
git add .
git commit -m "chore: initialize repository setup with tsup bundler and package configs"

# 3. Create initial integration branch
git checkout -b develop

# 4. Create initial snapshot backup branch
git checkout -b backup/v1.0.0-initial

# 5. Return to develop branch for ongoing feature implementation
git checkout develop
```

---

## 4. Phase 1 Verification Checklist

- [ ] `package.json` contains `@vishaljagamani/mailsense-types` name with `"type": "module"` and `publishConfig`.
- [ ] `package.json` `"exports"` maps root (`.`) and all 8 subpaths (`./common`, `./accounts`, `./emails`, `./folders`, `./user`, `./providers`, `./events`, `./workers`).
- [ ] `tsconfig.json` has `strict: true` and `declaration: true`.
- [ ] `tsup.config.ts` has all 9 entry points (`src/index.ts` + 8 submodule `index.ts` files).
- [ ] `.gitignore` and `.npmignore` correctly filter non-essential files.
- [ ] GitHub Actions workflows `.github/workflows/publish.yml` and `build-test.yml` are created.
- [ ] Git branches (`main`, `develop`, `backup/v1.0.0-initial`) are initialized.
