# Accountability Notes

## Purpose

This document describes who can perform actions, where data is stored, and how to audit behavior in the prototype.

## Roles and permissions

- **Social worker**
  - Can sign in, create referrals, log time, edit shared categories.
  - Referral assignment is forced to self in the UI.
- **Admin**
  - Can assign referrals to other staff.
  - Can update the auto-inactive rule (`OrgSettings.inactiveAfterDays`).

## Data ownership and storage

- **Google Sheets (via Apps Script):** full referral payload (source of truth for complete intake record).
- **Back4App `ReferralSummary`:** reduced fields used for recent-list UX, plus optional SBPD/police fields (`dateContactAttempted`, Yes/No strings, address correction text, etc.) when staff use intake or the per-card “SBPD fields” editor.
- **Back4App `TimeLog` + `TimeCategory`:** time tracking records and category catalog.
- **Back4App `StaffDirectory`:** assignable roster entries.

## Audit points

- Session identity from Back4App `users/me`.
- `lastModifiedBy` on referral summary rows.
- `updatedAt` timestamps used for recent list and auto-inactive checks.
- Time entries include author pointer (`TimeLog.user`), date, duration, categories, and notes.
- **Reports and CSV** run in the browser under the signed-in session; exports are files on the user’s machine—there is no separate “public reports” publishing step in this prototype.
- **SBPD CSV** only includes rows the user loads and checks; column values come from `ReferralSummary` fields edited in-app.

## Known prototype limitations

- Not Google OAuth-based yet (Back4App username/password auth).
- Some classes use broad ACL/CLP for prototype speed.
- Auto-inactive currently updates Back4App summaries, not the full Sheets row.
