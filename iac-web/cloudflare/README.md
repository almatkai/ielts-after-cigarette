# IELTS DEV on ordinary Cloudflare Workers

## Current availability — 2026-10-28

**Database-dependent DEV routes are temporarily unavailable because the shared
Cloudflare Free SQLite read allowance is exhausted.** The observed guest API
returns `503`, `Cache-Control: no-store` and `Retry-After` until
**2026-10-29 00:00 UTC (05:00 Almaty)**. The earlier `/app/` HTML request returned
`200`; healthy responses continue unchanged. No paid upgrade or VPS fallback was
introduced. Quota reset and affected routes still require a later confirmation.

[quota-boundary-acceptance.json](quota-boundary-acceptance.json) records the
current deployment, exact preserved binding/variable digests, six local boundary
checks and one native API check after deployment. Only the exact platform Free
row read/write quota exception is surfaced through the private frontend proxy;
the frontdoor converts it to a Russian `503` response. Other proxy failures keep
the existing `502`, and unknown frontdoor errors still propagate.

## Public cutover — 2026-10-28

**https://ielts.woolet.cc/app/** now serves the selected DEV frontend through
Cloudflare Workers. The existing Google/Turnstile hostname and cookie authority
are retained. The old `ielts-dev` VPC proxy has been replaced with a minimal
private service binding to `ielts-web-dev`; no VPS/VPC fallback remains in either
frontend Worker. Production is unchanged.

The frontend release is source **b05d0622b7bfcc44dcddad3544c6e6d565041019**,
compiled for **https://ielts.woolet.cc**, from this immutable artifact:

```text
.cloudflare-artifacts/b05d0622b7bfcc44dcddad3544c6e6d565041019/3d0344c05551/source
```

Its manifest SHA-256 is
`56cd3811339f523ff499972ea920e5df519f2853047851e8804d4ece0030ec73`.
Tooling commit is `2235e1f390e7c9253c1902dd06d77e4a70653c9c`, with
`toolingWorktreeDirty:false`. All **416 archived Git files** remain byte-identical;
only the three reviewed tooling overlays are additive. **201 SSR asset references**
were checked. The build is a new Vite/Nitro build for the canonical origin, not a
string replacement or reuse of a differently configured compiled bundle.

Current deployment receipts:

| Component       | Version                                | Role                                                                     |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| `ielts-web-dev` | `fd7c12cf-8fde-40da-85b5-afdbac72df38` | Canonical redirects, assets, private API forwarding and `IELTSRender` DO |
| `ielts-dev`     | `545dbb5f-2d92-4f07-9eaf-c2b8904cf2a7` | Existing custom-domain frontdoor, private `DEV_WEB` service binding      |

The current frontend deployment is `2d26d787-481e-4716-88e2-fe9bc5d51239`;
the frontdoor deployment is `894fa976-4137-4ca9-b25f-434f6a618993`. Both kept all
existing bindings, runtime variables and secret counts unchanged. Workers aliases
retain the canonical authority/path/query policy; the only behavior change is
the exact quota-error boundary. The historical 82-request public acceptance
receipt below predates quota exhaustion and pins the prior deployed artifact.

The backend cutover receipt supplied by root reports **50 application tables,
15,540 rows, 52 objects (approximately 278 MB) and 68 coordination keys** imported,
checksum-verified and activated in native SQLite DO/blob storage. This frontend's
receipt independently verifies public API/catalog behavior; it does not repeat
that full data reconciliation. Root stopped all ten IELTS DEV containers, including PostgreSQL/Redis/MinIO and
the two legacy databases, and set their restart policy to `no`. Their volumes
and original restart policies remain privately retained for reconciled rollback. No frontend request depends on them.

## Runtime and resource boundary

`ielts-web-dev` serves static assets and streams `/api/v1/*` through private
`IAC_DEV_BACKEND → ielts-api-dev`. `IAC_DEV_BACKEND_ORIGIN` is the native API
Workers origin used for URL construction, never a VPS address. Rendering executes
in the SQLite-backed `IELTSRender` Durable Object under its separate Free CPU
budget. The renderer owns no application data. The frontdoor has no DO migration
or database and forwards the original request authority/body to `DEV_WEB`.

There is no Container, R2 subscription, paid Workers upgrade or VPC connection
in this frontend architecture. SQLite DO/blob and the private audio Worker belong
to the backend. The source Node/Docker build, application package/lockfile, UI,
selective SSR rules and source features remain unchanged.

The deployed frontend bundle is **10,314.23 KiB uncompressed / 1,776.23 KiB gzip**.
Wrangler's actual deployment reported **17 ms module startup**. Successful native
requests below establish the checked paths; they do not measure worst-case
isolate memory, provider flows, arbitrary concurrency or all shared-account quotas.

## Native public acceptance

[public-acceptance.json](public-acceptance.json) records the prior pinned release,
artifact digest, runtime overrides and **82 historical successful asserted HTTP checks**.
It was not overwritten or replayed during the current quota incident.
Only public response sizes/digests, status, route, asset parity and cleared-cookie
attributes are recorded. No authorization header, cookie value, personal row or
raw response body is written.

