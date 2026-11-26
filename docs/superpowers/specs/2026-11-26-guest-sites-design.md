# Guest sites: design

Date: 2026-11-26
Repositories: `dearest.rsvp-web` (main work), `dearest.rsvp-api` (data and
endpoints), Dokploy (routing)
Related: [Product vision](../../../../dearest.rsvp-api/docs/product/vision.md)

## Intent

Each wedding gets a website for its guests at `dearest.rsvp/to/<slug>`. The
couple builds the site in `app.dearest.rsvp` with a small block-based page
builder. The couple adds pages, puts blocks on each page, changes the order,
and sets a theme (fonts, colours, photos, text).

Guests open the link on a phone, often from WhatsApp or iMessage. The site
must load fast on a mobile connection. A slow or broken site makes the
product look bad on the most visible day of the customer's year.

## Goals

- A couple can add, remove, rename and reorder pages.
- A couple can add, remove, reorder and configure blocks on a page.
- A couple can set a site theme. The blocks use the theme.
- A couple edits a draft. Guests see only the published version.
- A wedding member can preview the draft exactly as guests will see it,
  with live updates while they edit.
- The site respects the security level of the wedding (open, password or
  PIN). A visitor who is not signed in sees only the gate page.
- Link previews in WhatsApp, iMessage and other apps show the couple's
  names, date and photo.
- Pages load fast on a mid-range phone on 4G (targets below).

## Non-goals

- No free-form HTML, CSS or JavaScript from the couple.
- No custom domains (for example `alexandsam.com`). Later, maybe.
- No preview link for people who are not wedding members.
- No marketing site. It is a separate deploy on `dearest.rsvp`.
- No RSVP logic in this design. The RSVP block is a slot. RSVP is a
  separate feature with its own design.
- No version history or undo beyond the draft and the published version.

## Anti-goals

The work is a failure, even if it works, if one of these is true:

- A guest sees a half-finished edit.
- The preview shows something different from the live site.
- A visitor without the password or PIN can read gated content, for example
  in the HTML source, in a cached response, or in an API response.
- Guests download the builder code or Mantine.
- A change to a block breaks sites that couples published before the change.

## Constraints

- Deploy: Dokploy on one VPS. CI builds images and pushes them to GHCR.
  Traefik (in Dokploy) routes the traffic.
- Domains: `app.dearest.rsvp` is the builder. `dearest.rsvp` is the
  marketing site. `dearest.rsvp/to/*` is the guest site.
- API: Rust, axum, SeaORM, Postgres 18. The session cookie
  `dearest_session` has no `Domain` attribute. So it goes only to the API
  host. The guest site cannot read it.
- Frontend: React 19, Vite through `vite-plus` (`vp`), TypeScript, yarn 4.
- The slug is unique across all weddings. The couple chooses it in the
  website setup (see the product vision).

## Approaches

| Approach                  | Summary                                                                                                                                               | Result                                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| A. Server-rendered React  | A Node server renders the published document to HTML for each request. Only interactive blocks ship JavaScript. A preview route uses the same blocks. | **Picked.** One render path for the live site and the preview. Gated content stays on the server.                               |
| B. Static HTML at publish | A worker renders HTML files at publish. nginx serves them.                                                                                            | Rejected. Gated pages need an auth check in nginx, and the preview needs a live renderer anyway. So there are two render paths. |
| C. Single-page app        | A static shell fetches the document from the API in the browser.                                                                                      | Rejected. Slow first load on a phone. Link preview crawlers do not run JavaScript, so link previews break.                      |
| D. Render in the Rust API | Templates in Rust.                                                                                                                                    | Rejected. The blocks exist twice (Rust and React). The preview drifts from the live site.                                       |

Framework choice inside approach A:

| Option                                           | Result                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hono with `react-dom/server`, built with Vite    | **Picked.** Small, stable, under our control. Same toolchain as the builder.                                                                                                                                                                                                                  |
| rari (React Server Components on a Rust runtime) | Rejected for now. It is version 0.17 with one main maintainer. The docs do not show how to read cookies in a page or how to change the asset path. The render speed gain (about 1 ms) is small next to network time. The block design keeps the renderer replaceable, so we can try it later. |
| Next.js                                          | Not considered. Heavy, and not needed.                                                                                                                                                                                                                                                        |

