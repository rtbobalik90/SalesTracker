# Sales Tracker v618.3 Validation Report

## Static validation
- 127 script tags found.
- 124 local/inline JavaScript payloads syntax-checked with Node.
- **0 JavaScript syntax errors.**
- 6 local external JavaScript files referenced and present.
- 3 CDN libraries remain external: Chart.js, SheetJS/XLSX and JSZip.
- **0** direct legacy `window.gt = function...` overrides in `index.html`.
- **0** direct legacy `window._rp2Go = function...` overrides in `index.html`.
- **0** source-level sub-second `setInterval` loops detected.
- **0** BODY-subtree MutationObservers detected.

## Exact engine extraction
The two trusted legacy engines were moved to separate files with byte-for-byte equivalent script content from v618.2:

- v550 persistence engine: exact extraction match — SHA-256 `025c70176dacee74f5b1b267fd08bc52a04fbe61b21c116a6052560ef6d380df`
- v613 cloud engine: exact extraction match — SHA-256 `007cc98e3abeff7edfceca406aae7ece847f3b1a1123566c59708159f405d413`

## Persistence round-trip test
A deterministic engine-level test executed the real extracted v550 code against an isolated in-memory IndexedDB implementation.

Passed sequence:
1. Boot verified persistence.
2. Save first state.
3. Verify first envelope.
4. Modify state.
5. Save second state.
6. Verify second envelope.
7. Confirm latest state is the active snapshot.
8. Confirm first state became the previous/rollback snapshot.
9. Restore the previous snapshot.
10. Confirm rollback applies to live state.
11. Confirm diagnostics report active and previous snapshots valid.
12. Load v618.3 canonical data facade.
13. Change live state again and request cloud save.
14. Confirm v618.3 committed the latest local state before invoking cloud save.
15. Run v618.3 certification with a verified write.

Result: **PASS**.

## Browser test limitation
The available Chromium installation is controlled by an enterprise URL policy that blocks local/file/test-site navigation and denies origin storage on the resulting error document. Because of that environment restriction, a full real-browser IndexedDB/localStorage integration test could not be run here without producing a false failure.

To close that gap, v618.3 includes an in-app certification panel under **Admin → Data**. Run **Save + certify** after deployment in the normal browser environment. This is the correct place to validate the actual production browser database.

## Data-contract warning retained intentionally
Historical data may contain weekly records where `calls === acctsCalled`. v618.3 detects and reports this but does not rewrite those values because there is no reliable historical source that can distinguish total call volume from unique customers reached.
