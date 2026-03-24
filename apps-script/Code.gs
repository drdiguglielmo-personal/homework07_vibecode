/**
 * Google Apps Script Web App backend for this Vite app.
 *
 * Supports:
 * - GET  ?action=list&limit=50
 * - GET  ?action=findByName&clientNameLower=...
 * - POST { action: "create", record: {...} }  (Content-Type: text/plain is OK)
 *
 * Deploy as Web App:
 * - Execute as: Me
 * - Who has access: Anyone (or Anyone with the link)
 */

const SHEET_ID = "REPLACE_WITH_YOUR_SPREADSHEET_ID";
const SHEET_NAME = "Referrals";

function doGet(e) {
  return handleRequest_(e);
}

function doPost(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  const action = (e && e.parameter && e.parameter.action) || "";
  let body = {};
  if (e && e.postData && e.postData.contents) {
    try {
      body = JSON.parse(e.postData.contents);
    } catch (err) {
      // ignore: body stays {}
    }
  }

  const resolvedAction = action || body.action || "";
  try {
    if (resolvedAction === "create") {
      const record = body.record || {};
      const created = createRecord_(record);
      return json_({ ok: true, result: created });
    }
    if (resolvedAction === "list") {
      const limit = Number((e.parameter && e.parameter.limit) || body.limit || 50) || 50;
      const rows = listRecords_(limit);
      return json_({ ok: true, results: rows });
    }
    if (resolvedAction === "findByName") {
      const clientNameLower = String((e.parameter && e.parameter.clientNameLower) || body.clientNameLower || "")
        .trim()
        .toLowerCase();
      if (!clientNameLower) return json_({ ok: true, results: [] });
      const rows = findByName_(clientNameLower);
      return json_({ ok: true, results: rows });
    }
    return json_({ error: "Unsupported action" }, 400);
  } catch (err) {
    return json_({ error: String(err && err.message ? err.message : err) }, 500);
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const headers = [
    "createdAt",
    "updatedAt",
    "recordType",
    "role",
    "clientName",
    "clientNameLower",
    "clientPhone",
    "referralAgency",
    "referralDate",
    "referralContactPerson",
    "referralContactPhone",
    "referralContactEmail",
    "riskLevel",
    "underSupervision",
    "assignedTo",
    "additionalInfo",
    "charges",
    "recordStatus",
    "lastModifiedBy"
  ];

  const range = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn()));
  const firstRow = range.getValues()[0] || [];
  const existing = firstRow.map((h) => String(h || "").trim());
  const isEmpty = existing.filter(Boolean).length === 0;
  if (isEmpty) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }
  // If someone edited headers, we leave them as-is to avoid destroying data.
}

function createRecord_(record) {
  const sheet = getSheet_();
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headers = headerRow.map((h) => String(h || "").trim());
  const now = new Date().toISOString();

  const normalized = {};
  Object.keys(record || {}).forEach((k) => {
    normalized[k] = record[k];
  });
  normalized.createdAt = normalized.createdAt || now;
  normalized.updatedAt = now;
  normalized.clientName = String(normalized.clientName || "").trim();
  normalized.clientNameLower =
    String(normalized.clientNameLower || normalized.clientName || "")
      .trim()
      .toLowerCase();

  const row = headers.map((h) => (h ? normalized[h] ?? "" : ""));
  sheet.appendRow(row);
  return normalized;
}

function listRecords_(limit) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map((h) => String(h || "").trim());
  const data = values.slice(1);
  const out = data
    .filter((r) => r.some((c) => String(c || "").trim() !== ""))
    .map((r) => rowToObject_(headers, r));

  // Return most recent (updatedAt/createdAt) first
  out.sort((a, b) => {
    const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const db = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return db - da;
  });
  return out.slice(0, Math.max(1, limit));
}

function findByName_(clientNameLower) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map((h) => String(h || "").trim());
  const idx = headers.indexOf("clientNameLower");
  if (idx === -1) return [];

  const out = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const v = String(row[idx] || "").trim().toLowerCase();
    if (v && v === clientNameLower) out.push(rowToObject_(headers, row));
  }
  return out;
}

function rowToObject_(headers, row) {
  const obj = {};
  for (let i = 0; i < headers.length; i++) {
    const key = headers[i];
    if (!key) continue;
    obj[key] = row[i];
  }
  return obj;
}

function json_(obj, status) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  // CORS
  output.setHeader("Access-Control-Allow-Origin", "*");
  output.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  output.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (status) output.setHeader("X-Status", String(status));
  return output;
}

