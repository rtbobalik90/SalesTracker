# Sales Tracker v618.3.1 — Recovery Safe

This emergency build pauses automatic cloud saves and hardens the v550 persistence engine against catastrophic state shrinkage.

## Restore
1. Upload this entire build to the same GitHub Pages location.
2. Open `/recovery/`.
3. Select the recovered JSON downloaded from the read-only recovery scanner.
4. Verify the counts shown.
5. Click **Restore verified data**. The tool downloads a pre-restore emergency backup before writing.
6. Open the main app and reload once.

## Protection changes
- If active is dramatically smaller than previous, boot chooses previous.
- Normal saves are blocked if they would replace a populated verified snapshot with a drastically smaller state.
- Explicit restore/import/rollback/migration operations remain allowed.
- Automatic cloud scheduling is paused. Manual cloud work should remain off until data is visibly confirmed.
