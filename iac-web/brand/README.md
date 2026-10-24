# Yrys Academy artwork

`source/` contains the two supplied PNGs unchanged. The 1142×1377 file is the stacked logo; the 2000×667 file is horizontal. The horizontal visible-body ROI is `(144, 70, 1831, 611)` (1687×541), excluding an isolated alpha=1 dot at y=49; the supplied source stays byte-identical. Other transparent bounds are cropped; the mark is the first nonempty band of the stacked source (rows 8–719). No paths, lettering or spacing are redrawn.

Build from `iac-web` after `pnpm install`:

```sh
python3 -m venv .brand-venv
.brand-venv/bin/pip install -r brand/requirements.txt
.brand-venv/bin/python brand/build-assets.py
```

Pillow, fontTools and Brotli are pinned in `requirements.txt`. Golos outlines for OG text come from the installed fontsource package. `public/brand/` includes native PNG/lossless WebP and display PNGs at 1×/2×. White variants replace RGB with white while preserving the source alpha exactly. Source images are outside `public/` and do not ship in the client bundle.

Icons use a white mark on the requested blue `#3C82F6`. Apple and maskable icons are opaque; their corners are masked by the OS. The webmanifest preserves the Vite `/app/` scope. OG files have the supplied stacked artwork, real Golos text and `ielts.yrys.academy`; the KK image is provided for integration, while this application currently has no `/kk/` routes.

For browser evidence, run:

```sh
YRYS_REVIEW_DIR=/tmp/yrys-app-review pnpm exec playwright test tests/yrys-theme.spec.ts
```

The test checks all six requested widths, both themes, stored/system theme changes, visible focus, loaded artwork, key computed contrast pairs and study screen overflow. Screenshots include mobile navigation, authentication, results, Reading and the assistant. Fixtures only replace API responses inside tests.

Legal prose changes only replace the service name. This is a legally significant edit to the offer and privacy policy; the owner should confirm it before release.
