# Explainability Notes

## Decision rules in the app

## Assignment rule

- If the signed-in user does **not** have admin privileges, `assignedTo` is always set to that user.
- If the user **is** admin, `assignedTo` comes from the assignment dropdown.
- Dropdown options are sourced from `StaffDirectory` (and optional fallbacks), so assignment choices are explicit.

## Auto-inactive rule

- The app reads `OrgSettings.inactiveAfterDays`.
- If value is `0`, automatic inactive switching is disabled.
- If value is `> 0`, the app compares `updatedAt/createdAt` to the cutoff and sets `recordStatus = inactive` for stale `ReferralSummary` rows.
- Inactive status is visibly labeled in the Recent Contacts section.

## Time logging rule

- A time entry requires:
  - work date
  - positive hours
  - at least one category tag
- Categories are user-editable and shared.

## Referral source report (contacts / clients by agency)

- Uses `ReferralSummary` rows whose `createdAt` falls in the selected range.
- Optional “include inactive” filters on `recordStatus`.
- Mode chooses whether to count contacts, clients, or both (`recordType`).
- Bar lengths in the preview are relative to the largest bucket in that report (not a fixed scale).

## Hours-by-category report

- Uses `TimeLog` for the **current user** only, filtered by `workDate` in the selected range.
- If an entry has multiple categories, its `durationMinutes` is **split evenly** across those categories so category totals align with total logged time.
- Entries with no categories are counted under “Uncategorized” with the full duration.
- PDF export reuses the browser print path; JPG is rendered on a canvas from the aggregated data (not a screenshot of the whole page).

## SBPD / police CSV rule

- Only `ReferralSummary` rows with `recordType = contact` and `referralAgency` matching `VITE_SBPD_AGENCY_REGEX` (default matches SBPD / Santa Barbara Police wording) are loaded for the export list.
- Window is “last N days” by `updatedAt` (inclusive of recent edits).
- The downloaded file includes only **checked** rows; headers match the police worksheet column names expected by the workflow.
- On **new intake**, SBPD-specific Parse fields are sent only when the agency string matches the same SBPD regex (same as summary mirror).

## Error transparency

- Save and load operations write explicit status messages in the UI.
- If Sheets save succeeds but Back4App summary sync fails, user is shown a warning with failure reason.