Repository choice:

| Option                                              | Result                                                                                                                           |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo with yarn workspaces in `dearest.rsvp-web` | **Picked.** A block change touches the block, the builder form and the guest render. One PR does all three. No package registry. |
| Separate repositories for blocks and sites          | Rejected. Each block change needs a publish, a version bump and PRs in each repository. The builder and the site drift apart.    |

## Decisions

These decisions come from the conversation with the product owner.

1. Block-based builder. Couples add pages and arrange blocks.
2. We write the block types in code. Couples configure blocks. They never
   write HTML or CSS.
3. One site document per wedding, with a draft and a published version.
   "Publish" makes the draft live.
4. The builder has a preview of the draft.
5. Only wedding members can see the preview.
6. Photos go to object storage. The site serves resized versions.
7. The gate page shows the names and the date to everyone, so a visitor
   knows that the link is correct. All other content and RSVP are behind
   the gate.
8. Approach A, with Hono and Vite.
9. Monorepo with yarn workspaces.
10. The names come from `tenants.name`. A new column `tenants.wedding_date`
    holds the date. The couple sets both in the wedding settings.
11. The couple can change the slug after the first publish. The old slug
    stays reserved for that wedding and redirects to the new slug.

## Design

### Repository layout

```
dearest.rsvp-web/
  package.json            yarn workspaces root
  apps/
    app/                  the builder (today's app, moved here). Mantine.
    sites/                the guest site. Hono server.
  packages/
    blocks/               block components, block schemas, theme
```

- `apps/app` is the current app, moved without behaviour change. Its image
  stays nginx with static files.
- `apps/sites` is a new Node image.
- `packages/blocks` is not deployed alone. Both apps import it as source.

### Block library (`packages/blocks`)

Each block type exports one object:

```ts
type BlockDefinition<Content> = {
  type: string; // for example "hero", "text", "schedule"
  version: number; // content shape version
  schema: Schema<Content>; // validates content
  defaults: Content; // content for a new block
  migrate: (old: unknown, fromVersion: number) => Content;
  Component: (props: { content: Content; theme: Theme; ctx: RenderContext }) => JSX.Element;
  interactive?: boolean; // true if the block needs client JavaScript
};
```

Rules:

- A block component is a pure function of its props. It does not fetch
  data. It uses no server-only and no browser-only API during render. So it
  renders on the server and in the browser.
- Blocks do not import Mantine. Blocks use CSS modules. The theme sets CSS
  custom properties (for example `--site-color-accent`, `--site-font-heading`)
  on the page root. Blocks read only these properties.
- Images in a block are references (an asset ID plus alt text and focal
  point), not URLs. `RenderContext` turns a reference into a URL with a size.
- An `interactive` block renders full HTML on the server. The client
  JavaScript for that block hydrates only that block (islands). A page with
  no interactive blocks ships no JavaScript.

First block set (the builder can add more later):

| Block    | Content                                                           |
| -------- | ----------------------------------------------------------------- |
| Hero     | photo, names, date, short line of text                            |
| Text     | heading, rich text (limited: bold, italic, links, lists)          |
| Image    | one photo, caption                                                |
| Gallery  | list of photos (interactive: lightbox)                            |
| Schedule | list of items: time, title, place, note                           |
| Travel   | list of items: title, address, map link, note                     |
| FAQ      | list of question and answer pairs                                 |
| RSVP     | slot only. Renders "RSVP opens soon" until the RSVP feature ships |

### Site document

One JSON document holds the full site:

```ts
type SiteDocument = {
  schemaVersion: number;
  theme: Theme; // preset ID plus overrides: colours, fonts
  gate: { photo?: AssetRef; tagline?: string };
  pages: Array<{
    id: string; // stable ID
    slug: string; // "" for the home page, unique within the site
    title: string;
    blocks: Array<{ id: string; type: string; version: number; content: unknown }>;
  }>;
};
```

- The gate page uses the couple's names and the date from the wedding
  data, plus the `gate` part of the document. The couple cannot put gated
  content on the gate page.
- The order of `pages` is the navigation order.
- A page URL is `dearest.rsvp/to/<site-slug>/<page-slug>`.

