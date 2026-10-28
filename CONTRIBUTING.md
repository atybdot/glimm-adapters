# Contributing

Local setup, the example apps, the docs site and the release process. The package API is in [README.md](README.md).

## Local setup

```bash
pnpm install
pnpm check     # format, lint, typecheck, test
pnpm build     # library, example apps, docs site
```

Node 18 or newer. pnpm comes from the `packageManager` field. Lefthook formats and lints staged files on commit.

## Repo layout

```
packages/glimm-adapters/
  src/
    index.ts       glimm core re-export, interceptLinks, playCoveredSweep, createCurtain
    intercept.ts   delegated click interceptor (internal)
    covered.ts     cover, hold, reveal sweep and curtain (internal)
    vanilla.ts     shared runner plus setupGlimmVanilla
    setup-key.ts   per-canvas instance dedupe (internal)
    react.tsx      GlimmProvider re-export, useInterceptLinks
    tanstack.tsx   TransitionLink, useTransitionRouter, InterceptLinks
    svelte.ts      setupGlimm
    vue.ts         setupGlimmVue
    astro.ts       setupGlimmAstro
  tests/
apps/web/                    docs site
examples/frameworks/         one runnable app per adapter
examples/native-css/         a JavaScript-free cross-document version
```

tsup builds seven entries: `index`, `react`, `tanstack`, `svelte`, `vue`, `astro` and `vanilla`. Each entry gets its own minified bundle with code splitting off, so importing one adapter never pulls another adapter's code. The package declares `sideEffects: false` so a bundler can drop re-exports an app does not use.

glimm, react, vue, svelte, astro and `@tanstack/react-router` stay external. The router libraries are optional peer dependencies.

## Example apps

`examples/frameworks` has one small app per adapter, all rendering the same two pages:

```bash
pnpm dev:examples
```

| App      | Adapter                   | Port |
| -------- | ------------------------- | ---- |
| vanilla  | `glimm-adapters/vanilla`  | 4601 |
| react    | `glimm-adapters/react`    | 4602 |
| vue      | `glimm-adapters/vue`      | 4603 |
| svelte   | `glimm-adapters/svelte`   | 4604 |
| tanstack | `glimm-adapters/tanstack` | 4605 |
| astro    | `glimm-adapters/astro`    | 4606 |

See `examples/frameworks/README.md` for what to look for and how to run one app at a time.

The apps build into the docs site under `/example/<framework>`. Each Vite app sets its build base to `/example/<framework>/` and passes the same value to its router. Astro sets `base` in `astro.config.mjs`. Dev servers stay at the site root, so `pnpm dev:examples` opens on `http://localhost:4601/`.

## Docs site

`apps/web` runs Astro with Tailwind, React (compiler on), astro-themes dark mode, astro-seo and a sitemap. Local dev goes through portless:

```bash
pnpm dev   # https://glimm-adapters.localhost
```

The site deploys to Cloudflare Workers through `@astrojs/cloudflare`, configured in `apps/web/cloudflare.config.ts` and the `cf` CLI.

```bash
pnpm --filter web build
pnpm --filter web deploy
```

To ship the framework apps under `/example/<framework>` on the same worker, stage them first:

```bash
pnpm build:web:full   # build:lib + build:examples + stage:examples + web build
pnpm deploy:web:full  # same, then deploy
```

`.github/workflows/deploy-web.yml` runs that pipeline on push to `main` (production deploy) and on pull requests (a preview worker via `cf previews deploy`). It needs the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets.

The build renders the share cards with Takumi into `public/og.png` and `public/og-changelog.png`. Requests never render them. To refresh them without a full build:

```bash
pnpm --filter web og
```

### Preview deployments

Preview URLs are private. A Worker-level Access application with a `preview_worker` destination covers every preview URL of `glimm-adapters` and leaves the production `workers.dev` hostname public. An anonymous request to `https://pr-<number>-glimm-adapters.atybdot.workers.dev` gets a login redirect, and the workflow fails any preview that answers with something else.

This is account setup, not repo setup. Take the Worker id from `cf workers scripts search --name glimm-adapters` and create the application:

```bash
cf zero-trust access applications create --body '{
  "type": "self_hosted",
  "name": "glimm-adapters previews",
  "destinations": [{ "type": "preview_worker", "worker_id": "<worker id>" }],
  "policies": [
    {
      "decision": "allow",
      "name": "Owner",
      "include": [{ "email": { "email": "<your email>" } }]
    }
  ]
}'
```

GitHub does not run `pull_request` workflows while a pull request has merge conflicts, so a conflicted PR gets `ci` from the branch push and no preview until the branch is up to date.

## Release

`scripts/publish.mjs` owns the version, the changelog and the `release-*` tag. It refuses to release from a branch other than the default branch, because `release.yml` only publishes tags reachable from that branch.

```bash
pnpm publish:release -- patch   # 0.1.0 -> 0.1.1
```

Write `release-notes/<version>.md` first to curate the entry. Without it, the script groups conventional commits since the last release tag. The script runs the check suite, writes and format-checks the version and changelog, commits, tags and pushes. CI publishes to npm and creates the GitHub release from the changelog entry, so the release appears only after the guard passes.

npm publishing uses a short-lived OIDC credential instead of a stored token. The package needs a one-time trusted publisher setup:

```bash
npm login
npm trust github glimm-adapters \
  --file release.yml \
  --repo atybdot/glimm-adapters \
  --allow-publish
```

`npm trust` landed in npm 11.15.0. Older npm rejects the subcommand's arguments with `github is not a valid keyword`, so upgrade or run it through npx:

```bash
npx -y npm@^11.15.0 trust github glimm-adapters \
  --file release.yml \
  --repo atybdot/glimm-adapters \
  --allow-publish
```

`npm trust ... --dry-run` prints the entry it would write, which is the quickest way to confirm the package, file and repository first.

The entry must name repository `atybdot/glimm-adapters` and workflow `release.yml`, with no environment. The workflow does not set `environment`, so a trust entry that asks for one rejects the token with `OIDC permission denied for this action`. Check existing entries with `npm trust list glimm-adapters` and revoke a stale one with `npm trust revoke glimm-adapters --id=<id>`.

The GitHub release job does not wait for the npm publish. A registry failure leaves the notes on the tag instead of hiding them.

## CI

- `ci.yml` runs format check, lint, typecheck, test and build on every push and pull request.
- `deploy-web.yml` deploys the docs site on push to `main` and comments a preview URL on pull requests.
- `release.yml` runs the same checks plus `pnpm publish`, only on manual dispatch or a `release-*` tag. Prerelease versions publish under the `next` dist-tag.