Checks cover:

- Both `ielts-dev` and `ielts-web-dev` Workers aliases redirect GET/HEAD to the
  canonical origin with unchanged path/query.
- Canonical root redirect; actual SSR documents for `/app/`, login, practice and
  full mocks; the intentionally disabled public blog retains its source SSR 404.
- Every JS/CSS reference found in those documents plus favicon, brand image and stylesheet font returns the exact
  immutable artifact bytes. Browser asset and API origin use the canonical host.
- Guest configuration is enabled with a configured Turnstile site key; all four
  public listening/reading/writing/speaking catalogs respond successfully.
- Anonymous and invalid-Bearer profile reads reject with 401. Refresh without a
  cookie rejects with 401. Unauthenticated logout returns 204 and host-only,
  Secure, HttpOnly, expired refresh-cookie attributes.

The checks use a normal Mozilla user-agent. The existing custom-domain protection
can reject a default Python urllib user-agent; no protection was changed.
No Google authorization, Turnstile challenge, guest trial, account creation,
authenticated session, paid provider or audio conversion was performed. Real
browser hydration and successful external-provider interoperability remain
separate acceptance boundaries. The cookie check deletes only an absent caller's
cookie; it does not revoke a real user's session.

Run the pinned release check deliberately from `iac-web/`:

```sh
node scripts/cloudflare-public-acceptance.mjs
```

Its version identifiers come from the deployment receipts and intentionally bind
this release; update that pinned evidence for a subsequent release. This is not
control-plane version discovery.

## Rebuild and local verification

The approved public origins are the exact DEV host `https://ielts.woolet.cc` and
`https://ielts-web-dev.kairatovalmat2003.workers.dev`; arbitrary aliases and
production hosts are rejected. A local HTTP loopback origin is also allowed.
The build reads no `.env*`, defines the API/site origin explicitly and disables
Sentry for this separate DEV target.

Use Node 22.18+ with pnpm 10.18.3 (this release used Node 26.7.0):

```sh
pnpm install --frozen-lockfile
pnpm run setup:cloudflare
pnpm run test:regression
pnpm run artifact:cloudflare --revision b05d0622b7bfcc44dcddad3544c6e6d565041019 \
  --frontend-origin https://ielts.woolet.cc --rolldown-wasm
node --test cloudflare/entry.test.mjs
node scripts/cloudflare-smoke.mjs /absolute/new-artifact/source
```

The archive builder does not switch branches or create a worktree. It exports the
chosen Git revision, installs its own frozen lockfile and preserves every tracked
application byte. Its three overlays are `vite.cloudflare.config.ts`,
`cloudflare/worker.mjs` and `wrangler.cloudflare.json`. The manifest includes
source/archive/tooling/lock/builder/adapter digests, versions, origin and checks.
An existing artifact is never overwritten. The original `5b01787bcd76` and the
intermediate `2071f0a534f0` artifacts remain historical proof, not this release.

On this host, native addons stalled in macOS dyld code validation. The build-only
adapter uses official matching Wasm distributions: Rolldown 1.1.5/1.2.1, Tailwind
oxide 4.3.3 and Lightning CSS 1.32.0/1.33.0. Rolldown 1.2.1's compatible Wasm
runtime is pinned to 1.2.2. Dependencies and overrides are isolated under
`cloudflare/`; the application's dependency graph remains frozen.

The adapter temporarily preloads the supported `NAPI_RS_NATIVE_LIBRARY_PATH`
override for each matching Rolldown/oxide module and restores it before other
imports. This avoids 1.1.5's native attempt before its FORCE_WASI check. A
build-only Node resolve hook models the supported absence of optional `fsevents`
(no build watcher) and selects each matching Lightning CSS Node Wasm entry. No
native binary, signature, quarantine attribute or macOS security control changes.

Local evidence passed: **42 selected-source regressions, 37 tooling-checkout
regressions, two native workerd entry tests, full SSR/static/API/cookie/redirect
smoke, 201 asset-reference checks, formatting, targeted ESLint, frozen tooling
install and Wrangler dry-run**. The local smoke generates and removes an isolated
config without the live API service binding, so its ephemeral fixture backend
cannot contact the imported DEV database. The private-binding entry tests run
real workerd with a synthetic backend. These do not replace the native receipt.

## Sources and operational ownership

- Repository-required TanStack guidance:
  `npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/deployment`.
- [Rolldown Wasm distribution](https://rolldown.rs/guide/getting-started),
  [Lightning CSS Wasm](https://lightningcss.dev/docs.html), and the pinned installed
  packages' actual loader APIs, not unpinned framework assumptions.
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/),
  [service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/),
  [Static Assets](https://developers.cloudflare.com/workers/static-assets/), and
  the shipped pinned Nitro Cloudflare runtime.

Only DEV deployment is authorized here. Production push/merge/deploy and billing
changes require their separate authorization. Root owns complete backend/storage
receipts, remaining VPS retirement and monitoring; this document records the
frontend cutover and its exact tested limits.
