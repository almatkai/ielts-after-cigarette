# IELTS frontend: DEV Workers migration

## Runtime update — 2026-10-28

DEV deployment is authorized. The selected `b05d0622b7bfcc44dcddad3544c6e6d565041019`
frontend has been deployed to `ielts-web-dev.kairatovalmat2003.workers.dev`.
This is a candidate, not a completed cutover: API remains explicitly unavailable
until the verified native backend/data deployment is connected. The old DEV proxy
and VPS are still serving their existing environment.

The entry now forwards SSR to the SQLite-backed `IELTSRender` Durable Object.
The Free plan provides a separate DO CPU budget; ordinary ingress only handles
redirects, streams API requests and serves Workers Static Assets. Rendering owns
no application database or object data. The existing real-workerd integration
suite passes through this rendering boundary, including deep routes and headers.
No application source, dependency lockfile, UI or SSR policy is changed.

Use `IAC_DEV_BACKEND` as a Workers service binding for the native API, together
with its origin in `IAC_DEV_BACKEND_ORIGIN`. R2 and a VPC/VPS connection are not
required by the frontend. Root is preparing a SQLite DO blob backend so no R2
subscription is needed for DEV media either. No paid plan has been enabled.

The original preparation evidence below describes the initial tooling commit;
its pending authorization and architecture decisions are historical. Real data,
auth/provider configuration, platform acceptance and final cutover remain open.

This is local deployment tooling, not a completed migration. The only configured
future Worker name is **`ielts-web-dev`**. No account, route, custom domain, VPC
service, Container, database or production binding is configured here.
Do not deploy this configuration over the existing `ielts-dev` proxy Worker.
That Worker and its `ORIGIN` VPC binding remain separate.

The Node/Docker path (`pnpm build`, `vite.config.ts`, Dockerfile, application
dependencies and their lockfile) is unchanged. Wrangler 4.151.0 has its own
package and lockfile under `cloudflare/` so its optional dependencies do not
change the existing Nitro/Vite dependency graph.

## Local validation

Run from `iac-web/`, using Node 22.18+ and pnpm 10.18.3. Validation here used
Node 26.7.0. Install the application and the independent deployment tools:

```sh
pnpm install --frozen-lockfile
pnpm run setup:cloudflare
pnpm run test:regression
pnpm run build:cloudflare
WRANGLER_SEND_METRICS=false CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV=false pnpm run check:cloudflare
pnpm run test:cloudflare
```

`check:cloudflare` runs **only `wrangler deploy --dry-run`**. The smoke command
starts local workerd on 127.0.0.1:8787 and an ephemeral local HTTP backend, then
stops both. The port must be free. It tests actual HTTP traffic through workerd:
SSR documents and route handling, JS/CSS/PNG assets, API request method, query,
body, authorization and cookies, separate Set-Cookie headers, backend redirects,
binary blog media, and the blog API. The public blog intentionally remains
disabled by the application and keeps its SSR 404; login remains `ssr:false`
with a server-rendered document/head. This does not exercise a live OAuth login,
browser hydration, production data, or an actual VPC binding.

For interactive local use, build first, then run `pnpm run dev:cloudflare`.
With no backend configured, `/api/v1/*` returns 503 explicitly. To connect to
your own local DEV API, pass the public, non-secret origin directly:

```sh
pnpm run dev:cloudflare --var IAC_DEV_BACKEND_ORIGIN:http://127.0.0.1:8080
```

The build does not read `.env*` (`envDir:false`). It explicitly defines the API
and canonical site origin, and disables Sentry for this separate dev build.
It does not inherit `VITE_*` build settings. The default frontend origin is
`http://127.0.0.1:8787`; do not publish that local artifact. For a future public
artifact, explicitly set the actual **`ielts-web-dev`** HTTPS origin with
`IAC_CF_FRONTEND_ORIGIN`. Other public frontend names are rejected to reduce
the risk of confusing this preparation with production or the existing proxy.

