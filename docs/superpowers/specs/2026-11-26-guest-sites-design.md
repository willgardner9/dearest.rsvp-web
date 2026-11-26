# Guest sites: design

Date: 2026-11-26
Repositories: `dearest.rsvp-web` (main work), `dearest.rsvp-api` (data and
endpoints), Dokploy (routing)
Related: [Product vision](../../../../dearest.rsvp-api/docs/product/vision.md)

## Intent

Each wedding gets a website for its guests at `dearest.rsvp/to/<slug>`. The
couple builds the site in `app.dearest.rsvp` with a small block-based page
builder. The couple adds pages, puts blocks on each page, changes the order,
and sets a theme (fonts and colours).

Guests open the link on a phone, often from WhatsApp or iMessage. The site
must load fast on a mobile connection. A slow or broken site makes the
product look bad on the most visible day of the customer's year.

The first release is small on purpose. It has one block type (Text). The
design makes it easy to add more block types later.

## Goals

- A couple can add, remove, rename and reorder pages.
- A couple can add, remove, reorder and edit blocks on a page.
- A couple can set a site theme. The blocks use the theme.
- A couple edits a draft. Guests see only the published version.
- A wedding member can preview the draft exactly as guests will see it,
  with live updates while they edit.
- The site has a security level: open or password. On a password site, a
  visitor without the password sees only the gate page.
- Link previews in WhatsApp, iMessage and other apps show the couple's
  names and date.
- Pages load fast on a mid-range phone on 4G (targets below).

## Non-goals

- No block types other than Text in the first release.
- No photos and no object storage in the first release. They come with the
  first block type that needs a photo.
