# Workspaces (Guest Sites Slice 0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the builder to `apps/app` in a yarn workspaces repository. Users see no change.

**Architecture:** The repository root holds only the workspace manifest, the lockfile, the format config and the repository files. All app files move to `apps/app` with `git mv`. CI builds the same image with the same name from `apps/app`.

**Tech Stack:** Yarn 4.18.1 workspaces, Vite+ 1.0.0 (`vp`), TypeScript 7.0.2, GitHub Actions, Docker (nginx).

**Spec:** `docs/superpowers/specs/2026-11-26-guest-sites-design.md`. Read "Repository layout", "Routing and deploy" and slice 0 in "Delivery slices".

## Global Constraints

- Spec result for this slice: "The repository has `apps/app` and `packages/`. The builder works and deploys as before. No change for users."
- Do not change a file in `src/`. Move the files only.
- Do not add, remove or upgrade a dependency. In `yarn.lock`, only the two workspace entries change.
- The app workspace name is `@dearest/app`.
- `packages/` holds only `.gitkeep`. Slice 2 makes `packages/blocks`.
- Do not make `apps/sites`, a second image or a CI path filter. Slice 1 does that.
- The image name stays `ghcr.io/${{ github.repository }}`. The Dokploy app does not change.
- The content of `Dockerfile`, `nginx.conf` and `.dockerignore` does not change.
- Run `yarn fmt` before each commit. The pre-commit hook checks the format.
- Make one pull request for all tasks. The deploy does not work between Task 1 and Task 2, so do not merge a part.

## Facts from a trial run (2026-11-27)

A trial of this move ran in a scratch clone. These results are the expected results.

- `main` at `fbf507b` has 8 test files and 54 tests. All pass.
- The build output after the move is identical, byte for byte, to the build output before the move.
- `yarn install` runs the `postinstall` script of `apps/app`. The script makes the API client in `apps/app/src/api/generated/`.
- `yarn install` moves all packages to the root `node_modules/`.
- `yarn install` shows peer dependency warnings (`YN0060`, `YN0086`). The `vite` alias causes them. They are not a failure.
- An old untracked folder `src/api/generated/` at the root makes `yarn fmt:check` fail.

## Review Focus

1. **An old clone pulls the change.** The untracked `src/api/generated/` stays at the root. The old `.gitignore` line is gone, so the pre-commit hook fails. The README tells the developer to delete the folder. Check: Task 3, Steps 1 and 3.
2. **The deploy job runs only after the merge.** A wrong artifact path or Docker context breaks the production deploy, and a pull request does not show it. Check: Task 2, Steps 4 and 5, and "After the merge".
3. **A new clone, as in CI.** `yarn install --immutable` must make the API client in the new location with no manual step. Check: Task 3, Step 5.
4. **A root script passes but the app has an error.** `typecheck`, `test` and `build` must fail from the root if the app fails. Check: Task 1, Step 7.
5. **The dev server does not read the env files.** It must read `.env.development` from `apps/app` and send `/api` to the API. Check: Task 1, Step 8.

---

### Task 1: Move the app into `apps/app`

**Files:**

- Create: `apps/app/package.json`, `vite.config.ts` (new root file), `packages/.gitkeep`
- Move to `apps/app/`: `src`, `public`, `scripts`, `index.html`, `vite.config.ts`, `postcss.config.cjs`, `tsconfig.json`, `tsconfig.node.json`, `openapi-ts.config.ts`, `.env.development`, `.env.production`, `Dockerfile`, `nginx.conf`, `.dockerignore`
- Modify: `package.json`, `.gitignore`, `.yarnrc.yml`, `yarn.lock`

**Interfaces:**

- Produces:
  - Workspace `@dearest/app` in `apps/app` with the scripts `dev`, `build`, `preview`, `typecheck`, `test`, `api:generate`, `postinstall`.
  - Root scripts `dev`, `build`, `preview`, `typecheck`, `test`, `fmt`, `fmt:check`, `check`, `api:generate`.
  - Build output in `apps/app/dist/`.

- [ ] **Step 1: Make a branch from the latest `main`**

```bash
git fetch origin
```

```bash
git switch -c feat/workspaces origin/main
```

If `docs/superpowers/plans/2026-11-27-workspaces.md` is untracked, it moves with you. Commit it first with the message `docs: workspaces plan`.

- [ ] **Step 2: Record the baseline**

Run each command before you move a file:

```bash
yarn install --immutable && yarn api:generate
```

```bash
yarn fmt:check && yarn typecheck && yarn test && yarn build
```

```bash
rm -rf .superpowers/baseline-dist && mkdir -p .superpowers && cp -R dist .superpowers/baseline-dist
```

Expected: all commands pass, and the tests show `Tests  54 passed (54)`. Git ignores `.superpowers/`. If `main` has more tests, use that number in the later steps.

- [ ] **Step 3: Move the files**

```bash
mkdir -p apps/app packages && touch packages/.gitkeep
```