## Preserve the selected DEV feature set

This task branch starts at `origin/main` and contains only deployment tooling.
Its ordinary build is **not a substitute for live DEV application code**.

The observed image tag `iac-web:guest-dev-adaptive-b05d062` refers to candidate
source commit **`b05d0622b7bfcc44dcddad3544c6e6d565041019`**, which exists locally.
The previously checked-out branch points at
**`afa0aef63caab19e5b637db0f8887ab24d49e26d`**. These are different feature sets.
The image tag alone does not establish build provenance. Before rollout the
owner must choose the full commit that matches the intended DEV release and
confirm it against image build metadata. Do not silently select `main` or the
newest branch tip instead.

Build that exact revision without switching branches or creating a checkout or
worktree:

```sh
pnpm run artifact:cloudflare --revision b05d0622b7bfcc44dcddad3544c6e6d565041019
```

For a future public candidate (still local build and dry-run only):

```sh
pnpm run artifact:cloudflare \
  --revision b05d0622b7bfcc44dcddad3544c6e6d565041019 \
  --frontend-origin https://ielts-web-dev.kairatovalmat2003.workers.dev
```

The builder exports **only `iac-web/`** using `git archive` into an ignored
`.cloudflare-artifacts/<source-sha>/<build-key>/source/` directory with no `.git`.
It overlays only the separate Cloudflare Vite config, Worker entry and Wrangler
config. It does not replace or edit the archived application package, lockfile
or source. It installs the selected revision's own dependencies with
`--frozen-lockfile`, runs its regression suite, builds, runs Wrangler dry-run,
and verifies every archived tracked file is byte-identical after the build.
It also verifies that every emitted SSR JS/CSS asset URL exists in the shipped
static assets. The separate Vite config scopes Tailwind's content detection to
`src/` by annotating its CSS import in memory. An archive inside an ignored
directory otherwise causes automatic detection to scan dependencies/generated
files, changing the stylesheet hash between client and server builds. No
stylesheet or application source file is edited on disk.
An incompatible revision or a generated source change causes failure rather
than a silent application modification. An existing artifact directory is
never overwritten; retain it for review or explicitly remove only that generated
artifact before repeating an identical build.

`manifest.json` records the source SHA/archive checksum, tooling commit and
dirty flag, tooling file/builder/lockfile checksums, frontend origin and tool
versions. Content hashes identify uncommitted tooling precisely; use committed
tooling for a release candidate. The build key also includes the tooling commit
and frontend origin. This is reproducible source selection and locked dependency
resolution, not a promise of byte-for-byte identical timestamps in Vite/Nitro
metadata across machines.

Use `pnpm run test:cloudflare -- <absolute-artifact-source-directory>` to run
the same local integration checks against an artifact built for the local
origin. A public-origin artifact needs its own matching host setup and approved
backend for end-to-end testing. Do not rewrite the compiled origin in an
existing artifact.

## Runtime and backend decisions

- Vite and the router keep `/app/`. Nitro's `cloudflare_module` preset emits
  `.output-cloudflare.local/server/` and `.output-cloudflare.local/public/app/`.
  The `.local` suffix is also covered by the original revisions' ignore rules;
  the explicit Tailwind scope keeps archive builds independent of Git discovery.
  The configured asset root is the parent `public/`, preserving `/app/` URLs.
  Nitro's automatic Wrangler configuration/redirect generation is disabled.
  Every command names `wrangler.cloudflare.json` explicitly.
- The small Worker entry redirects `/` and `/app` to `/app/`, delegates frontend
  rendering and assets to Nitro, and forwards **all `/api/v1/*`** paths,
  including Google form callbacks and blog media, before frontend routing.
  Static routing does not use SPA fallback to swallow API or SSR responses.