### Theme

- A theme is a preset (for example "Classic", "Modern", "Garden") plus
  overrides. The couple can change the accent and background colours and
  pick from a short list of font pairs.
- The renderer turns the theme into CSS custom properties.
- Fonts are self-hosted files, preloaded, with `font-display: swap`. No
  font requests to third parties.

### Data and API (`dearest.rsvp-api`)

Change to `tenants`: add `wedding_date` (date, null). The wedding settings
in the builder get a date field. The gate page shows no date while it is
null.

New table `sites` (one row per tenant):

| Column                       | Type              | Note                                                                |
| ---------------------------- | ----------------- | ------------------------------------------------------------------- |
| `tenant_id`                  | UUID, primary key | references `tenants`                                                |
| `slug`                       | text, unique      | lower case, `a-z`, `0-9`, `-`                                       |
| `draft`                      | JSONB             | the draft document                                                  |
| `published`                  | JSONB, null       | null until the first publish                                        |
| `published_version`          | integer           | goes up by one at each publish                                      |
| `security_level`             | enum              | `open`, `password`, `pin`                                           |
| `password_hash`              | text, null        | for `password`                                                      |
| `gate_version`               | integer           | goes up by one at each change of the security level or the password |
| `updated_at`, `published_at` | timestamps        |                                                                     |

New table `site_slug_history`: `slug` (primary key), `tenant_id`,
`created_at`. When the couple changes the slug, the API adds the old slug
here. A slug in this table is not free for other weddings.

New table `site_assets`: `id`, `tenant_id`, storage key, width, height,
content type, size, `created_at`.

Endpoints for wedding members (session cookie):

- `GET /tenants/{id}/site` gets the draft and the publish state.
- `PUT /tenants/{id}/site/draft` saves the draft. The builder autosaves.
  The request sends the last `updated_at`. The API returns `409` if the
  draft changed after that, so two members do not overwrite each other.
- `POST /tenants/{id}/site/publish` copies the draft to `published`.
- `PUT /tenants/{id}/site/settings` sets the slug and the security level.
- `POST /tenants/{id}/site/assets` gets a presigned upload URL.
- `POST /tenants/{id}/site/preview-token` makes a preview token (below).

Endpoints for the guest site (internal network only, with a shared secret
header):

- `GET /internal/sites/{slug}` gets the published document, the version,
  the security level, the gate version, the names and the date. For an old
  slug it returns the current slug, and `sites` sends a `301` redirect.
- `GET /internal/sites/{slug}/draft?token=...` checks a preview token and
  gets the draft.
- `POST /internal/sites/{slug}/unlock` checks a password.

PIN level: a PIN belongs to a party on the guest list. Parties do not exist
yet. So the enum has the value `pin` from the start, but the API rejects
`pin` in `PUT /site/settings`, and the builder does not show it. The guest
list and RSVP features add the PIN check, the PIN form on the gate page,
and the party ID in the gate cookie.

Settings take effect at once. They do not go through the draft and
publish model. The caching rules below make sure that a change from `open`
to `password` needs no CDN purge.

The API validates only the size of a document (limit 512 KB) and
`schemaVersion`. The TypeScript schemas in `packages/blocks` do the full
validation in the builder and in `sites`. `sites` skips a block that fails
validation and logs an error. It does not fail the page.

### Guest site (`apps/sites`)

Request flow for `GET /to/<slug>/<page>`:

1. Get the published document. `sites` keeps an in-memory cache, keyed by
   slug, for 30 seconds. After a publish the site is live in 30 seconds
   or less.
2. If the slug does not exist or the site is not published, return `404`.
3. If the level is `password` or `pin` and the request has no valid gate
   cookie, render the gate page.
4. Migrate each block to its current version, then render the page to HTML
   with `renderToReadableStream`.
5. Add the client JavaScript only for the interactive blocks on the page.

Gate:

- The gate cookie is signed by `sites` (HMAC, secret in an environment
  variable). It holds the slug, the `gate_version`, and an expiry of
  90 days. The path is `/to/<slug>`. It is
  `HttpOnly`, `Secure`, `SameSite=Lax`.
- A password change in the builder changes the gate version, so old
  cookies stop working.