```bash
for f in src public scripts index.html vite.config.ts postcss.config.cjs tsconfig.json tsconfig.node.json openapi-ts.config.ts .env.development .env.production Dockerfile nginx.conf .dockerignore; do git mv "$f" "apps/app/$f"; done
```

`git mv src` also moves the untracked `src/api/generated/`. Then check for local env files that Git does not track:

```bash
ls -a | grep -E '^\.env.*local$|^\.env$'
```

Expected: no output. If there is output, move each file to `apps/app/` with `mv`.

- [ ] **Step 4: Write the two package manifests**

Replace the root `package.json` with:

```json
{
  "name": "dearest.rsvp-web",
  "version": "0.0.0",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "type": "module",
  "scripts": {
    "dev": "yarn workspace @dearest/app dev",
    "build": "yarn workspaces foreach --all --topological-dev run build",
    "preview": "yarn workspace @dearest/app preview",
    "typecheck": "yarn workspaces foreach --all run typecheck",
    "test": "yarn workspaces foreach --all run test",
    "fmt": "vp fmt",
    "fmt:check": "vp fmt --check",
    "check": "vp check",
    "api:generate": "yarn workspace @dearest/app api:generate"
  },
  "devDependencies": {
    "vite": "catalog:",
    "vite-plus": "catalog:"
  },
  "resolutions": {
    "vite": "npm:@voidzero-dev/vite-plus-core@1.0.0"
  },
  "engines": {
    "node": ">=24"
  },
  "packageManager": "yarn@4.18.1"
}
```

Write `apps/app/package.json`:

- `name` is `@dearest/app`. `version` is `0.0.0`. `private` is `true`. `type` is `module`.
- `scripts`: copy `dev`, `build`, `preview`, `typecheck`, `test`, `api:generate` and `postinstall` from the old root manifest, with no change.
- `dependencies` and `devDependencies`: copy the two blocks from the old root manifest, with no change.

Use `git show HEAD:package.json` to read the old manifest.

- [ ] **Step 5: Split the Vite config and update the paths**

Write the new root `vite.config.ts`:

```ts
import { defineConfig } from "vite-plus";

// Settings for the commands that run from the repository root.
export default defineConfig({
  fmt: {
    // The generator writes this folder. Git does not track it. Do not format it.
    ignorePatterns: ["apps/app/src/api/generated/**"],
  },
});
```

Then change these files:

- `apps/app/vite.config.ts`: delete the `fmt` block and its two comment lines. Keep all other lines.
- `.gitignore`: replace the line `src/api/generated/` with `apps/app/src/api/generated/`.
- `.yarnrc.yml`: in the comment, replace `scripts/typescript-6-hooks.mjs` with `apps/app/scripts/typescript-6-hooks.mjs`.

- [ ] **Step 6: Install and compare the build with the baseline**

```bash
yarn install
```

```bash
git diff HEAD --stat -- yarn.lock && git diff HEAD -- yarn.lock
```

Expected: the diff adds the entry `@dearest/app@workspace:apps/app` and moves the app dependencies out of `dearest.rsvp-web@workspace:.`. No package version changes.

```bash
yarn fmt && yarn fmt:check && yarn typecheck && yarn test && yarn build
```

Expected: all commands pass, and the tests show `Tests  54 passed (54)`.

```bash
diff -r .superpowers/baseline-dist apps/app/dist && echo IDENTICAL
```

Expected: `IDENTICAL`. If there is a difference, first run Step 2 again on a clean checkout of `origin/main`, because the deployed API spec can change. If the difference stays, stop and find the cause.

- [ ] **Step 7: Make sure that the root scripts fail on an error**

```bash
echo 'export const probe: number = "a";' > apps/app/src/probe.ts; yarn typecheck; echo "typecheck=$?"; yarn build; echo "build=$?"; rm apps/app/src/probe.ts
```

Expected: `typecheck=1` and `build=1`, with error `TS2322`.

```bash
printf 'import { expect, it } from "vite-plus/test";\nit("probe", () => expect(1).toBe(2));\n' > apps/app/src/probe.test.ts; yarn test; echo "test=$?"; rm apps/app/src/probe.test.ts
```

Expected: `test=1`.

- [ ] **Step 8: Check the dev server**

Start the server in the background:

```bash
DEV_API_PROXY_TARGET=https://api.dearest.rsvp yarn dev --port 5199 --strictPort
```

Then run:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5199/favicon.svg
```

```bash
curl -s http://localhost:5199/src/api/clientConfig.ts | grep -oE '"VITE_API_BASE_URL": *"[^"]*"'
```

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5199/api/openapi.json
```

Expected, in order: `200`, `"VITE_API_BASE_URL": "/api"`, `200`. Stop the server.

- [ ] **Step 9: Commit**

```bash
git add -A && git status --short
```

Expected: only renames and the files in this task. No file from `dist/` or `generated/`.

```bash
git commit -m "feat: move the app to apps/app in a yarn workspaces repository"
```

### Task 2: Point CI and Dependabot at `apps/app`

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `.github/dependabot.yml`

**Interfaces:**

