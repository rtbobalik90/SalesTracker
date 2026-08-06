# Sales Tracker v616 — Folder Build

This is a structural conversion of the approved **v615 Full-State Anti-Wipe Data Vault** build. It remains a plain static browser application. No framework, backend, storage key, state schema, or cloud-sync identifier was intentionally changed.

## Repository structure

- `site/index.html` — application markup and page shells
- `site/assets/css/app.css` — all 169 original style blocks in their exact cascade order
- `site/assets/js/legacy/` — all 112 original inline JavaScript blocks, loaded at their original execution positions
- `site/build-manifest.json` — source hashes and extracted-block map
- `tools/validate.mjs` — validates references and every JavaScript file
- `.github/workflows/pages.yml` — controlled Pages deployment of only the `site/` directory
- `.github/workflows/cancel-stuck-pages.yml` — manual recovery tool for an in-progress Pages deployment

## First GitHub setup

1. Extract this package and copy its contents into the repository root. Do not upload the ZIP itself.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**. This disables the old automatic `pages build and deployment (dynamic)` publisher.
3. Commit to `main`, then open **Actions → Deploy Sales Tracker**.
4. If GitHub reports an older deployment is still in progress, open **Actions → Cancel Stuck Pages Deployment → Run workflow**, paste the deployment ID from the error, and run it once.
5. Re-run **Deploy Sales Tracker**.

## Local check

Run:

```bash
node tools/validate.mjs
python -m http.server 8000 --directory site
```

Then open `http://localhost:8000`. Do not test by double-clicking `index.html`; an HTTP server more closely matches GitHub Pages.

## Safe migration approach

This v616 build externalizes existing code without rewriting it. That is deliberate: it protects current behavior and existing browser/cloud data. Future versions can gradually move `legacy/` files into named modules such as `core/storage`, `core/cloud-sync`, `pages/daily-sales`, and `pages/credit-memos`, one verified module at a time.