- The gate form posts to `sites`. `sites` asks the API to check the
  password. The API applies a rate limit.

Link previews:

- Every page, also the gate page, has Open Graph tags with the names, the
  date and the gate photo. A gated page shows only gate data in its tags.

Caching:

| Response                                | `Cache-Control`                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------- |
| `/to/_assets/*` (hashed JS, CSS, fonts) | `public, max-age=31536000, immutable`                                                         |
| Gate page                               | `public, max-age=60`                                                                          |
| Pages of an `open` site                 | `no-cache` with an `ETag` (the CDN and the browser revalidate each time and get a fast `304`) |
| Pages behind the gate                   | `private, no-store`                                                                           |
| Preview                                 | `private, no-store`                                                                           |

Every response that depends on the gate cookie also has `Vary: Cookie`.

Assets of `sites` live under `/to/_assets/`, so they do not clash with the
marketing site on the same domain. A page slug cannot start with `_`.

### Preview

1. The builder asks the API for a preview token. The token is short-lived
   (10 minutes), signed, and tied to the tenant and the user.
2. The builder opens an iframe at `/to/<slug>/_preview/<page>?token=...`.
3. `sites` checks the token with the API and renders the draft. The page
   loads the full block renderer as client JavaScript.
4. When the couple edits, the builder sends the new draft to the iframe
   with `postMessage`. The iframe renders it at once. It checks the message
   origin (`https://app.dearest.rsvp`).
5. The builder gets a new token before the old one expires.

The preview runs the same blocks, the same CSS and the same theme code as
the live site. The iframe also keeps the builder CSS away from the preview,
and the builder can set the iframe width for a phone, tablet or desktop
view.

The session cookie stays on the API host. It never goes to
`dearest.rsvp`.

### Builder (`apps/app`)

- A site screen with three parts: the page list, the block list of the
  selected page, and the preview iframe.
- A form for each block type. The builder makes the forms from the block
  schema where it can, and uses a custom form where it cannot. Form code
  lives only in `apps/app`.
- Drag to reorder pages and blocks.
- Autosave of the draft, with a "Saved" status and a "Publish" button.
- A settings screen for the slug and the security level.

### Photos

- The builder uploads the original photo straight to object storage with
  a presigned URL. The API records the asset.
- An `imgproxy` container on Dokploy makes resized versions on request.
  The CDN caches them.
- `RenderContext` makes `srcset` URLs with widths 480, 960, 1600 and 2400,
  in WebP and AVIF. Every image has `width`, `height` and `loading="lazy"`,
  except the first image on a page, which loads at once with
  `fetchpriority="high"`.
- Photos of a gated site are not secret. The URLs are hard to guess (random
  IDs), but a person with a URL can open the photo. This is accepted.

### Routing and deploy

- Traefik in Dokploy sends `Host(dearest.rsvp) && PathPrefix(/to)` to the
  `sites` service and other `dearest.rsvp` traffic to the marketing site.
- CI builds two images from one run: `web` (nginx with `apps/app` files)
  and `sites` (Node 24 with the server build). A path filter skips an image
  if none of its files changed. A change to `packages/blocks` builds both.
- `sites` gets the API through the internal Docker network.
- A CDN in front of the VPS caches the assets, the gate page and the
  photos. It does not keep guest pages, so no purge step is necessary.

### Performance targets

Measured on a mid-range Android phone on 4G (Lighthouse mobile profile):

- Largest Contentful Paint: 2.0 s or less.
- JavaScript on a page with no interactive blocks: 0 KB.
- JavaScript on a page with interactive blocks: 30 KB or less (gzip).
- Server render time (p95, document in cache): 20 ms or less.
- CLS: 0.05 or less.

## Left to the builder

- The schema library for block content (for example Zod or Valibot). Pick
  one that runs in the browser and in Node and that has a small bundle.
- The exact form generation in the builder.
- The drag-and-drop library.
- The theme presets and the font pairs (with product owner review).
- The rich text format inside the Text block (keep it small and safe; no
  raw HTML).
- The object storage provider (S3-compatible) and the CDN provider.
- The order of the work. Suggested order: workspace move, block library,
  API tables and endpoints, `sites`, preview, builder, photos, deploy.
