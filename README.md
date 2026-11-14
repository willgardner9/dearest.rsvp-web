# dearest.rsvp-web

The web frontend for the dearest application. It uses React, Mantine, TanStack Query, TanStack Router, and Vite+.

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

## Pages

| Path                    | Who                 | Purpose                                                  |
| ----------------------- | ------------------- | -------------------------------------------------------- |
| `/login`                | logged out          | Log in with email and password                           |
| `/signup`               | logged out          | Create an account                                        |
| `/verify-email`         | unverified          | "Check your inbox", resend the email, log out            |
| `/verify-email/confirm` | anyone              | Open the link from the verification email                |
| `/forgot-password`      | logged out          | Request a password reset email                           |
| `/reset-password`       | anyone              | Set a new password from the reset email link             |
| `/invite/$token`        | anyone              | Join a wedding from an invite                            |
| `/onboarding`           | verified, 0 wedding | Create the first wedding                                 |
| `/new-wedding`          | verified            | Create another wedding. No link in the app points to it. |
| `/w/$tenantId`          | member              | Wedding home                                             |
| `/w/$tenantId/members`  | member              | Members, pending invites, and the invite form            |

`/` goes to the right page for the user: log in, verify the email, onboarding, or the wedding that was open last.
The session is an `HttpOnly` cookie from the API. The web app never reads a token.

## Local auth

The auth pages need the API and an email server. In the `dearest.rsvp-api` repository, on the `auth` branch, run:

```bash
docker compose up --build
```

This starts the API on `localhost:3000`, Postgres, and Mailpit. Then run `yarn dev` here.
The API sends all email to Mailpit. Open the Mailpit UI at `http://localhost:8025` to read the verification, reset, and invite emails.

## Project layout

- `src/api/`: the API layer. `client.ts` has the fetch client. `errors.ts` maps API error codes to messages. Each other file has the calls and hooks for one resource.
- `src/router.tsx`: the routes and the route guards.
- `src/routing.ts`: the redirect rules. Unit tests cover them.
- `src/pages/`: one component for each page.
- `src/components/`: shared React components.
- `src/queryClient.ts`: the TanStack Query client.

## Git hooks

The `.githooks/pre-commit` hook runs `yarn fmt:check`. Run `yarn fmt` to fix a format error.
To skip the hook one time, add `--no-verify` to the Git command.

## CI

GitHub Actions runs the format check, the typecheck, the unit tests, and the build on each pull request and each push to `main`.
