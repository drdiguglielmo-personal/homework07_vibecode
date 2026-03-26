# Notes and Reporting application for an NGO

Prototype web app for referral intake, assignment, and time logging for social workers/admins.

## Repository organization

- `index.html` - UI markup and styles
- `main.js` - app logic (auth, referrals, assignment, summaries, time logs, reports, SBPD CSV export)
- `apps-script/Code.gs` - Google Apps Script endpoint for Google Sheets writes/queries
- `netlify/functions/staff-users.js` - optional server-side staff lookup via Parse master key
- `docs/` - accountability, explainability, and architecture documentation
- `.env.example` - environment variables and Back4App class setup notes
- `vite.config.js`, `netlify.toml` - local/prod runtime configuration

## Local development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Core workflow

1. User signs in/registers with Back4App.
2. Social worker/admin saves a referral (full row in Sheets).
3. App mirrors key fields to Back4App `ReferralSummary` for fast in-app list rendering.
4. Admin assigns clients via dropdown populated from Back4App `StaffDirectory`.
5. Team logs hours in `TimeLog` with one or more `TimeCategory` tags.
6. **Reports (local only):** contacts/clients by referral source (print-to-PDF); hours by category over a chosen period (print-to-PDF + JPG download). Nothing is published to a public URL.
7. **Police (SBPD) CSV:** for contacts whose agency matches a configurable regex (default SBPD / Santa Barbara Police), staff can record optional SBPD fields on `ReferralSummary`, then load recent rows and export a selected subset as CSV for department reporting.

## Accountability and explainability

This project is documented so each automated decision is inspectable:

- Assignment behavior is role-based (`admin` vs `social_worker`) and visible in UI.
- Auto-inactive is controlled by a single configurable value in `OrgSettings`.
- Data flow is explicit: full referral in Sheets, summary in Parse, time logs in Parse.
- Class/ACL assumptions and required permissions are documented in `.env.example` and `docs/`.

See:

- `docs/ACCOUNTABILITY.md`
- `docs/EXPLAINABILITY.md`
- `docs/ARCHITECTURE.md`