- The compiled API base is the frontend origin, so browser requests stay
  same-origin. Runtime `IAC_DEV_BACKEND_ORIGIN` selects an origin only; paths
  and query strings come from the request. It has no default remote endpoint.
  Direct public connections require HTTPS; plain HTTP is permitted only for
  loopback or an explicitly provided private binding. Invalid configuration
  returns 503 and a failed backend connection returns 502, without exposing
  origin details or credentials.
  `global_fetch_strictly_public` permits SSR loaders to fetch that public Worker
  origin without Cloudflare's same-zone Worker fetch restriction. Such a fetch
  makes one extra Worker invocation before reaching the configured DEV backend;
  it must be included in runtime-budget validation. The currently gated public
  blog does not execute its data loader, so that SSR data path is not exercised
  by the smoke suite.
- For a private DEV API, the owner can attach a real `vpc_services` binding named
  **`IAC_DEV_BACKEND`** after choosing the architecture, and set
  `IAC_DEV_BACKEND_ORIGIN` to its approved internal origin. The Worker then calls
  that binding's `fetch()` instead of public fetch. No binding ID or simulated
  successful VPC connection is checked in. The existing proxy's VPC service
  may target the full DEV reverse proxy; verify its route/port before reuse.
  Binding/service/tunnel configuration and its remote connectivity remain
  unvalidated here.
- Request bodies and responses stream. API responses use `Cache-Control:no-store`.
  The proxy preserves auth headers and cookies, sets forwarded host/protocol
  from the actual request, and removes incoming `Forwarded`. It returns redirects
  without following them, rewriting backend-origin locations onto the frontend
  origin. External OAuth redirects remain external. Cookie Domain attributes
  are removed so cookies belong to the frontend host; Path, Secure, HttpOnly and
  SameSite are retained. The real DEV API must trust the appropriate proxy and
  explicitly allow the new frontend origin/callback. Check Google OAuth,
  Turnstile host allowances if used, refresh/logout cookies, CSRF/CORS rules,
  blog uploads/media and authenticated routes before rollout. Credentials belong
  in approved runtime secret management, never in these files or an artifact.

## Limits and rollout gates

Local builds and dry-runs are not deployment, account validation or proof that
Free Workers can run this workload within runtime limits. Current Cloudflare
documentation lists a **64 MiB uncompressed bundle limit** on both Free and Paid
plans; the old 3 MB compressed Free limit was removed in September 2026.
Free still has **10 ms CPU per request**, **128 MB memory**, **1 second startup**,
**100,000 requests/day**, and up to **20,000 static assets**, each at most 25 MiB.
SSR CPU/memory/startup on the actual platform must be measured before approval;
local wall time is not billed CPU time. No paid plan, Container, R2, KV, D1 or
other paid resource is required or provisioned by this tooling.

Rollout remains blocked on the intended DEV source SHA/image provenance,
backend architecture and real DEV origin/VPC binding, allowed frontend/OAuth
hosts, runtime-limit validation, and explicit deployment permission. This does
not migrate the API, databases, object storage, jobs, AI processes or the VPS.
Production and the existing `ielts-dev` Worker must remain untouched.

## Primary guidance checked

- [TanStack hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)
  and the repository-required command:
  `npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/deployment`.
- [Nitro Cloudflare preset](https://nitro.build/deploy/providers/cloudflare),
  checked against the installed nightly's shipped docs and preset/runtime code:
  `nitro-nightly@3.0.1-20260731-205209-52abde8a`, Vite 8.1.5,
  TanStack React Start 1.168.32. No framework upgrades were made.
- [Wrangler assets configuration](https://developers.cloudflare.com/workers/wrangler/configuration/#assets),
  [Worker-first asset routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/),
  [Worker-to-Worker fetch](https://developers.cloudflare.com/workers/runtime-apis/fetch/),
  and [VPC binding API](https://developers.cloudflare.com/workers-vpc/api/).
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
  and [September 2026 bundle-limit change](https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/).
- [Tailwind explicit source detection](https://tailwindcss.com/docs/detecting-classes-in-source-files#setting-your-base-path).
