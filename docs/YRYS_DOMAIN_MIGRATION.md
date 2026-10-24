# Production domain integration

Target topology: `https://ielts.yrys.academy/` landing, `/app/` app,
`/api/v1/*` Go API. The app retains Vite/Nitro/router `/app` bases.
The API build value is the origin only: the client appends `/api/v1`.

Set GitHub **production** variables `VITE_API_BASE_URL` and `VITE_SITE_URL`
to `https://ielts.yrys.academy`, then rebuild. Docker accepts `VITE_SITE_URL`
as a build argument; changing a running container's environment is insufficient.
An empty/unset `VITE_SITE_URL` uses the request/browser origin for local and dev
builds. Do not set the development Environment to the production origin.
`ielts.woolet.cc` and the separate GlitchTip host remain unchanged.

The complete staged cutover, owners, external prerequisites, old-host transition
and rollback are in **`ielts_landing/docs/YRYS_DOMAIN_MIGRATION.md`** in the
landing repository. DNS, certificates, Google/Turnstile consoles and release
are still external work. No database migration or secret/client rotation is
needed; old-domain cookies/localStorage do not cross domains.

## Combining with the independent Yrys rebrand

This branch starts at main and deliberately contains no rebrand assets, fonts
or broad rebrand commits. In the eventual approved combined release, retain the
new `links.ts` origin, optional canonical build wiring and empty-value fallback.
The current main root has no absolute OG host. The rebrand root and generator
exist only on `origin/feat/yrys-academy-rebrand` and still embed the old domain.

Apply the checked-in **minimal integration patch** only after those rebrand
files and their existing dependencies are present, from repository root:

```sh
git apply --check docs/rebrand-domain.patch
git apply docs/rebrand-domain.patch
cd iac-web
# Install the rebrand branch's locked JS dependencies first.
pnpm install --frozen-lockfile
python3 -m venv .brand-venv
.brand-venv/bin/pip install -r brand/requirements.txt
.brand-venv/bin/python brand/build-assets.py
```

The patch changes exactly three domain literals: `og:image`, `twitter:image`
in `src/routes/__root.tsx` to `https://ielts.yrys.academy/app/og-yrys.png`, and
the printed hostname in `brand/build-assets.py` to `ielts.yrys.academy`.
Do not copy generated Yrys assets into this domain-only branch. If already
patched, inspect the literals instead of applying the patch twice.

Review and commit the regenerated `public/og-yrys.png` and
`public/og-yrys-kk.png` in the combined release. The generator can also rewrite
icons/manifest/fonts: inspect its full diff and reject unrelated changes. Keep
the rebrand's Golos dependencies and approved source pixels; do not replace
them with main's assets. Inspect both 1200×630 cards visually, then rerun scoped
format/type/lint/build checks and confirm SSR OG URLs use the new host. The
host nginx static matcher includes `webmanifest` for the rebrand manifest.
Legal-page canonicals remain an independent SEO follow-up; this migration does
not change their rendering or indexing policy.