- Consumes: build output in `apps/app/dist/`, and `apps/app/Dockerfile` (Task 1).

- [ ] **Step 1: Change the CI workflow**

| Place                                      | Old value            | New value                     |
| ------------------------------------------ | -------------------- | ----------------------------- |
| Comment above `yarn install` in `check`    | `src/api/generated/` | `apps/app/src/api/generated/` |
| `Upload site build`, `path`                | `dist`               | `apps/app/dist`               |
| `Download site build`, `path`              | `dist`               | `apps/app/dist`               |
| `docker/build-push-action`, `with.context` | `.`                  | `apps/app`                    |

Keep the artifact name `dist`. Do not add a `file` input, because the default is `apps/app/Dockerfile`.

- [ ] **Step 2: Change Dependabot**

In `.github/dependabot.yml`, change the `directory` of the `docker` entry from `/` to `/apps/app`. Keep `/` for `npm`, because Dependabot reads the workspaces from the root. Keep `/` for `github-actions`.

- [ ] **Step 3: Check the changes**

```bash
yarn fmt && yarn fmt:check && git diff
```

Expected: the check passes, and the diff shows only the changes from Steps 1 and 2.

- [ ] **Step 4: Build the image as the deploy job does**

```bash
yarn build && docker build -t dearest-web-slice0 apps/app
```

Expected: the build succeeds.

- [ ] **Step 5: Test the image**

```bash
docker run -d --rm --name dearest-web-slice0 -p 18080:8080 dearest-web-slice0
```

```bash
curl -sI http://localhost:18080/w/abc
```

Expected: `200`, `Content-Type: text/html`, and `X-Frame-Options: DENY`.

```bash
curl -sI "http://localhost:18080/assets/$(basename apps/app/dist/assets/*.js)"
```

Expected: `200` and `Cache-Control: public, max-age=31536000, immutable`.

```bash
docker stop dearest-web-slice0 && docker rmi dearest-web-slice0
```

- [ ] **Step 6: Commit**

```bash
git add .github && git commit -m "ci: build the app image from apps/app"
```

### Task 3: Update the README and check a new clone

**Files:**

- Modify: `README.md`

**Interfaces:**

- Consumes: the root scripts (Task 1).

- [ ] **Step 1: Update the README**

- Add the section "Repository layout" after the introduction. List `apps/app` (the builder) and `packages/` (empty until the Text block slice). Say that all commands run from the root.
- Add `apps/app/` to the start of each path: `src/...`, `src/api/generated/`, `.env.development`, `.env.production`, `scripts/typescript-6-hooks.mjs`, `src/api/clientConfig.ts`, `src/main.tsx`.
- Say that `openapi-ts.config.ts` and the Dockerfile are in `apps/app`.
- Add this section after "Setup":

````markdown
## Update an old clone

The app moved to `apps/app`. After you pull this change in an old clone, delete the old build files at the root:

```bash
rm -rf src dist
```

Run this command only after the pull. Make sure that `git status` shows no work of your own in `src/`. Move your `.env.local` files to `apps/app/`, if you have them. Then run `yarn install`.
````

- [ ] **Step 2: Find old paths**

```bash
grep -nE '(^|[ `("])(src|scripts|public)/' README.md .github .yarnrc.yml .githooks -r
```

Expected: no line shows an old path. A line in "Update an old clone" can name `src/`.

- [ ] **Step 3: Check the old clone case**

```bash
mkdir -p src/api && cp -R apps/app/src/api/generated src/api/ && yarn fmt:check; echo "before=$?"; rm -rf src && yarn fmt:check; echo "after=$?"
```

Expected: `before=1` and `after=0`.

- [ ] **Step 4: Commit**

```bash
yarn fmt && git add README.md && git commit -m "docs: describe the workspaces layout"
```

- [ ] **Step 5: Check a new clone**

```bash
(D=$(mktemp -d) && git clone -q --branch feat/workspaces . "$D" && cd "$D" && yarn install --immutable && ls apps/app/src/api/generated && yarn fmt:check && yarn typecheck && yarn test && yarn build && ls apps/app/dist/index.html)
```

Expected: all commands pass. `ls` shows `index.ts`, `sdk.gen.ts` and `types.gen.ts`.

---

## Open the pull request

- Open one pull request to `main`. The `check` job must pass.
- An open Dependabot pull request for npm changes the old `package.json`. After the merge, comment `@dependabot recreate` on it.
- Other open branches that change `src/` need a rebase. Git follows the renames in most cases.

## After the merge

The deploy job runs for the first time with the new paths.

1. Make sure that the `deploy` job of the CI run on `main` passes.
2. Run `curl -sI https://app.dearest.rsvp/`. Expected: `200`, and a `last-modified` date after the merge.
3. Run `curl -s https://app.dearest.rsvp/ | grep -oE 'assets/index-[^"]+'`. Expected: the same two file names as in `apps/app/dist/index.html`.
4. Open `https://app.dearest.rsvp` in a browser. Log in, open a wedding, and open the members page.

If a check fails, revert the merge commit on `main`. The deploy job then builds the old layout again.
