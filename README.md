# dearest.rsvp-web

The web frontend for the dearest application. It uses React, Mantine, TanStack Query, and Vite+.

The API is in the `dearest.rsvp-api` repository. The deployed API is `https://api.dearest.rsvp`.

## Setup

Use Node 24. The `.nvmrc` file has the version. Yarn comes from Corepack.

```bash
corepack enable
yarn install
git config core.hooksPath .githooks
```

The last command turns on the Git hooks. Run it one time in each clone.

## Scripts

| Command          | What it does                       |
| ---------------- | ---------------------------------- |
| `yarn dev`       | Start the dev server               |
| `yarn build`     | Typecheck and build for production |
| `yarn preview`   | Serve the production build         |
| `yarn test`      | Run the unit tests                 |
| `yarn typecheck` | Run the TypeScript check           |
| `yarn fmt`       | Format the code                    |
| `yarn fmt:check` | Check the format without a change  |

## Environment variables

| Variable               | Used in      | Purpose                                                    |
| ---------------------- | ------------ | ---------------------------------------------------------- |
| `VITE_API_BASE_URL`    | Browser code | Base URL for API calls                                     |
| `DEV_API_PROXY_TARGET` | Dev server   | Where Vite sends `/api` calls. Default is `localhost:3000` |

`.env.development` and `.env.production` have the default values.
In development, the browser calls `/api`. Vite removes the `/api` prefix and forwards the call to `DEV_API_PROXY_TARGET`.
This avoids CORS in development.
In production, the browser calls `https://api.dearest.rsvp` directly. The API must allow the frontend origin with CORS.

## Project layout

- `src/api/`: the API layer. `client.ts` has the fetch client. Each other file has the calls and hooks for one resource.
- `src/components/`: React components.
- `src/queryClient.ts`: the TanStack Query client.

## Git hooks

The `.githooks/pre-commit` hook runs `yarn fmt:check`. Run `yarn fmt` to fix a format error.
To skip the hook one time, add `--no-verify` to the Git command.

## CI

GitHub Actions runs the format check, the typecheck, the unit tests, and the build on each pull request and each push to `master`.
