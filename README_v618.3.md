# Sales Tracker v618.3 — Data & Persistence Certification

v618.3 keeps the same Sales Tracker feature layer and UI while establishing one canonical data interface over the proven persistence/cloud engines.

## Upload to GitHub
Upload the **entire folder contents**, not only `index.html`.

Required structure:

```text
SalesTracker/
├── index.html
├── ARCHITECTURE_MANIFEST.json
├── README_v618.3.md
├── VALIDATION_REPORT_v618.3.md
├── assets/
│   └── js/
│       ├── tcp-runtime-v618.3.js
│       ├── tcp-router-v618.3.js
│       ├── tcp-architecture-v618.3.js
│       └── services/
│           ├── tcp-persistence-engine-v550.js
│           ├── tcp-cloud-engine-v613.js
│           └── tcp-data-v618.3.js
└── tests/
    ├── test_persistence_roundtrip.js
    ├── persistence_roundtrip_result.json
    └── static_validation.json
```

## What changed
- The v550 verified IndexedDB persistence engine was moved out of `index.html` into its own file **without changing its code**.
- The v613 serialized GitHub cloud engine was moved out of `index.html` into its own file **without changing its code**.
- `tcp-data-v618.3.js` now owns the app-level data API: readiness, save, active/previous load, restore, rollback, cloud save/load, diagnostics and certification.
- Manual and automatic cloud-save entry points now pass through v618.3, which commits a verified local snapshot before cloud upload.
- The old v616.2 five-minute cloud scheduler is disabled when v618.3 is active; v618.3 owns the single safety schedule.
- Admin → Data gains a v618.3 Data Certification panel with **Run certification** and **Save + certify** controls.

## What did not change
- The v550 persistence algorithm itself.
- The v613 cloud serialization algorithm itself.
- Existing sales formulas, dashboards, rep workflows, reports, games, forecasting, coaching, HR, production tools or visual design.
- Historical data is not automatically rewritten.

## Calls vs. customers-called note
The audit found historical weekly records where `calls` and `acctsCalled` are the same value. v618.3 reports this as a compatibility condition but **does not automatically reinterpret or migrate those records**, because doing so without a separate source would invent data. This will be handled as a business-data contract decision rather than a blind migration.

## Real-device certification
After deploying, open **Admin → Data** and run **Save + certify** on the computer/browser that normally holds the tracker. That verifies the actual browser IndexedDB snapshot and rollback copy in the real environment.
