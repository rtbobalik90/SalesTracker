# Sales Tracker v616.1 — Root-Layout Folder Build

This is the approved **v615 Full-State Anti-Wipe Data Vault** build, split into folders. It is a plain static browser application: no framework, no backend, and **no application code was changed** — every JavaScript file, style block, storage key, and cloud-sync identifier is byte-identical to the v616 extraction of v615.

## What changed from v616 (and why it wasn't working)

The v616 package put the app inside a `site/` subfolder and required two things to go right at once: (1) the hidden `.github/workflows/` folder had to reach the repository, and (2) Pages had to be switched from "Deploy from a branch" to "GitHub Actions". Uploading through the GitHub web interface silently skips hidden folders, so the workflow never existed, Pages kept serving the repository root, and the root had no `index.html` — result: a broken site.

**v616.1 fixes this by moving the app to the repository root.** `index.html` and `assets/` sit at the top level, exactly where classic branch-based Pages already looks. It now deploys correctly with **zero settings changes**, and the Actions workflow is an optional upgrade rather than a requirement.

## Repository structure

- `index.html` — application markup and page shells
- `assets/css/app.css` — all 169 original style blocks in their exact cascade order
- `assets/js/legacy/` — all 112 original inline JavaScript blocks, loaded at their original execution positions
- `build-manifest.json` — source hashes and extracted-block map
- `version.json` — build identifier and top-level hashes
- `404.html` — bounces deep links back to the app root
- `tools/validate.mjs` — validates references and every JavaScript file
- `.github/workflows/pages.yml` — optional controlled Pages deployment
- `.github/workflows/cancel-stuck-pages.yml` — manual recovery for a stuck Pages deployment

## Shipping to GitHub — simple path (recommended)

Your Pages settings stay exactly as they are today ("Deploy from a branch").

1. In the SalesTracker repository, delete the old `site/` folder if it exists from the v616 attempt.
2. Upload the contents of this package to the **repository root** (`index.html`, `assets/`, `tools/`, `404.html`, `build-manifest.json`, `version.json`). The hidden files (`.github/`, `.gitignore`, `.nojekyll`) are optional on this path — the site works without them.
3. Wait for the automatic "pages build and deployment" run to finish (Actions tab), then open the site. Hard-refresh (Ctrl+Shift+R) once so the browser drops the cached single-file version.

Your localStorage and cloud data are untouched: the site URL, origin, and every storage key are identical to the single-file build, so all existing tracker data loads as-is.

## Shipping to GitHub — Actions path (optional)

Only if you want validated, atomic deploys. Requires pushing with git (the web uploader cannot create the hidden `.github` folder):

```bash
git clone https://github.com/rtbobalik90/SalesTracker.git
# copy this package's contents into the clone, including .github/
git add -A && git commit -m "v616.1 root-layout folder build" && git push
```

Then in **Settings → Pages** set **Source** to **GitHub Actions**. The workflow validates the build before every deploy. All four pinned actions (`checkout@v7`, `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`) are current as of mid-2026.

## Local check

```bash
node tools/validate.mjs
python -m http.server 8000
```

Then open `http://localhost:8000`. Do not test by double-clicking `index.html`; an HTTP server matches GitHub Pages behavior.

## Safe migration approach

This build externalizes existing code without rewriting it. That protects current behavior and existing browser/cloud data. Future versions can gradually move `assets/js/legacy/` files into named modules such as `core/storage`, `core/cloud-sync`, `pages/daily-sales`, and `pages/credit-memos`, one verified module at a time.