- No PIN security level in the first release (see [PIN](#pin)).
- No free-form HTML, CSS or JavaScript from the couple.
- No custom domains (for example `alexandsam.com`).
- No preview for people who are not wedding members.
- No marketing site. It is a separate deploy on `dearest.rsvp`.
- No RSVP. It is a separate feature with its own design.
- No version history or undo beyond the draft and the published version.
- No redirects from an old slug.
- No CDN in the first release.

## Anti-goals

The work is a failure, even if it works, if one of these is true:

- A guest sees a half-finished edit.
- The preview shows something different from the live site.
- A visitor without the password can read a page other than the gate page,
  for example in the HTML source or in an API response.
- Guests download the builder code or Mantine.
- A change to a block breaks sites that couples published before the change.

## Security stance

The password is a shared handshake, not real authentication. It keeps
strangers and search engines out. It does not stop a guest who shares the
password. So:

- The API stores the password as plain text. The couple can see it in the
  builder and copy it into an invitation.
- The gate cookie holds the password itself. No signing secret.
- No rate limit on password attempts in the first release.

## Constraints

- Deploy: Dokploy on one Hetzner VPS. CI builds images and pushes them to
  GHCR. Traefik (in Dokploy) routes the traffic. No Cloudflare.
- Domains: `app.dearest.rsvp` is the builder. `dearest.rsvp` is the
  marketing site. `dearest.rsvp/to/*` is the guest site.
- API: Rust, axum, SeaORM, Postgres 18. The session cookie
  `dearest_session` has no `Domain` attribute, so it goes only to the API
  host.
- Frontend: React 19, Vite through `vite-plus` (`vp`), TypeScript, yarn 4.
- The slug is unique across all weddings. The couple chooses it in the
  website setup (see the product vision).

## Approaches

| Approach                  | Summary                                                                                                 | Result                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| A. Server-rendered React  | A Node server renders the published document to HTML for each request. Only interactive blocks ship JS. | **Picked.** Same components for the live site and the preview. Gated content stays on the server.                               |
| B. Static HTML at publish | A worker renders HTML files at publish. nginx serves them.                                              | Rejected. Gated pages need an auth check in nginx, and the preview needs a live renderer anyway. So there are two render paths. |
| C. Single-page app        | A static shell fetches the document from the API in the browser.                                        | Rejected. Slow first load on a phone. Link preview crawlers do not run JavaScript, so link previews break.                      |
| D. Render in the Rust API | Templates in Rust.                                                                                      | Rejected. The blocks exist twice (Rust and React). The preview drifts from the live site.                                       |

Framework choice inside approach A:

| Option                                           | Result                                                                                                                                                                                                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hono with `react-dom/server`, built with Vite    | **Picked.** Small, stable, under our control. Same toolchain as the builder.                                                                                                                                                                                    |
| rari (React Server Components on a Rust runtime) | Rejected for now. It is version 0.17 with one main maintainer. The docs do not show how to read cookies in a page or how to change the asset path. The render speed gain (about 1 ms) is small next to network time. The design keeps the renderer replaceable. |

Repository choice:

| Option                                              | Result                                                                                                                           |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo with yarn workspaces in `dearest.rsvp-web` | **Picked.** A block change touches the block, the builder form and the guest render. One PR does all three. No package registry. |
| Separate repositories for blocks and sites          | Rejected. Each block change needs a publish, a version bump and PRs in each repository. The builder and the site drift apart.    |

Preview choice:

| Option                                                   | Result                                                                                                            |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| The builder renders `<SitePage>` in a same-origin iframe | **Picked.** The draft is already in the builder. No token, no cross-domain messages, no preview route on `sites`. |
| An iframe of a preview route on `sites`                  | Rejected. The session cookie cannot reach `dearest.rsvp`, so it needs a preview token system.                     |

## Decisions

These decisions come from the conversation with the product owner.

1. Block-based builder. Couples add pages and arrange blocks.
2. We write the block types in code. Couples edit blocks. They never write
   HTML or CSS.
3. The first release has only the Text block.
4. One site document per wedding, with a draft and a published version.
   "Publish" makes the draft live.
5. The builder has a live preview of the draft. Only wedding members can
   see it.
6. The gate page is a normal page in the site document, made of blocks.
7. The password is a handshake, not real auth (see
   [Security stance](#security-stance)).
8. Approach A, with Hono and Vite.
9. Monorepo with yarn workspaces.
10. The names come from `tenants.name`. A new column `tenants.wedding_date`
    holds the date. The couple sets both in the wedding settings.
11. The couple can change the slug at any time. Old links break. The
    builder warns about this.
12. The API trusts calls from the `sites` container on the Docker network.
    No shared secret.
13. No photos and no object storage in the first release.

## Design

### Repository layout

```
dearest.rsvp-web/
  package.json            yarn workspaces root
  apps/
    app/                  the builder (today's app, moved here). Mantine.
    sites/                the guest site. Hono server.
  packages/
    blocks/               block components, block schemas, theme, <SitePage>
```

- `apps/app` is the current app, moved without behaviour change. Its image
  stays nginx with static files.
- `apps/sites` is a new Node image.
- `packages/blocks` is not deployed alone. Both apps import it as source.

### Block library (`packages/blocks`)

Each block type exports one object:

```ts
type BlockDefinition<Content> = {
  type: string; // for example "text"
  version: number; // content shape version
  schema: Schema<Content>; // validates content
  defaults: Content; // content for a new block
  migrate: (old: unknown, fromVersion: number) => Content;
  Component: (props: { content: Content }) => JSX.Element;
  interactive?: boolean; // true if the block needs client JavaScript
};
```

Rules:

- A block component is a pure function of its props. It does not fetch
  data. It uses no server-only and no browser-only API during render. So it
  renders on the server and in the browser.
- Blocks do not import Mantine. Blocks use CSS modules. The theme sets CSS
  custom properties (for example `--site-color-accent`,
  `--site-font-heading`) on the page root. Blocks read only these
  properties.
- An `interactive` block renders full HTML on the server. Its client
  JavaScript hydrates only that block (islands). A page with no interactive
  blocks ships no JavaScript. The Text block is not interactive, so the
  first release ships no JavaScript to guests.

The package also exports `<SitePage document page />`. It renders one full
page: the theme variables, the navigation, the blocks, and (on the gate
page) the password form. Both `sites` and the builder preview use it.

First block:

| Block | Content                                                    |
| ----- | ---------------------------------------------------------- |
| Text  | heading (optional), rich text (bold, italic, links, lists) |

The rich text is a small structured format, not raw HTML.

### Block versions and `migrate`

When a block's content shape changes, the block gets a new version number
and its `migrate` function turns old content into the new shape. Example:

- Text v1 content is `{ body }`.
- Text v2 adds a heading: `{ heading, body }`.
- `migrate(old, 1)` returns `{ heading: "", body: old.body }`.

The stored documents keep the old version. Each read (a render in `sites`
or a load in the builder) runs `migrate`. When the couple saves, the new
version goes to the database. So no database migration over all sites is
necessary, and old published sites do not break. A change that only adds an
optional field needs no new version.

### Site document

One JSON document holds the full site:

```ts
type SiteDocument = {
  schemaVersion: number;
  theme: Theme; // preset ID plus overrides: colours, fonts
  pages: Array<{
    id: string; // stable ID
    kind: "gate" | "page";
    slug: string; // "" for the home page, unique within the site
    title: string;
    blocks: Array<{ id: string; type: string; version: number; content: unknown }>;
  }>;
};
```

- `kind` marks a page that has a special job. The first release has
  `gate` and `page`. Later features can add more kinds, for example `rsvp`
  or `contact` for pages that collect data from guests with a special
  form. A special kind can add its own part to `<SitePage>` (like the
  password form on the gate page) and its own rules in the builder (for
  example "only one per site"). An unknown kind renders as a normal page.
- Each document has exactly one `gate` page. The builder makes it when it
  makes the site. The couple cannot delete it.
- The order of the `page` pages is the navigation order. The gate page is
  not in the navigation.
- A page URL is `dearest.rsvp/to/<site-slug>/<page-slug>`.
- A page slug cannot start with `_`.

### Gate page

- On a password site, a visitor without a valid gate cookie gets the gate
  page at every URL of the site. `<SitePage>` adds the password form below
  the gate page blocks.
- On an open site, `sites` never shows the gate page. The builder shows it
  as "Used only when the site has a password".
- The gate page is public. The builder labels it "Everyone with the link
  can see this page". The couple decides what to put on it.

### Theme

- A theme is a preset (for example "Classic", "Modern", "Garden") plus
  overrides. The couple can change the accent and background colours and
  pick from a short list of font pairs.
- `<SitePage>` turns the theme into CSS custom properties.
- Fonts are self-hosted files, preloaded, with `font-display: swap`. No
  font requests to third parties.

### Data and API (`dearest.rsvp-api`)

Change to `tenants`: add `wedding_date` (date, null). The wedding settings
in the builder get a date field. The Open Graph tags use it.

New table `sites` (one row per tenant):

| Column           | Type              | Note                                      |
| ---------------- | ----------------- | ----------------------------------------- |
| `tenant_id`      | UUID, primary key | references `tenants`                      |
| `slug`           | text, unique      | lower case, `a-z`, `0-9`, `-`             |
| `draft`          | JSONB             | the draft document                        |
| `published`      | JSONB, null       | null until the first publish              |
| `security_level` | enum              | `open`, `password`, `pin`                 |
| `password`       | text, null        | plain text, for `password`                |
| `updated_at`     | timestamp         | last draft save                           |
| `published_at`   | timestamp, null   | last publish; also the ETag and cache key |

Endpoints for wedding members (session cookie, public API):

- `GET /tenants/{id}/site` gets the draft, the publish state and the
  settings.
- `PUT /tenants/{id}/site/draft` saves the draft. The builder autosaves.
  The request sends the last `updated_at`. The API returns `409` if the
  draft changed after that, so two members do not overwrite each other.
- `POST /tenants/{id}/site/publish` copies the draft to `published`.
- `PUT /tenants/{id}/site/settings` sets the slug, the security level and
  the password. Settings take effect at once. They do not go through the
  draft and publish model.

Endpoint for `sites` (internal):

- `GET /internal/sites/{slug}` gets the published document,
  `published_at`, the security level, the password, the names and the date.

The internal routes run on a second port of the API (for example `3001`).
Traefik does not route that port, so only containers on the Docker network
can reach it. Do not put the internal routes on the public port: the
response holds the password and the gated pages.

The API validates only the size of a document (limit 512 KB) and
`schemaVersion`. The TypeScript schemas in `packages/blocks` do the full
validation in the builder and in `sites`. `sites` skips a block that fails
validation and logs an error. It does not fail the page.

### PIN

A PIN belongs to a party on the guest list. Parties do not exist yet. So
the `security_level` enum has the value `pin` from the start, but the API
rejects `pin` in `PUT /site/settings`, and the builder does not show it.
The guest list and RSVP features add the PIN check and the PIN form.

### Guest site (`apps/sites`)

Request flow for `GET /to/<slug>/<page>`:

1. Get the site from the internal API. `sites` keeps an in-memory cache,
   keyed by slug, for 30 seconds. After a publish or a settings change, the
   site is live in 30 seconds or less.
2. If the slug does not exist or the site is not published, return `404`.
3. If the level is `password` and the gate cookie does not equal the
   current password, render the gate page.
4. Migrate each block to its current version, then render the page to HTML
   with `renderToReadableStream` (React's streaming server render).
5. Add the client JavaScript only for interactive blocks on the page.

Gate form:

- `POST /to/<slug>/_unlock` with the password. If it matches, `sites` sets
  the gate cookie and redirects to the page the visitor asked for. If not,
  it renders the gate page with an error.
- The gate cookie holds the password. The path is `/to/<slug>`. It is
  `HttpOnly`, `Secure`, `SameSite=Lax`, with an expiry of 90 days.
- When the couple changes the password, old cookies stop matching, so
  guests must enter the new password.

Link previews:

- Every page has Open Graph tags with `tenants.name` and `wedding_date`.
  On a password site, every page without a valid cookie returns only these
  tags and the gate page.

Caching:

| Response                                | `Cache-Control`                                |
| --------------------------------------- | ---------------------------------------------- |
| `/to/_assets/*` (hashed CSS, JS, fonts) | `public, max-age=31536000, immutable`          |
| Pages of an open site                   | `no-cache`, with an `ETag` from `published_at` |
| Gate page, and pages behind the gate    | `private, no-store`                            |

Assets of `sites` live under `/to/_assets/`, so they do not clash with the
marketing site on the same domain.

### Preview

- The builder renders `<SitePage>` with the draft in an iframe on
  `app.dearest.rsvp`. The iframe loads the same theme CSS and the same block
  CSS as `sites`.
- Each edit updates the preview at once, because the draft is in the
  builder's memory.
- The iframe keeps the Mantine CSS away from the preview. The builder can
  set the iframe width for a phone, tablet or desktop view.
- The builder can show the gate page in the preview.

### Builder (`apps/app`)

- A site screen with three parts: the page list, the block list of the
  selected page, and the preview.
- A form for each block type. Form code lives only in `apps/app`.
- Drag to reorder pages and blocks.
- Autosave of the draft, with a "Saved" status and a "Publish" button.
- A settings screen for the slug, the security level and the password.
  The slug field warns: "Links you already sent will stop working."

### Routing and deploy

- Traefik in Dokploy sends `Host(dearest.rsvp) && PathPrefix(/to)` to the
  `sites` service and other `dearest.rsvp` traffic to the marketing site.
- CI builds two images from one run: `web` (nginx with `apps/app` files)
  and `sites` (Node 24 with the server build). A path filter skips an image
  if none of its files changed. A change to `packages/blocks` builds both.
- `sites` calls the API's internal port over the Docker network.

### Later: photos

The first block type with a photo brings object storage. Notes for that
design:

- Use S3-compatible storage, not the Hetzner volume.
- The site is not on Cloudflare. Good options: Bunny Storage with Bunny
  Optimizer (CDN and resizing built in), or Hetzner Object Storage with an
  `imgproxy` container and a CDN.

### Performance targets

Measured on a mid-range Android phone on 4G (Lighthouse mobile profile):

- Largest Contentful Paint: 2.0 s or less.
- JavaScript on a page with no interactive blocks: 0 KB.
- Server render time (p95, site in cache): 20 ms or less.
- CLS: 0.05 or less.

## Left to the builder

- The schema library for block content (for example Zod or Valibot). Pick
  one that runs in the browser and in Node and that has a small bundle.
- The rich text format and editor inside the Text block (keep it small and
  safe; no raw HTML).
- The drag-and-drop library.
- The theme presets and the font pairs (with product owner review).
- When the API makes the `sites` row, and the default slug.
- The order of the work. Suggested order: workspace move, block library,
  API tables and endpoints, `sites`, builder and preview, deploy.
