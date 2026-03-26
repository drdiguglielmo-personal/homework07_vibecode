# Architecture Overview

## Frontend

- Vite + vanilla JS single-page app.
- Entry files:
  - `index.html`
  - `main.js`

## External services

- **Back4App (Parse):**
  - Auth/session
  - Staff roster (`StaffDirectory`)
  - Recent referral mirror (`ReferralSummary`), including optional SBPD/police-reporting columns used only for in-app + CSV export (not written to Sheets)
  - Time tracking (`TimeCategory`, `TimeLog`)
  - Case notes (`CaseNote`, pointer to `ReferralSummary`)
  - Org-level setting (`OrgSettings`)
- **Google Sheets (Apps Script Web App):**
  - Full referral record storage and retrieval actions.

## Runtime paths

- Local development:
  - `main.js` calls `/api/sheets` (proxied in `vite.config.js`) when `VITE_SHEETS_API_URL` is configured.
- Production:
  - App calls the Apps Script URL directly (from `VITE_SHEETS_API_URL`).
- Optional Netlify serverless:
  - `netlify/functions/staff-users.js` for server-side user listing using Parse master key.

## In-app reporting (client-side)

- **Referral source report:** aggregates `ReferralSummary` by `referralAgency` over week/month/year/custom; preview in-page; “Export PDF” opens a print dialog (save as PDF).
- **Hours-by-category report:** queries `TimeLog` for the signed-in user and `workDate` range; sums minutes per category (duration split evenly across categories on each entry); preview + print-to-PDF + canvas-based JPG download.
- **SBPD CSV:** queries `ReferralSummary` (`recordType = contact`, agency matches `VITE_SBPD_AGENCY_REGEX`, `updatedAt` within “days back”); user selects rows; CSV is built in the browser (UTF-8 BOM) and downloaded.

## Deployment

- Netlify static deploy (`dist`) with SPA redirect (`netlify.toml`).
