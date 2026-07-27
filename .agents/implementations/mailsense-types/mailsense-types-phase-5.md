# Phase 5 Implementation Guide: Build, Type Verification & Initial NPM Release (`v1.0.0`)

## Overview

This document details the exact execution steps, verification procedures, Git release tagging commands, and NPM publishing instructions for **Phase 5: Build, Type Verification & Initial NPM Release (`v1.0.0`)** of the `@vishaljagamani/mailsense-types` library.

---

## 1. Pre-Release Build & Type Verification Steps

Execute all terminal commands from the root directory of the `mailsense-types` repository.

### Step 1.1: Run Type Checking
Validate that TypeScript compiles with 0 errors across all module files:

```bash
pnpm type-check
```

*Expected Output*: Exit code `0` with no compilation errors.

### Step 1.2: Execute `tsup` Build
Compile dual ESM and CJS bundles alongside TypeScript declaration files:

```bash
pnpm build
```

*Expected Output*: `tsup` reports success for all 9 entry points (`src/index.ts` + 8 submodules).

### Step 1.3: Verify Output Directory `dist/` Structure
Inspect the `dist/` directory to verify all subpath bundles exist:

```bash
ls -la dist/
```

**Verification Table of Generated Output Artifacts**:

| Subpath Export | ESM File | CJS File | Declaration File |
| :--- | :--- | :--- | :--- |
| Root (`.`) | `dist/index.js` | `dist/index.cjs` | `dist/index.d.ts` |
| `./common` | `dist/common/index.js` | `dist/common/index.cjs` | `dist/common/index.d.ts` |
| `./accounts` | `dist/accounts/index.js` | `dist/accounts/index.cjs` | `dist/accounts/index.d.ts` |
| `./emails` | `dist/emails/index.js` | `dist/emails/index.cjs` | `dist/emails/index.d.ts` |
| `./folders` | `dist/folders/index.js` | `dist/folders/index.cjs` | `dist/folders/index.d.ts` |
| `./user` | `dist/user/index.js` | `dist/user/index.cjs` | `dist/user/index.d.ts` |
| `./providers` | `dist/providers/index.js` | `dist/providers/index.cjs` | `dist/providers/index.d.ts` |
| `./events` | `dist/events/index.js` | `dist/events/index.cjs` | `dist/events/index.d.ts` |
| `./workers` | `dist/workers/index.js` | `dist/workers/index.cjs` | `dist/workers/index.d.ts` |

---

## 2. Git Branch Merge & Tagging Procedure

Follow standard release practices to merge `develop` into `main`, create a backup snapshot branch, and apply the `v1.0.0` release tag.

```bash
# 1. Ensure all changes are committed on develop
git checkout develop
git add .
git commit -m "feat: complete common types library modules and export barrels"

# 2. Push develop branch to GitHub
git push origin develop

# 3. Switch to main branch and merge develop
git checkout main
git merge develop
git push origin main

# 4. Create release tag v1.0.0
git tag -a v1.0.0 -m "release: v1.0.0 initial release of @vishaljagamani/mailsense-types"
git push origin v1.0.0

# 5. Create snapshot backup branch for milestone safety
git checkout -b backup/v1.0.0-snapshot
git push origin backup/v1.0.0-snapshot

# 6. Return to develop branch for future work
git checkout develop
```

---

## 3. NPM Publication Procedure

### Option A: Automated Release via GitHub Actions (Recommended)
Once tag `v1.0.0` is pushed to GitHub, `.github/workflows/publish.yml` triggers automatically:
1. Ensure your NPM Access Token is configured in GitHub repository secrets: `NPM_TOKEN`.
2. Monitor the GitHub Actions tab for clean publish completion.

### Option B: Manual NPM Publication (Fallback)
If publishing manually from the terminal:

```bash
# 1. Log in to NPM (if not already authenticated)
npm login

# 2. Perform dry run to verify tarball contents
npm publish --dry-run --access public

# 3. Publish to public NPM registry
npm publish --access public
```

---

## 4. Post-Publish Registry Verification

Verify that the package is published and available on the public NPM registry:

```bash
# Check published package details on NPM
npm view @vishaljagamani/mailsense-types
```

*Expected Output*: Shows version `1.0.0`, published files, and exported modules.

---

## 5. Phase 5 Verification Checklist

- [ ] `pnpm type-check` returns 0 errors.
- [ ] `pnpm build` generates all 9 ESM, CJS, and `.d.ts` entry points in `dist/`.
- [ ] Branch `develop` merged cleanly into `main`.
- [ ] Tag `v1.0.0` pushed to GitHub.
- [ ] Backup branch `backup/v1.0.0-snapshot` pushed to GitHub.
- [ ] Package published to NPM public registry (`@vishaljagamani/mailsense-types@1.0.0`).
- [ ] `npm view @vishaljagamani/mailsense-types` confirms version `1.0.0`.
