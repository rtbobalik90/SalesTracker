# Sales Tracker v542 Product Catalog Bundle

Place these files in the same GitHub repository as the standalone tracker.

## Files

- `product-catalog.json` — same-origin feed consumed by the tracker
- `catalog-product-urls.txt` — individual product pages to synchronize
- `catalog-category-urls.txt` — listing/category pages whose product links should be discovered
- `scripts/sync_product_catalog.py` — website parser
- `.github/workflows/sync-product-catalog.yml` — nightly/manual GitHub Action

## Setup

1. Copy the bundle contents into the repository root.
2. Add more official product or category URLs to the two source lists.
3. In repository **Settings → Pages**, set the source to **GitHub Actions**.
4. Open **Actions → Sync product catalog and deploy Pages → Run workflow**.
5. Confirm `product-catalog.json` is updated and the Pages deployment completes.
6. Open the tracker and choose **Product Catalog → Sync catalog feed**.

No customer data, Gist token, GitHub personal-access token, or tracker activity is used by this workflow.
The catalog is separate from the customer-data Gist.


The workflow deploys the refreshed site directly because a commit made with the workflow `GITHUB_TOKEN` does not reliably trigger a second Pages build.
