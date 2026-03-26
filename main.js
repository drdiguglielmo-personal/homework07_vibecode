const authCard = document.getElementById("auth-card");
const authForm = document.getElementById("auth-form");
const authStatusEl = document.getElementById("auth-status");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const showRegisterBtn = document.getElementById("show-register-btn");
const authShowRegisterRow = document.getElementById("auth-show-register-row");
const authReturnSigninBtn = document.getElementById("auth-return-signin-btn");
const authReturnSigninRow = document.getElementById("auth-return-signin-row");
const authEmailField = document.getElementById("auth-email-field");
const authRolesField = document.getElementById("auth-roles-field");
const authEmailInput = document.getElementById("auth-email");
const roleAdminCheckbox = document.getElementById("role-admin");
const roleSocialWorkerCheckbox = document.getElementById("role-social-worker");
const appContent = document.getElementById("app-content");
const userSummaryEl = document.getElementById("user-summary");
const roleSummaryEl = document.getElementById("role-summary");
const logoutBtn = document.getElementById("logout-btn");
const roleSelect = document.getElementById("role");

const intakeForm = document.getElementById("intake-form");
const intakeStatusEl = document.getElementById("intake-status");
const duplicateWarningEl = document.getElementById("duplicate-warning");
const recordsEl = document.getElementById("records");
const recordsStatusEl = document.getElementById("records-status");
const assignedToSelect = document.getElementById("assignedTo");
const assignedToHintEl = document.getElementById("assignedTo-hint");
const timeCategoriesListEl = document.getElementById("time-categories-list");
const newTimeCategoryInput = document.getElementById("new-time-category");
const addTimeCategoryBtn = document.getElementById("add-time-category-btn");
const timeCategoryCheckboxesEl = document.getElementById("time-category-checkboxes");
const timelogForm = document.getElementById("timelog-form");
const timelogDateInput = document.getElementById("timelog-date");
const timelogHoursInput = document.getElementById("timelog-hours");
const timelogNotesInput = document.getElementById("timelog-notes");
const timelogStatusEl = document.getElementById("timelog-status");
const timeLogsListEl = document.getElementById("time-logs-list");
const inactiveAfterDaysInput = document.getElementById("inactive-after-days");
const saveInactiveSettingsBtn = document.getElementById("save-inactive-settings-btn");
const inactiveSettingsStatusEl = document.getElementById("inactive-settings-status");

const reportPeriodTypeSelect = document.getElementById("report-period-type");
const reportStartDateInput = document.getElementById("report-start-date");
const reportEndDateWrap = document.getElementById("report-end-date-wrap");
const reportEndDateInput = document.getElementById("report-end-date");
const reportModeSelect = document.getElementById("report-mode");
const reportIncludeInactiveCb = document.getElementById("report-include-inactive");
const generateReportBtn = document.getElementById("generate-report-btn");
const exportReportPdfBtn = document.getElementById("export-report-pdf-btn");
const reportStatusEl = document.getElementById("report-status");
const reportPreviewEl = document.getElementById("report-preview");

const timeReportPeriodTypeSelect = document.getElementById("time-report-period-type");
const timeReportStartDateInput = document.getElementById("time-report-start-date");
const timeReportEndDateWrap = document.getElementById("time-report-end-date-wrap");
const timeReportEndDateInput = document.getElementById("time-report-end-date");
const generateTimeReportBtn = document.getElementById("generate-time-report-btn");
const exportTimeReportPdfBtn = document.getElementById("export-time-report-pdf-btn");
const exportTimeReportJpgBtn = document.getElementById("export-time-report-jpg-btn");
const timeReportStatusEl = document.getElementById("time-report-status");
const timeReportPreviewEl = document.getElementById("time-report-preview");

/** Set when a time report is generated; used for JPG export and validation. */
let lastTimeReportExport = null;

/** Rows last loaded for SBPD CSV export (checkbox selection). */
let sbpdCsvFetchedRows = [];

const sbpdCsvDaysInput = document.getElementById("sbpd-csv-days");
const sbpdCsvFetchBtn = document.getElementById("sbpd-csv-fetch-btn");
const sbpdCsvSelectAllBtn = document.getElementById("sbpd-csv-select-all");
const sbpdCsvDeselectAllBtn = document.getElementById("sbpd-csv-deselect-all");
const sbpdCsvDownloadBtn = document.getElementById("sbpd-csv-download-btn");
const sbpdCsvStatusEl = document.getElementById("sbpd-csv-status");
const sbpdCsvTableWrap = document.getElementById("sbpd-csv-table-wrap");

const directSheetsApiUrl = import.meta.env.VITE_SHEETS_API_URL?.trim();
const isLocalDev = ["localhost", "127.0.0.1"].includes(window.location.hostname);
/** Local dev proxies to Apps Script (needs VITE_SHEETS_API_URL). Production uses the script URL directly. */
const sheetsApiUrl = isLocalDev && directSheetsApiUrl ? "/api/sheets" : directSheetsApiUrl;

const back4AppAppId = import.meta.env.VITE_BACK4APP_APP_ID?.trim();
const back4AppJsKey = import.meta.env.VITE_BACK4APP_JS_KEY?.trim();
const back4AppServerUrl = import.meta.env.VITE_BACK4APP_SERVER_URL?.trim().replace(/\/$/, "");
const extraAssigneeUsernames = String(import.meta.env.VITE_ASSIGNEE_USERNAMES || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
/** Same-origin Netlify function by default; override for local `netlify dev` on another port. */
const staffUsersListUrl = import.meta.env.VITE_STAFF_USERS_URL?.trim();
/** Parse class that mirrors assignable staff (public-read rows). Set to "0" to disable. See .env.example. */
const rawStaffDirectoryClass = import.meta.env.VITE_STAFF_DIRECTORY_CLASS;
const staffDirectoryClassName =
  rawStaffDirectoryClass === "0" || rawStaffDirectoryClass === "false"
    ? ""
    : String(rawStaffDirectoryClass || "StaffDirectory").trim() || "StaffDirectory";
const referralSummaryClassName =
  String(import.meta.env.VITE_REFERRAL_SUMMARY_CLASS || "ReferralSummary").trim() || "ReferralSummary";
const caseNoteClassName = String(import.meta.env.VITE_CASE_NOTE_CLASS || "CaseNote").trim() || "CaseNote";
const orgSettingsClassName =
  String(import.meta.env.VITE_ORG_SETTINGS_CLASS || "OrgSettings").trim() || "OrgSettings";
/** Days without summary update before recordStatus → inactive (0 = off). Loaded from OrgSettings. */
let cachedInactiveAfterDays = 90;
let orgSettingsObjectId = null;
const timeCategoryClassName =
  String(import.meta.env.VITE_TIME_CATEGORY_CLASS || "TimeCategory").trim() || "TimeCategory";
const timeLogClassName = String(import.meta.env.VITE_TIME_LOG_CLASS || "TimeLog").trim() || "TimeLog";
/** Match referralAgency for SBPD / Santa Barbara police CSV and optional intake fields. Regex string, case-insensitive. */
const sbpdAgencyRegexSource =
  String(import.meta.env.VITE_SBPD_AGENCY_REGEX || "SBPD|Santa Barbara Police|Santa Barbara PD").trim() ||
  "SBPD";
const DEFAULT_TIME_CATEGORY_NAMES = [
  "Mental Health Help",
  "Hazardous",
  "Establishing contact",
  "Career Counseling"
];
const authStorageKey = "ngo_auth_session";

let currentUser = null;
let currentSessionToken = "";
let authMode = "signin";
let timeCategoriesCache = [];

function setStatus(el, message, color = "#cbd5e1") {
  if (!el) return;
  el.textContent = message;
  el.style.color = color;
}

function envMissing() {
  return !directSheetsApiUrl;
}

function authEnvMissing() {
  return !back4AppAppId || !back4AppJsKey || !back4AppServerUrl;
}

function normalizeName(name) {
  return (name || "").trim().toLowerCase();
}

function toRoleLabel(role) {
  if (role === "admin") return "Admin";
  if (role === "social_worker") return "Social Worker";
  if (role === "admin_social_worker") return "Admin + Social Worker";
  return role;
}

function parseRolesFromParseField(raw) {
  if (Array.isArray(raw) && raw.length) return raw.map(String);
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      /* ignore */
    }
    if (t.includes(",")) return t.split(",").map((s) => s.trim()).filter(Boolean);
    return [t];
  }
  return [];
}

function getRolesFromUser(user) {
  if (!user) return ["social_worker"];
  const parsed = parseRolesFromParseField(user.roles);
  return parsed.length ? parsed : ["social_worker"];
}

function getRolesForStaffPicker(parseUser) {
  if (!parseUser) return [];
  return parseRolesFromParseField(parseUser.roles);
}

function userHasAdminPrivileges(user) {
  const roles = getRolesFromUser(user);
  return roles.includes("admin") || roles.includes("admin_social_worker");
}

function userCanReceiveClientAssignment(parseUser) {
  const roles = getRolesForStaffPicker(parseUser);
  if (!roles.length) return false;
  return roles.some((r) => r === "social_worker" || r === "admin_social_worker");
}

function isSameBack4AppUser(row, me) {
  if (!row || !me) return false;
  if (row.objectId && me.objectId && row.objectId === me.objectId) return true;
  const a = String(row.username || "").trim();
  const b = String(me.username || "").trim();
  if (a && b && a === b) return true;
  const ae = String(row.email || "").trim().toLowerCase();
  const be = String(me.email || "").trim().toLowerCase();
  return Boolean(ae && be && ae === be);
}

function buildRoleOptions(roles) {
  const normalized = new Set();
  roles.forEach((role) => {
    if (role === "admin") normalized.add("admin");
    if (role === "social_worker") normalized.add("social_worker");
    if (role === "admin_social_worker") {
      normalized.add("admin");
      normalized.add("social_worker");
      normalized.add("admin_social_worker");
    }
  });
  if (normalized.has("admin") && normalized.has("social_worker")) {
    normalized.add("admin_social_worker");
  }
  return Array.from(normalized);
}

function updateRoleSelect() {
  const roles = buildRoleOptions(getRolesFromUser(currentUser));
  roleSelect.innerHTML = roles
    .map((role) => `<option value="${role}">${toRoleLabel(role)}</option>`)
    .join("");
  if (roles.length === 1) {
    roleSelect.value = roles[0];
    roleSelect.disabled = true;
  } else {
    roleSelect.disabled = false;
  }
}

function showLoggedOutUI() {
  authCard.classList.remove("hidden");
  appContent.classList.add("hidden");
  currentUser = null;
  currentSessionToken = "";
  setAuthMode("signin");
}

async function showLoggedInUI(user) {
  currentUser = user;
  authCard.classList.add("hidden");
  appContent.classList.remove("hidden");
  userSummaryEl.textContent = `Signed in as ${user.username || user.email || "user"}`;
  roleSummaryEl.textContent = `Roles: ${getRolesFromUser(user).map(toRoleLabel).join(", ")}`;
  updateRoleSelect();
  await syncStaffDirectoryEntry(user);
  await setupAssignmentUI();
  await fetchOrgSettings();
  syncInactiveSettingsUI();
  await initTimeLogging();
}

async function tryFetchStaffViaNetlifyFunction() {
  const url = staffUsersListUrl || "/.netlify/functions/staff-users";
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "X-Parse-Session-Token": currentSessionToken }
    });
    if (response.status === 501 || response.status === 404) return null;
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch {
    return null;
  }
}

async function fetchStaffUsers() {
  const byKey = new Map();
  const mergeRows = (rows) => {
    (rows || []).forEach((u) => {
      const key = u.objectId || String(u.username || u.email || "").trim();
      if (!key) return;
      const prev = byKey.get(key);
      if (!prev) {
        byKey.set(key, u);
        return;
      }
      if (!parseRolesFromParseField(prev.roles).length && parseRolesFromParseField(u.roles).length) {
        byKey.set(key, u);
      }
    });
  };

  const serverRows = await tryFetchStaffViaNetlifyFunction();
  if (serverRows !== null) {
    mergeRows(serverRows);
  }

  let sawSuccessfulRequest = serverRows !== null;
  const tryFetch = async (path) => {
    try {
      const data = await back4AppRequest(path, {
        method: "GET",
        headers: { "X-Parse-Session-Token": currentSessionToken }
      });
      sawSuccessfulRequest = true;
      const rows = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
      mergeRows(rows);
    } catch {
      /* try next path */
    }
  };

  const keys = "username,email,roles,objectId";
  const whereSw = encodeURIComponent(JSON.stringify({ roles: "social_worker" }));
  const whereOr = encodeURIComponent(
    JSON.stringify({
      $or: [{ roles: "social_worker" }, { roles: "admin_social_worker" }]
    })
  );

  const paths = [
    ...(staffDirectoryClassName
      ? [
          `/classes/${encodeURIComponent(staffDirectoryClassName)}?limit=500&keys=username,roles,objectId`
        ]
      : []),
    `/users?limit=500&keys=${keys}`,
    `/users?limit=500&keys=${keys}&where=${whereSw}`,
    `/classes/_User?limit=500&keys=${keys}`,
    `/classes/_User?limit=500&keys=${keys}&where=${whereSw}`,
    `/classes/_User?limit=500&keys=${keys}&where=${whereOr}`
  ];

  for (const path of paths) {
    await tryFetch(path);
  }

  const merged = Array.from(byKey.values());
  if (!sawSuccessfulRequest) return null;
  return merged;
}

async function setupAssignmentUI() {
  if (!assignedToSelect || !currentUser) return;
  const selfName = String(currentUser.username || currentUser.email || "").trim();
  assignedToSelect.innerHTML = "";
  if (assignedToHintEl) assignedToHintEl.textContent = "";

  if (!userHasAdminPrivileges(currentUser)) {
    if (selfName) {
      assignedToSelect.appendChild(new Option(`${selfName} (you)`, selfName, true, true));
      assignedToSelect.value = selfName;
    }
    assignedToSelect.disabled = true;
    if (assignedToHintEl) {
      assignedToHintEl.textContent = "Social workers can only assign clients to themselves.";
    }
    return;
  }

  assignedToSelect.disabled = false;
  const assignees = new Map();
  if (selfName) assignees.set(selfName, `${selfName} (you)`);
  extraAssigneeUsernames.forEach((uname) => {
    if (!assignees.has(uname)) assignees.set(uname, uname);
  });

  const staff = await fetchStaffUsers();
  const staffList = staff || [];
  const parseHasOtherUser = staffList.some((u) => !isSameBack4AppUser(u, currentUser));

  staffList.forEach((u) => {
    const uname = String(u.username || u.email || "").trim();
    if (!uname) return;
    const isSelf = isSameBack4AppUser(u, currentUser);
    const allow =
      isSelf || userCanReceiveClientAssignment(u) || (parseHasOtherUser && !isSelf);
    if (allow) {
      const label = isSelf ? `${uname} (you)` : uname;
      assignees.set(uname, label);
    }
  });

  const fromSheet = await fetchAssigneeNamesFromSheets();
  fromSheet.forEach((uname) => {
    if (!uname) return;
    if (selfName && uname === selfName) {
      assignees.set(selfName, `${selfName} (you)`);
      return;
    }
    if (!assignees.has(uname)) assignees.set(uname, uname);
  });

  let sortedKeys = Array.from(assignees.keys()).sort((a, b) => a.localeCompare(b));
  if (!sortedKeys.length && selfName) {
    assignees.set(selfName, `${selfName} (you)`);
    sortedKeys = Array.from(assignees.keys()).sort((a, b) => a.localeCompare(b));
  }
  sortedKeys.forEach((key) => {
    assignedToSelect.appendChild(new Option(assignees.get(key), key));
  });
  if (selfName && assignees.has(selfName)) {
    assignedToSelect.value = selfName;
  } else if (sortedKeys.length) {
    assignedToSelect.value = sortedKeys[0];
  }
}

function saveSession(sessionToken, user) {
  localStorage.setItem(authStorageKey, JSON.stringify({ sessionToken, user }));
}

function clearSession() {
  localStorage.removeItem(authStorageKey);
}

function loadSession() {
  try {
    const raw = localStorage.getItem(authStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.sessionToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function back4AppRequest(path, options = {}) {
  const response = await fetch(`${back4AppServerUrl}${path}`, {
    ...options,
    headers: {
      "X-Parse-Application-Id": back4AppAppId,
      "X-Parse-Javascript-Key": back4AppJsKey,
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Auth request failed (${response.status})`);
  }
  return data;
}

/**
 * Upserts a public-read roster row so assignees appear in the admin dropdown without querying _User (ACL-safe).
 * Runs on every sign-in for users who can be assigned cases (social worker / admin).
 */
async function syncStaffDirectoryEntry(user) {
  if (!staffDirectoryClassName || !user || !currentSessionToken || authEnvMissing()) return;
  if (!userCanReceiveClientAssignment(user) && !userHasAdminPrivileges(user)) return;
  const username = String(user.username || user.email || "").trim();
  if (!username) return;
  const roles = getRolesFromUser(user);
  const encClass = encodeURIComponent(staffDirectoryClassName);
  const where = encodeURIComponent(JSON.stringify({ username }));
  try {
    const existing = await back4AppRequest(`/classes/${encClass}?where=${where}&limit=1`, {
      method: "GET",
      headers: { "X-Parse-Session-Token": currentSessionToken }
    });
    const rows = existing.results || [];
    if (rows.length && rows[0].objectId) {
      await back4AppRequest(`/classes/${encClass}/${rows[0].objectId}`, {
        method: "PUT",
        headers: {
          "X-Parse-Session-Token": currentSessionToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ roles })
      });
    } else {
      await back4AppRequest(`/classes/${encClass}`, {
        method: "POST",
        headers: {
          "X-Parse-Session-Token": currentSessionToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          userObjectId: user.objectId || "",
          roles,
          ACL: { "*": { read: true } }
        })
      });
    }
  } catch {
    /* Class missing or CLP — user can fix Back4App schema */
  }
}

async function validateSession(sessionToken) {
  return back4AppRequest("/users/me", {
    method: "GET",
    headers: {
      "X-Parse-Session-Token": sessionToken
    }
  });
}

async function resolveAssignedUserPointer(username) {
  const uname = String(username || "").trim();
  if (!uname) return null;
  const selfName = String(currentUser?.username || currentUser?.email || "").trim();
  if (currentUser?.objectId && uname === selfName) {
    return {
      __type: "Pointer",
      className: "_User",
      objectId: currentUser.objectId
    };
  }
  if (!staffDirectoryClassName) return null;
  try {
    const where = encodeURIComponent(JSON.stringify({ username: uname }));
    const keys = encodeURIComponent("username,userObjectId");
    const data = await back4AppRequest(
      `/classes/${encodeURIComponent(staffDirectoryClassName)}?where=${where}&keys=${keys}&limit=1`,
      {
        method: "GET",
        headers: { "X-Parse-Session-Token": currentSessionToken }
      }
    );
    const row = data.results?.[0];
    const objectId = String(row?.userObjectId || "").trim();
    if (!objectId) return null;
    return {
      __type: "Pointer",
      className: "_User",
      objectId
    };
  } catch {
    return null;
  }
}

function isSbpdAgency(agency) {
  const s = String(agency || "").trim();
  if (!s) return false;
  try {
    return new RegExp(sbpdAgencyRegexSource, "i").test(s);
  } catch {
    return /sbpd/i.test(s) || /santa barbara police/i.test(s);
  }
}

function normalizeYesNoString(v) {
  if (v === true) return "Yes";
  if (v === false) return "No";
  const x = String(v || "").trim().toLowerCase();
  if (x === "yes" || x === "y") return "Yes";
  if (x === "no" || x === "n") return "No";
  return "";
}

function applySbpdPoliceFieldsToBody(body, referralPayload) {
  const d = String(referralPayload.dateContactAttempted || "").trim();
  if (d) {
    body.dateContactAttempted = { __type: "Date", iso: new Date(`${d}T12:00:00`).toISOString() };
  }
  const cm = normalizeYesNoString(referralPayload.contactAttemptMade);
  if (cm) body.contactAttemptMade = cm;
  const whom = String(referralPayload.contactMadeWithWhom || "").trim();
  if (whom) body.contactMadeWithWhom = whom;
  const ac = normalizeYesNoString(referralPayload.sbpdAddressCorrect);
  if (ac) body.sbpdAddressCorrect = ac;
  const addr = String(referralPayload.sbpdCorrectedAddress || "").trim();
  if (addr) body.sbpdCorrectedAddress = addr;
  const dc = normalizeYesNoString(referralPayload.detroitStyleCustomCandidate);
  if (dc) body.detroitStyleCustomCandidate = dc;
  const rc = normalizeYesNoString(referralPayload.retaliationConcerns);
  if (rc) body.retaliationConcerns = rc;
}

async function createReferralSummary(referralPayload) {
  if (authEnvMissing() || !currentSessionToken || !currentUser) return;
  const assignedToUsername = String(referralPayload.assignedTo || "").trim();
  const assignedToUser = await resolveAssignedUserPointer(assignedToUsername);
  const acl = { "*": { read: true } };
  if (currentUser.objectId) {
    acl[currentUser.objectId] = { read: true, write: true };
  }
  const body = {
    clientName: String(referralPayload.clientName || "").trim(),
    recordType: String(referralPayload.recordType || "contact"),
    role: String(referralPayload.role || "social_worker"),
    riskLevel: String(referralPayload.riskLevel || "unknown"),
    referralAgency: String(referralPayload.referralAgency || ""),
    recordStatus: String(referralPayload.recordStatus || "active"),
    assignedToUsername,
    assignedTo: assignedToUsername,
    lastModifiedBy: String(referralPayload.lastModifiedBy || currentUser.username || "unknown_user"),
    source: "sheets",
    ACL: acl
  };
  if (assignedToUser) body.assignedToUser = assignedToUser;
  if (isSbpdAgency(referralPayload.referralAgency)) {
    applySbpdPoliceFieldsToBody(body, referralPayload);
  }
  await back4AppRequest(`/classes/${encodeURIComponent(referralSummaryClassName)}`, {
    method: "POST",
    headers: {
      "X-Parse-Session-Token": currentSessionToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

async function signIn(username, password) {
  const params = new URLSearchParams({ username, password }).toString();
  return back4AppRequest(`/login?${params}`, {
    method: "GET",
    headers: {
      "X-Parse-Revocable-Session": "1"
    }
  });
}

async function signUp(username, password, email, roles) {
  return back4AppRequest("/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Parse-Revocable-Session": "1"
    },
    body: JSON.stringify({
      username,
      password,
      email: email || undefined,
      roles
    })
  });
}

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === "register";
  authSubmitBtn.textContent = isRegister ? "Register" : "Sign in";
  authShowRegisterRow?.classList.toggle("hidden", isRegister);
  authEmailField.classList.toggle("hidden", !isRegister);
  authRolesField.classList.toggle("hidden", !isRegister);
  authReturnSigninRow?.classList.toggle("hidden", !isRegister);
  authEmailInput.required = isRegister;
  if (!isRegister) {
    authEmailInput.value = "";
    roleAdminCheckbox.checked = false;
    roleSocialWorkerCheckbox.checked = true;
  }
  setStatus(authStatusEl, "");
}

async function sheetsApiRequest(method, payload = null) {
  const isGet = method === "GET";
  const queryPayload =
    isGet && payload
      ? { ...payload, _ts: String(Date.now()) }
      : payload;
  const hasQuery = isGet && queryPayload ? `?${new URLSearchParams(queryPayload).toString()}` : "";
  const response = await fetch(`${sheetsApiUrl}${hasQuery}`, {
    method,
    cache: "no-store",
    headers: isGet
      ? undefined
      : {
          "Content-Type": "text/plain;charset=utf-8"
        },
    body: isGet ? undefined : JSON.stringify(payload || {})
  });
  const rawText = await response.text().catch(() => "");
  let data = {};
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }
  }
  if (!response.ok) {
    const details =
      typeof data?.raw === "string" && data.raw.trim()
        ? ` — ${data.raw.trim().slice(0, 220)}`
        : "";
    const message =
      data.error ||
      data.message ||
      `Google Sheets request failed (${response.status})${details}`;
    throw new Error(message);
  }
  return data;
}

async function fetchAssigneeNamesFromSheets() {
  const names = new Set();
  if (envMissing()) return names;
  try {
    const data = await sheetsApiRequest("GET", {
      action: "list",
      limit: "500"
    });
    const rows = data.results || data.rows || [];
    rows.forEach((row) => {
      ["assignedTo", "lastModifiedBy"].forEach((key) => {
        const v = String(row[key] || "").trim();
        if (v && v !== "unknown_user" && v !== "local_user") names.add(v);
      });
    });
  } catch {
    /* ignore */
  }
  return names;
}

async function checkPossibleDuplicate(clientName) {
  duplicateWarningEl.textContent = "";
  const normalized = normalizeName(clientName);
  if (!normalized) return null;
  try {
    const data = await sheetsApiRequest("GET", {
      action: "findByName",
      clientNameLower: normalized
    });
    const firstMatch = data.result || data.record || data.results?.[0] || data.rows?.[0];
    if (firstMatch) {
      setStatus(
        duplicateWarningEl,
        `Possible duplicate found: ${firstMatch.clientName || "Unknown"}${firstMatch.updatedAt ? ` (updated ${new Date(firstMatch.updatedAt).toLocaleDateString()})` : ""}`,
        "#facc15"
      );
      return firstMatch;
    }
  } catch {
    // Ignore duplicate check errors.
  }
  return null;
}

function parseParseDate(val) {
  if (val == null) return null;
  if (typeof val === "object" && val.iso) {
    const d = new Date(val.iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseYMD(dateStr) {
  const s = String(dateStr || "").trim();
  if (!s.includes("-")) return null;
  const parts = s.split("-").map((n) => Number(n));
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function getReportRange(periodType, startDateStr, endDateStr) {
  const start = parseYMD(startDateStr);
  if (!start) return null;

  let end;
  if (periodType === "week") {
    end = new Date(start);
    end.setDate(end.getDate() + 7);
  } else if (periodType === "month") {
    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return { start: monthStart, end };
  } else if (periodType === "year") {
    const yearStart = new Date(start.getFullYear(), 0, 1);
    end = new Date(start.getFullYear() + 1, 0, 1);
    return { start: yearStart, end };
  } else {
    const customEnd = parseYMD(endDateStr);
    if (!customEnd) return null;
    end = new Date(customEnd);
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
}

async function fetchReferralSummariesForReport(startIso, endIso, includeInactive) {
  const where = {
    createdAt: {
      $gte: { __type: "Date", iso: startIso },
      $lt: { __type: "Date", iso: endIso }
    }
  };
  if (!includeInactive) where.recordStatus = "active";

  const qs = new URLSearchParams({
    limit: "1000",
    keys: "referralAgency,recordType,createdAt",
    where: JSON.stringify(where),
    order: "-createdAt"
  }).toString();

  const data = await back4AppRequest(
    `/classes/${encodeURIComponent(referralSummaryClassName)}?${qs}`,
    {
      method: "GET",
      headers: { "X-Parse-Session-Token": currentSessionToken }
    }
  );

  return Array.isArray(data.results) ? data.results : [];
}

function renderReportPreview({ fromDate, toDate, mode, includeInactive, breakdownRows, totals }) {
  if (!reportPreviewEl) return;

  const titleMode =
    mode === "contacts" ? "Contacts" : mode === "clients" ? "Clients" : "Contacts + Clients";
  const inactiveText = includeInactive ? "including inactive" : "active only";
  const dateStr = `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`;

  const tableRows = breakdownRows
    .map((r) => {
      const safeName = escapeHtml(r.source || "Unknown");
      const c = r.contacts;
      const cl = r.clients;
      const main = r.main;
      const barWidth = totals.maxMain > 0 ? Math.round((main / totals.maxMain) * 220) : 0;
      const bar = `<div style="height:8px;background:#1d4ed8;border-radius:999px;width:${barWidth}px;"></div>`;

      if (mode === "both") {
        return `
          <tr>
            <td>${safeName}</td>
            <td>${c}</td>
            <td>${cl}</td>
            <td>${main}</td>
          </tr>
        `;
      }

      return `
        <tr>
          <td>${safeName}</td>
          <td>${main}</td>
          <td>${bar}</td>
        </tr>
      `;
    })
    .join("");

  const tableHeader =
    mode === "both"
      ? `<tr><th>Source</th><th>Contacts</th><th>Clients</th><th>Total</th></tr>`
      : `<tr><th>Source</th><th>${titleMode}</th><th>Share</th></tr>`;

  reportPreviewEl.innerHTML = `
    <div class="record">
      <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
        <div>
          <h3 style="margin:0 0 0.35rem 0;">${escapeHtml(titleMode)} by Source</h3>
          <div class="small">${escapeHtml(dateStr)} • ${escapeHtml(inactiveText)}</div>
        </div>
        <div style="text-align:right;min-width:220px;">
          <div class="small">Total contacts: <strong>${totals.contacts}</strong></div>
          <div class="small">Total clients: <strong>${totals.clients}</strong></div>
          <div class="small">Report total: <strong>${totals.main}</strong></div>
        </div>
      </div>
      <div style="margin-top:0.8rem;">
        <table style="width:100%;border-collapse:collapse;color:#e2e8f0;">
          <thead>${tableHeader}</thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

async function generateReportPreview() {
  if (!reportPeriodTypeSelect || !reportStartDateInput || !reportPreviewEl) return;
  const periodType = reportPeriodTypeSelect.value;
  const startDateStr = reportStartDateInput.value;
  const endDateStr = reportEndDateInput?.value || "";

  if (!startDateStr) {
    setStatus(reportStatusEl, "Pick a start date.", "#f87171");
    return;
  }

  const range = getReportRange(periodType, startDateStr, endDateStr);
  if (!range) {
    setStatus(reportStatusEl, "Invalid date range.", "#f87171");
    return;
  }

  const includeInactive = Boolean(reportIncludeInactiveCb?.checked);
  const mode = reportModeSelect?.value || "clients";

  setStatus(reportStatusEl, "Loading data...", "#93c5fd");
  try {
    const startIso = range.start.toISOString();
    const endIso = range.end.toISOString();
    const rows = await fetchReferralSummariesForReport(startIso, endIso, includeInactive);

    const breakdown = new Map();
    let totals = { contacts: 0, clients: 0, main: 0, maxMain: 0 };

    for (const r of rows) {
      const agency = String(r.referralAgency || "Unknown").trim() || "Unknown";
      const recordType = String(r.recordType || "contact").toLowerCase();
      const isContact = recordType === "contact";
      const isClient = recordType === "client";

      if (!breakdown.has(agency)) {
        breakdown.set(agency, { source: agency, contacts: 0, clients: 0, main: 0 });
      }
      const b = breakdown.get(agency);
      if (isContact) {
        b.contacts += 1;
        totals.contacts += 1;
      } else if (isClient) {
        b.clients += 1;
        totals.clients += 1;
      }
    }

    for (const b of breakdown.values()) {
      if (mode === "contacts") b.main = b.contacts;
      else if (mode === "clients") b.main = b.clients;
      else b.main = b.contacts + b.clients;
      totals.main += b.main;
      totals.maxMain = Math.max(totals.maxMain, b.main);
    }

    const breakdownRows = Array.from(breakdown.values()).sort((a, b) => b.main - a.main || a.source.localeCompare(b.source));

    renderReportPreview({
      fromDate: range.start,
      toDate: new Date(range.end.getTime() - 86400000),
      mode,
      includeInactive,
      breakdownRows,
      totals
    });

    setStatus(reportStatusEl, "Report ready.", "#4ade80");
  } catch (e) {
    setStatus(reportStatusEl, `Report failed: ${e.message}`, "#f87171");
  }
}

function exportReportPdfViaPrint() {
  if (!reportPreviewEl) return;
  const content = reportPreviewEl.innerHTML;
  if (!content || !content.trim()) return;

  const w = window.open("", "_blank", "width=1000,height=800");
  if (!w) return;

  w.document.write(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>NGO Report</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border-bottom: 1px solid #ddd; padding: 10px 6px; text-align: left; }
          th { color: #111; font-size: 14px; }
          td { font-size: 13px; }
          .record { border: 1px solid #ddd; border-radius: 10px; padding: 14px; }
          .small { color: #555; font-size: 12px; margin-top: 4px; }
          h3 { margin: 0 0 6px 0; }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>`);
  w.document.close();
  w.focus();
  w.print();
}

const TIME_REPORT_CHART_COLORS = [
  "#1d4ed8",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#db2777",
  "#0d9488",
  "#b45309",
  "#4f46e5"
];

function timeCategoryLabelFromPointer(c) {
  if (!c || typeof c !== "object") return "";
  if (c.name) return String(c.name).trim() || "";
  const id = c.objectId;
  if (id) {
    const found = timeCategoriesCache.find((x) => x.objectId === id);
    return found?.name ? String(found.name).trim() : "";
  }
  return "";
}

async function fetchTimeLogsForReport(startIso, endIso) {
  if (!currentUser?.objectId || !currentSessionToken) return [];
  const where = {
    user: {
      __type: "Pointer",
      className: "_User",
      objectId: currentUser.objectId
    },
    workDate: {
      $gte: { __type: "Date", iso: startIso },
      $lt: { __type: "Date", iso: endIso }
    }
  };
  const qs = new URLSearchParams({
    limit: "1000",
    order: "-workDate,-createdAt",
    keys: "workDate,durationMinutes,categories",
    where: JSON.stringify(where),
    include: "categories"
  }).toString();
  const enc = encodeURIComponent(timeLogClassName);
  const data = await back4AppRequest(`/classes/${enc}?${qs}`, {
    method: "GET",
    headers: { "X-Parse-Session-Token": currentSessionToken }
  });
  return Array.isArray(data.results) ? data.results : [];
}

function renderTimeReportPreview({ fromDate, toDate, breakdownRows, totalMinutes, entryCount }) {
  if (!timeReportPreviewEl) return;

  const dateStr = `${fromDate.toLocaleDateString()} – ${toDate.toLocaleDateString()}`;
  const maxMin = breakdownRows.length ? Math.max(...breakdownRows.map((r) => r.minutes)) : 0;

  const tableRows = breakdownRows.length
    ? breakdownRows
        .map((r) => {
          const safeName = escapeHtml(r.label || "Unknown");
          const pct =
            totalMinutes > 0 ? Math.round((r.minutes / totalMinutes) * 1000) / 10 : 0;
          const barWidth = maxMin > 0 ? Math.round((r.minutes / maxMin) * 220) : 0;
          const bar = `<div style="height:8px;background:#1d4ed8;border-radius:999px;width:${barWidth}px;"></div>`;
          return `
        <tr>
          <td>${safeName}</td>
          <td>${escapeHtml(formatDurationMinutes(Math.round(r.minutes)))}</td>
          <td>${pct}%</td>
          <td>${bar}</td>
        </tr>
      `;
        })
        .join("")
    : `<tr><td colspan="4" class="small" style="padding:0.75rem 0">No time entries in this period.</td></tr>`;

  timeReportPreviewEl.innerHTML = `
    <div class="record">
      <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
        <div>
          <h3 style="margin:0 0 0.35rem 0;">Hours by category</h3>
          <div class="small">${escapeHtml(dateStr)}</div>
        </div>
        <div style="text-align:right;min-width:200px;">
          <div class="small">Total logged: <strong>${escapeHtml(formatDurationMinutes(totalMinutes))}</strong></div>
          <div class="small">Entries in range: <strong>${entryCount}</strong></div>
        </div>
      </div>
      <div style="margin-top:0.8rem;">
        <table style="width:100%;border-collapse:collapse;color:#e2e8f0;">
          <thead>
            <tr><th>Category</th><th>Time</th><th>Share</th><th></th></tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

async function generateTimeReportPreview() {
  if (!timeReportPeriodTypeSelect || !timeReportStartDateInput || !timeReportPreviewEl) return;
  const periodType = timeReportPeriodTypeSelect.value;
  const startDateStr = timeReportStartDateInput.value;
  const endDateStr = timeReportEndDateInput?.value || "";

  if (!startDateStr) {
    setStatus(timeReportStatusEl, "Pick a start date.", "#f87171");
    return;
  }

  const range = getReportRange(periodType, startDateStr, endDateStr);
  if (!range) {
    setStatus(timeReportStatusEl, "Invalid date range.", "#f87171");
    return;
  }

  if (!currentSessionToken || !currentUser?.objectId) {
    setStatus(timeReportStatusEl, "Sign in to run this report.", "#f87171");
    return;
  }

  setStatus(timeReportStatusEl, "Loading time logs...", "#93c5fd");
  try {
    await fetchTimeCategories();
    const startIso = range.start.toISOString();
    const endIso = range.end.toISOString();
    const rows = await fetchTimeLogsForReport(startIso, endIso);

    const byCat = new Map();
    for (const row of rows) {
      const mins = Number(row.durationMinutes) || 0;
      const cats = Array.isArray(row.categories) ? row.categories : [];
      if (!cats.length) {
        const k = "Uncategorized";
        byCat.set(k, (byCat.get(k) || 0) + mins);
        continue;
      }
      const share = mins / cats.length;
      for (const c of cats) {
        const label = timeCategoryLabelFromPointer(c) || "Unknown";
        byCat.set(label, (byCat.get(label) || 0) + share);
      }
    }

    let totalMinutes = 0;
    for (const row of rows) {
      totalMinutes += Number(row.durationMinutes) || 0;
    }

    const breakdownRows = Array.from(byCat.entries())
      .map(([label, minutes]) => ({ label, minutes }))
      .sort((a, b) => b.minutes - a.minutes || a.label.localeCompare(b.label));

    const displayEnd = new Date(range.end.getTime() - 86400000);

    if (!rows.length) {
      lastTimeReportExport = null;
    } else {
      lastTimeReportExport = {
        fromDate: range.start,
        toDate: displayEnd,
        breakdownRows: breakdownRows.map((r) => ({ label: r.label, minutes: r.minutes })),
        totalMinutes,
        entryCount: rows.length
      };
    }

    renderTimeReportPreview({
      fromDate: range.start,
      toDate: displayEnd,
      breakdownRows,
      totalMinutes,
      entryCount: rows.length
    });

    setStatus(
      timeReportStatusEl,
      rows.length ? "Report ready." : "No time entries in this range.",
      rows.length ? "#4ade80" : "#fbbf24"
    );
  } catch (e) {
    lastTimeReportExport = null;
    setStatus(timeReportStatusEl, `Report failed: ${e.message}`, "#f87171");
  }
}

function exportTimeReportPdfViaPrint() {
  if (!timeReportPreviewEl) return;
  const content = timeReportPreviewEl.innerHTML;
  if (!content || !content.trim()) return;

  const w = window.open("", "_blank", "width=1000,height=800");
  if (!w) return;

  w.document.write(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Hours by category</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 24px; background: #fff; color: #111; }
          .record, .record * { color: #111 !important; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; color: #111 !important; }
          th, td { border-bottom: 1px solid #ddd; padding: 10px 6px; text-align: left; }
          th { font-size: 14px; }
          td { font-size: 13px; }
          .record { border: 1px solid #ddd; border-radius: 10px; padding: 14px; }
          .small { color: #555 !important; font-size: 12px; margin-top: 4px; }
          h3 { margin: 0 0 6px 0; }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>`);
  w.document.close();
  w.focus();
  w.print();
}

function exportTimeReportJpg() {
  if (!lastTimeReportExport) {
    setStatus(timeReportStatusEl, "Generate the report first.", "#f87171");
    return;
  }
  const { fromDate, toDate, breakdownRows, totalMinutes, entryCount } = lastTimeReportExport;
  const rows = breakdownRows.filter((r) => r && typeof r.minutes === "number" && r.minutes > 0);
  if (!rows.length || totalMinutes <= 0) {
    setStatus(timeReportStatusEl, "No data to export.", "#f87171");
    return;
  }

  const pad = 40;
  const W = 880;
  const rowH = 36;
  const titleBlock = 72;
  const chartTop = titleBlock + rows.length * rowH + 32;
  const chartH = 200;
  const H = chartTop + chartH + pad;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#111827";
  ctx.font = "bold 22px Arial, Helvetica, sans-serif";
  ctx.fillText("Hours by category", pad, 38);

  ctx.font = "14px Arial, Helvetica, sans-serif";
  ctx.fillStyle = "#4b5563";
  const rangeStr = `${fromDate.toLocaleDateString()} – ${toDate.toLocaleDateString()}`;
  ctx.fillText(rangeStr, pad, 62);
  ctx.fillText(
    `Total logged: ${formatDurationMinutes(totalMinutes)} • Entries: ${entryCount}`,
    pad,
    82
  );

  const maxMin = Math.max(...rows.map((r) => r.minutes), 1);
  let y = titleBlock;
  ctx.font = "13px Arial, Helvetica, sans-serif";
  rows.forEach((r, i) => {
    const pct = totalMinutes > 0 ? Math.round((r.minutes / totalMinutes) * 1000) / 10 : 0;
    const label =
      r.label.length > 42 ? `${r.label.slice(0, 40)}…` : r.label;
    ctx.fillStyle = "#111827";
    ctx.fillText(label, pad, y + 22);
    const tStr = `${formatDurationMinutes(Math.round(r.minutes))} (${pct}%)`;
    ctx.fillStyle = "#6b7280";
    ctx.textAlign = "right";
    ctx.fillText(tStr, W - pad, y + 22);
    ctx.textAlign = "left";

    const barX = pad;
    const barY = y + 26;
    const barW = (W - 2 * pad) * (r.minutes / maxMin);
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(barX, barY, W - 2 * pad, 6);
    ctx.fillStyle = TIME_REPORT_CHART_COLORS[i % TIME_REPORT_CHART_COLORS.length];
    ctx.fillRect(barX, barY, Math.max(barW, 2), 6);

    y += rowH;
  });

  const chartPad = pad;
  const cx = chartPad;
  const cy = chartTop;
  const cSize = Math.min(W - 2 * chartPad, chartH - 20);
  const cx0 = cx + (W - 2 * chartPad - cSize) / 2;
  const cy0 = cy + 10;

  let ang = -Math.PI / 2;
  const cxPie = cx0 + cSize / 2;
  const cyPie = cy0 + cSize / 2;
  const rad = cSize * 0.36;

  rows.forEach((r, i) => {
    const slice = (r.minutes / totalMinutes) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cxPie, cyPie);
    ctx.arc(cxPie, cyPie, rad, ang, ang + slice);
    ctx.closePath();
    ctx.fillStyle = TIME_REPORT_CHART_COLORS[i % TIME_REPORT_CHART_COLORS.length];
    ctx.fill();
    ang += slice;
  });

  ctx.beginPath();
  ctx.arc(cxPie, cyPie, rad * 0.55, 0, 2 * Math.PI);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        setStatus(timeReportStatusEl, "Could not create image.", "#f87171");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hours-by-category-${fromDate.toISOString().slice(0, 10)}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus(timeReportStatusEl, "JPG downloaded.", "#4ade80");
    },
    "image/jpeg",
    0.92
  );
}

async function convertSummaryContactToClient(summaryObjectId) {
  if (!summaryObjectId || !currentSessionToken) return;
  const enc = encodeURIComponent(referralSummaryClassName);
  const convertedBy = String(currentUser?.username || currentUser?.email || "unknown_user");
  setStatus(recordsStatusEl, "Converting contact to client...", "#93c5fd");
  try {
    await back4AppRequest(`/classes/${enc}/${summaryObjectId}`, {
      method: "PUT",
      headers: {
        "X-Parse-Session-Token": currentSessionToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        recordType: "client",
        caseStatus: "accepted_client",
        convertedAt: { __type: "Date", iso: new Date().toISOString() },
        convertedBy,
        lastModifiedBy: convertedBy
      })
    });
    setStatus(recordsStatusEl, "Converted to client.", "#4ade80");
    await loadRecentRecords();
  } catch (error) {
    setStatus(recordsStatusEl, `Convert failed: ${error.message}`, "#f87171");
  }
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateForPoliceCsv(val) {
  const d =
    typeof val === "object" && val && val.iso
      ? new Date(val.iso)
      : parseParseDate(val);
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

function sbpdDateValueForInput(record) {
  const d = record?.dateContactAttempted;
  if (!d) return "";
  if (typeof d === "object" && d.iso) return d.iso.slice(0, 10);
  const parsed = parseParseDate(d);
  if (!parsed || Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function formatSbpdAddressColumn(row) {
  const correct = normalizeYesNoString(row.sbpdAddressCorrect);
  const corr = String(row.sbpdCorrectedAddress || "").trim();
  if (!correct && !corr) return "";
  if (correct === "Yes") return corr ? `Yes — ${corr}` : "Yes";
  if (correct === "No") return corr ? `No — ${corr}` : "No";
  return corr || "";
}

function escapeCsvCell(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const SBPD_CSV_HEADERS = [
  "Contact name",
  "Date Contact Attempted",
  "LastModifiedByUser",
  "Contact Status",
  "If Contact Made, with whom",
  "Is Address provided by SBPD correct? If not, provide correct address",
  "Candidate for Detroit-Style Custom?",
  "Any Retaliation Concerns?"
];

function referralSummaryRowToCsvLine(row) {
  const cells = [
    row.clientName || "",
    formatDateForPoliceCsv(row.dateContactAttempted),
    row.lastModifiedBy || "",
    normalizeYesNoString(row.contactAttemptMade) || "",
    String(row.contactMadeWithWhom || "").trim(),
    formatSbpdAddressColumn(row),
    normalizeYesNoString(row.detroitStyleCustomCandidate) || "",
    normalizeYesNoString(row.retaliationConcerns) || ""
  ];
  return cells.map(escapeCsvCell).join(",");
}

async function fetchSbpdReferralSummariesForCsv(startIso, endIso) {
  if (!currentSessionToken) return [];
  let regexPattern = sbpdAgencyRegexSource;
  try {
    new RegExp(regexPattern, "i");
  } catch {
    regexPattern = "SBPD";
  }
  const where = {
    recordType: "contact",
    referralAgency: { $regex: regexPattern, $options: "i" },
    updatedAt: {
      $gte: { __type: "Date", iso: startIso },
      $lte: { __type: "Date", iso: endIso }
    }
  };
  const keys = [
    "objectId",
    "clientName",
    "referralAgency",
    "recordType",
    "lastModifiedBy",
    "updatedAt",
    "dateContactAttempted",
    "contactAttemptMade",
    "contactMadeWithWhom",
    "sbpdAddressCorrect",
    "sbpdCorrectedAddress",
    "detroitStyleCustomCandidate",
    "retaliationConcerns"
  ].join(",");
  const qs = new URLSearchParams({
    limit: "200",
    order: "-updatedAt",
    keys,
    where: JSON.stringify(where)
  }).toString();
  const data = await back4AppRequest(
    `/classes/${encodeURIComponent(referralSummaryClassName)}?${qs}`,
    {
      method: "GET",
      headers: { "X-Parse-Session-Token": currentSessionToken }
    }
  );
  return Array.isArray(data.results) ? data.results : [];
}

function renderSbpdCsvTable(rows) {
  if (!sbpdCsvTableWrap) return;
  if (!rows.length) {
    sbpdCsvTableWrap.innerHTML = '<p class="small">No SBPD contacts in this window.</p>';
    return;
  }
  const header = `
    <table class="sbpd-csv-table" style="width:100%;border-collapse:collapse;margin-top:0.5rem;font-size:0.9rem;">
      <thead>
        <tr>
          <th style="text-align:left;padding:6px;border-bottom:1px solid #334155;width:36px;"></th>
          <th style="text-align:left;padding:6px;border-bottom:1px solid #334155;">Contact</th>
          <th style="text-align:left;padding:6px;border-bottom:1px solid #334155;">Agency</th>
          <th style="text-align:left;padding:6px;border-bottom:1px solid #334155;">Updated</th>
        </tr>
      </thead>
      <tbody>
  `;
  const body = rows
    .map((r, i) => {
      const id = escapeHtml(r.objectId || "");
      const name = escapeHtml(r.clientName || "—");
      const ag = escapeHtml(r.referralAgency || "—");
      const u = r.updatedAt
        ? escapeHtml(new Date(r.updatedAt).toLocaleString())
        : "—";
      return `<tr>
        <td style="padding:6px;border-bottom:1px solid #1e293b;">
          <input type="checkbox" class="sbpd-csv-row-cb" data-idx="${i}" checked aria-label="Include ${name}" />
        </td>
        <td style="padding:6px;border-bottom:1px solid #1e293b;">${name}</td>
        <td style="padding:6px;border-bottom:1px solid #1e293b;">${ag}</td>
        <td style="padding:6px;border-bottom:1px solid #1e293b;">${u}</td>
      </tr>`;
    })
    .join("");
  sbpdCsvTableWrap.innerHTML = `${header}${body}</tbody></table>`;
}

async function fetchSbpdCsvList() {
  if (!currentSessionToken || authEnvMissing()) {
    setStatus(sbpdCsvStatusEl, "Sign in first.", "#f87171");
    return;
  }
  const days = Math.max(1, Math.min(365, Number(sbpdCsvDaysInput?.value || 14) || 14));
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  setStatus(sbpdCsvStatusEl, "Loading…", "#93c5fd");
  try {
    const rows = await fetchSbpdReferralSummariesForCsv(start.toISOString(), end.toISOString());
    sbpdCsvFetchedRows = rows;
    renderSbpdCsvTable(rows);
    setStatus(
      sbpdCsvStatusEl,
      `${rows.length} SBPD contact(s) in the last ${days} day(s). Select rows and download CSV.`,
      "#4ade80"
    );
  } catch (e) {
    sbpdCsvFetchedRows = [];
    if (sbpdCsvTableWrap) sbpdCsvTableWrap.innerHTML = "";
    setStatus(sbpdCsvStatusEl, `Load failed: ${e.message}`, "#f87171");
  }
}

function setAllSbpdCsvCheckboxes(checked) {
  document.querySelectorAll(".sbpd-csv-row-cb").forEach((el) => {
    el.checked = checked;
  });
}

function downloadSbpdCsv() {
  if (!sbpdCsvFetchedRows.length) {
    setStatus(sbpdCsvStatusEl, "Load SBPD contacts first.", "#f87171");
    return;
  }
  const selected = [];
  document.querySelectorAll(".sbpd-csv-row-cb").forEach((el) => {
    if (!el.checked) return;
    const idx = Number(el.getAttribute("data-idx"));
    if (Number.isNaN(idx) || !sbpdCsvFetchedRows[idx]) return;
    selected.push(sbpdCsvFetchedRows[idx]);
  });
  if (!selected.length) {
    setStatus(sbpdCsvStatusEl, "Select at least one row.", "#f87171");
    return;
  }
  const bom = "\ufeff";
  const lines = [SBPD_CSV_HEADERS.map(escapeCsvCell).join(","), ...selected.map(referralSummaryRowToCsvLine)];
  const blob = new Blob([bom + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sbpd-referral-status-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  setStatus(sbpdCsvStatusEl, `Downloaded CSV (${selected.length} row(s)).`, "#4ade80");
}

async function putSbpdPoliceFields(objectId, payload) {
  if (!objectId || !currentSessionToken) return;
  const enc = encodeURIComponent(referralSummaryClassName);
  const body = {
    lastModifiedBy: String(currentUser?.username || currentUser?.email || "unknown_user")
  };
  const d = String(payload.dateContactAttempted || "").trim();
  if (d) {
    body.dateContactAttempted = { __type: "Date", iso: new Date(`${d}T12:00:00`).toISOString() };
  } else {
    body.dateContactAttempted = null;
  }
  body.contactAttemptMade = normalizeYesNoString(payload.contactAttemptMade) || null;
  body.contactMadeWithWhom = String(payload.contactMadeWithWhom || "").trim() || null;
  body.sbpdAddressCorrect = normalizeYesNoString(payload.sbpdAddressCorrect) || null;
  body.sbpdCorrectedAddress = String(payload.sbpdCorrectedAddress || "").trim() || null;
  body.detroitStyleCustomCandidate = normalizeYesNoString(payload.detroitStyleCustomCandidate) || null;
  body.retaliationConcerns = normalizeYesNoString(payload.retaliationConcerns) || null;
  await back4AppRequest(`/classes/${enc}/${objectId}`, {
    method: "PUT",
    headers: {
      "X-Parse-Session-Token": currentSessionToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

async function fetchCaseNotes(summaryObjectId) {
  if (!summaryObjectId || !currentSessionToken) return [];
  // Important: do NOT encode twice. URLSearchParams will encode the JSON for us.
  const where = JSON.stringify({
    referralSummary: {
      __type: "Pointer",
      className: referralSummaryClassName,
      objectId: summaryObjectId
    }
  });
  const qs = new URLSearchParams({
    where,
    limit: "100",
    order: "-createdAt",
    keys: "text,authorUsername,createdAt"
  }).toString();
  const data = await back4AppRequest(`/classes/${encodeURIComponent(caseNoteClassName)}?${qs}`, {
    method: "GET",
    headers: { "X-Parse-Session-Token": currentSessionToken }
  });
  return Array.isArray(data.results) ? data.results : [];
}

function renderNotesList(containerEl, notes) {
  containerEl.innerHTML = "";
  if (!notes.length) {
    containerEl.innerHTML = '<div class="small">No notes yet.</div>';
    return;
  }
  notes.forEach((n) => {
    const item = document.createElement("div");
    item.className = "note-item";
    const when = n.createdAt ? new Date(n.createdAt).toLocaleString() : "";
    const who = String(n.authorUsername || "").trim();
    item.innerHTML = `
      <div class="note-meta">${escapeHtml(who || "Unknown")} • ${escapeHtml(when)}</div>
      <div class="note-text">${escapeHtml(n.text || "")}</div>
    `;
    containerEl.appendChild(item);
  });
}

async function createCaseNote(summaryObjectId, text) {
  if (!summaryObjectId || !currentSessionToken || !currentUser?.objectId) return;
  const authorUsername = String(currentUser.username || currentUser.email || "unknown_user");
  const payload = {
    referralSummary: {
      __type: "Pointer",
      className: referralSummaryClassName,
      objectId: summaryObjectId
    },
    author: {
      __type: "Pointer",
      className: "_User",
      objectId: currentUser.objectId
    },
    authorUsername,
    text: String(text || "").trim(),
    ACL: {
      "*": { read: true },
      [currentUser.objectId]: { read: true, write: true }
    }
  };
  await back4AppRequest(`/classes/${encodeURIComponent(caseNoteClassName)}`, {
    method: "POST",
    headers: {
      "X-Parse-Session-Token": currentSessionToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

function renderRecords(records) {
  recordsEl.innerHTML = "";
  if (!records.length) {
    recordsEl.innerHTML = '<div class="record">No records yet. Save your first referral above.</div>';
    return;
  }
  records.forEach((record) => {
    const item = document.createElement("div");
    const isInactive = String(record.recordStatus || "active").toLowerCase() === "inactive";
    item.className = `record${isInactive ? " record-inactive" : ""}`;
    const statusPill = isInactive ? ' <span class="pill">Inactive</span>' : "";
    const updatedRaw = record.updatedAt || record.createdAt;
    const updatedStr = updatedRaw
      ? (parseParseDate(updatedRaw) || new Date(updatedRaw)).toLocaleString()
      : "N/A";
    item.innerHTML = `
      <div><strong>${record.clientName || "Unnamed"}</strong> - ${record.recordType || "contact"}${statusPill}</div>
      <div class="small">Agency: ${record.referralAgency || "N/A"} | Risk: ${record.riskLevel || "unknown"} | Assigned: ${record.assignedTo || "Unassigned"}</div>
      <div class="small">Updated: ${updatedStr}</div>
    `;

    const actions = document.createElement("div");
    actions.className = "record-actions";

    const isContact = String(record.recordType || "").toLowerCase() === "contact";
    if (isContact && record.objectId) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-secondary";
      btn.textContent = "Convert to Client";
      btn.addEventListener("click", () => convertSummaryContactToClient(record.objectId));
      actions.appendChild(btn);
    }

    if (record.objectId) {
      const toggleNotesBtn = document.createElement("button");
      toggleNotesBtn.type = "button";
      toggleNotesBtn.className = "btn-secondary";
      toggleNotesBtn.textContent = "Notes";
      actions.appendChild(toggleNotesBtn);

      const notesWrap = document.createElement("div");
      notesWrap.className = "notes-wrap hidden";

      const noteInput = document.createElement("textarea");
      noteInput.placeholder = "Add a note…";
      noteInput.style.minHeight = "70px";

      const noteActions = document.createElement("div");
      noteActions.className = "record-actions";
      noteActions.style.marginTop = "0.4rem";

      const saveNoteBtn = document.createElement("button");
      saveNoteBtn.type = "button";
      saveNoteBtn.className = "btn-secondary";
      saveNoteBtn.textContent = "Save note";

      const noteStatus = document.createElement("div");
      noteStatus.className = "small";
      noteStatus.style.marginTop = "0.35rem";

      const notesList = document.createElement("div");
      notesList.className = "notes-list";

      let loaded = false;
      const loadAndRender = async () => {
        noteStatus.textContent = "Loading notes...";
        try {
          const notes = await fetchCaseNotes(record.objectId);
          renderNotesList(notesList, notes);
          noteStatus.textContent = "";
          loaded = true;
        } catch (e) {
          noteStatus.textContent = `Failed to load notes: ${e.message}`;
        }
      };

      toggleNotesBtn.addEventListener("click", async () => {
        notesWrap.classList.toggle("hidden");
        if (!notesWrap.classList.contains("hidden") && !loaded) {
          await loadAndRender();
        }
      });

      saveNoteBtn.addEventListener("click", async () => {
        const text = String(noteInput.value || "").trim();
        if (!text) {
          noteStatus.textContent = "Note text is required.";
          return;
        }
        noteStatus.textContent = "Saving...";
        try {
          await createCaseNote(record.objectId, text);
          noteInput.value = "";
          await loadAndRender();
          noteStatus.textContent = "Saved.";
        } catch (e) {
          noteStatus.textContent = `Save failed: ${e.message}`;
        }
      });

      noteActions.appendChild(saveNoteBtn);
      notesWrap.appendChild(noteInput);
      notesWrap.appendChild(noteActions);
      notesWrap.appendChild(noteStatus);
      notesWrap.appendChild(notesList);

      let sbpdWrap = null;
      if (isSbpdAgency(record.referralAgency)) {
        const oid = record.objectId;
        const toggleSbpdBtn = document.createElement("button");
        toggleSbpdBtn.type = "button";
        toggleSbpdBtn.className = "btn-secondary";
        toggleSbpdBtn.textContent = "SBPD fields";
        toggleSbpdBtn.setAttribute("aria-expanded", "false");
        actions.appendChild(toggleSbpdBtn);

        sbpdWrap = document.createElement("div");
        sbpdWrap.className = "notes-wrap sbpd-fields-wrap hidden";

        const grid = document.createElement("div");
        grid.className = "grid sbpd-fields-grid";

        const d0 = sbpdDateValueForInput(record);
        grid.innerHTML = `
        <div class="field">
          <label for="sbpd-date-${oid}">Date contact attempted</label>
          <input type="date" id="sbpd-date-${oid}" />
        </div>
        <div class="field">
          <label for="sbpd-contact-${oid}">Contact made?</label>
          <select id="sbpd-contact-${oid}">
            <option value="">—</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div class="field full">
          <label for="sbpd-whom-${oid}">If yes, with whom</label>
          <input type="text" id="sbpd-whom-${oid}" />
        </div>
        <div class="field">
          <label for="sbpd-addr-ok-${oid}">SBPD address correct?</label>
          <select id="sbpd-addr-ok-${oid}">
            <option value="">—</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div class="field full">
          <label for="sbpd-addr-fix-${oid}">Correct address (if needed)</label>
          <textarea id="sbpd-addr-fix-${oid}" rows="2"></textarea>
        </div>
        <div class="field">
          <label for="sbpd-detroit-${oid}">Detroit-style custom?</label>
          <select id="sbpd-detroit-${oid}">
            <option value="">—</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div class="field">
          <label for="sbpd-retaliation-${oid}">Retaliation concerns?</label>
          <select id="sbpd-retaliation-${oid}">
            <option value="">—</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
      `;
        sbpdWrap.appendChild(grid);

        sbpdWrap.querySelector(`#sbpd-date-${oid}`).value = d0;
        const pickYn = (v) =>
          normalizeYesNoString(v) === "Yes"
            ? "Yes"
            : normalizeYesNoString(v) === "No"
              ? "No"
              : "";
        sbpdWrap.querySelector(`#sbpd-contact-${oid}`).value = pickYn(record.contactAttemptMade);
        sbpdWrap.querySelector(`#sbpd-whom-${oid}`).value = String(record.contactMadeWithWhom || "");
        sbpdWrap.querySelector(`#sbpd-addr-ok-${oid}`).value = pickYn(record.sbpdAddressCorrect);
        sbpdWrap.querySelector(`#sbpd-addr-fix-${oid}`).value = String(record.sbpdCorrectedAddress || "");
        sbpdWrap.querySelector(`#sbpd-detroit-${oid}`).value = pickYn(record.detroitStyleCustomCandidate);
        sbpdWrap.querySelector(`#sbpd-retaliation-${oid}`).value = pickYn(record.retaliationConcerns);

        const sbpdActions = document.createElement("div");
        sbpdActions.className = "record-actions";
        sbpdActions.style.marginTop = "0.45rem";
        const saveSbpdBtn = document.createElement("button");
        saveSbpdBtn.type = "button";
        saveSbpdBtn.className = "btn-secondary";
        saveSbpdBtn.textContent = "Save";
        const sbpdStatus = document.createElement("div");
        sbpdStatus.className = "small";
        sbpdStatus.style.marginTop = "0.3rem";

        saveSbpdBtn.addEventListener("click", async () => {
          sbpdStatus.textContent = "Saving…";
          sbpdStatus.style.color = "#93c5fd";
          try {
            await putSbpdPoliceFields(oid, {
              dateContactAttempted: sbpdWrap.querySelector(`#sbpd-date-${oid}`).value,
              contactAttemptMade: sbpdWrap.querySelector(`#sbpd-contact-${oid}`).value,
              contactMadeWithWhom: sbpdWrap.querySelector(`#sbpd-whom-${oid}`).value,
              sbpdAddressCorrect: sbpdWrap.querySelector(`#sbpd-addr-ok-${oid}`).value,
              sbpdCorrectedAddress: sbpdWrap.querySelector(`#sbpd-addr-fix-${oid}`).value,
              detroitStyleCustomCandidate: sbpdWrap.querySelector(`#sbpd-detroit-${oid}`).value,
              retaliationConcerns: sbpdWrap.querySelector(`#sbpd-retaliation-${oid}`).value
            });
            sbpdStatus.textContent = "Saved.";
            sbpdStatus.style.color = "#4ade80";
            await loadRecentRecords();
          } catch (e) {
            sbpdStatus.textContent = e.message || "Save failed.";
            sbpdStatus.style.color = "#f87171";
          }
        });

        sbpdActions.appendChild(saveSbpdBtn);
        sbpdWrap.appendChild(sbpdActions);
        sbpdWrap.appendChild(sbpdStatus);

        toggleSbpdBtn.addEventListener("click", () => {
          sbpdWrap.classList.toggle("hidden");
          toggleSbpdBtn.setAttribute(
            "aria-expanded",
            sbpdWrap.classList.contains("hidden") ? "false" : "true"
          );
        });
      }

      if (actions.childNodes.length) item.appendChild(actions);
      item.appendChild(notesWrap);
      if (sbpdWrap) item.appendChild(sbpdWrap);
    } else if (actions.childNodes.length) {
      item.appendChild(actions);
    }
    recordsEl.appendChild(item);
  });
}

async function fetchOrgSettings() {
  if (!currentSessionToken || authEnvMissing()) return;
  const enc = encodeURIComponent(orgSettingsClassName);
  const where = encodeURIComponent(JSON.stringify({ singletonKey: "default" }));
  try {
    const data = await back4AppRequest(
      `/classes/${enc}?where=${where}&limit=1&keys=inactiveAfterDays,objectId`,
      {
        method: "GET",
        headers: { "X-Parse-Session-Token": currentSessionToken }
      }
    );
    const row = data.results?.[0];
    if (row?.objectId) {
      orgSettingsObjectId = row.objectId;
      const n = Number(row.inactiveAfterDays);
      cachedInactiveAfterDays = Number.isNaN(n) ? 90 : Math.max(0, Math.min(3650, Math.floor(n)));
    } else {
      orgSettingsObjectId = null;
      cachedInactiveAfterDays = 90;
    }
  } catch {
    orgSettingsObjectId = null;
    cachedInactiveAfterDays = 90;
  }
}

function syncInactiveSettingsUI() {
  if (inactiveAfterDaysInput) inactiveAfterDaysInput.value = String(cachedInactiveAfterDays);
}

async function saveOrgSettingsFromUI() {
  if (!currentSessionToken || authEnvMissing()) return;
  const raw = Number(inactiveAfterDaysInput?.value ?? 90);
  let days = Math.floor(Number.isNaN(raw) ? 90 : raw);
  days = Math.max(0, Math.min(3650, days));
  const enc = encodeURIComponent(orgSettingsClassName);
  setStatus(inactiveSettingsStatusEl, "Saving...", "#93c5fd");
  try {
    if (orgSettingsObjectId) {
      await back4AppRequest(`/classes/${enc}/${orgSettingsObjectId}`, {
        method: "PUT",
        headers: {
          "X-Parse-Session-Token": currentSessionToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inactiveAfterDays: days })
      });
    } else {
      const created = await back4AppRequest(`/classes/${enc}`, {
        method: "POST",
        headers: {
          "X-Parse-Session-Token": currentSessionToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          singletonKey: "default",
          inactiveAfterDays: days,
          ACL: { "*": { read: true, write: true } }
        })
      });
      orgSettingsObjectId = created.objectId || null;
    }
    cachedInactiveAfterDays = days;
    syncInactiveSettingsUI();
    setStatus(inactiveSettingsStatusEl, "Rule saved. Recent list will apply it on reload.", "#4ade80");
    await loadRecentRecords();
  } catch (e) {
    setStatus(inactiveSettingsStatusEl, `Save failed: ${e.message}`, "#f87171");
  }
}

async function applyAutoInactiveToReferralSummaries(rows) {
  const days = cachedInactiveAfterDays;
  if (days <= 0 || !currentSessionToken || !rows?.length) return;
  const cutoffMs = Date.now() - days * 86400000;
  const enc = encodeURIComponent(referralSummaryClassName);
  for (const row of rows) {
    const status = String(row.recordStatus || "active").toLowerCase();
    if (status === "inactive" || !row.objectId) continue;
    const t = parseParseDate(row.updatedAt) || parseParseDate(row.createdAt);
    if (!t || t.getTime() > cutoffMs) continue;
    try {
      await back4AppRequest(`/classes/${enc}/${row.objectId}`, {
        method: "PUT",
        headers: {
          "X-Parse-Session-Token": currentSessionToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ recordStatus: "inactive" })
      });
    } catch {
      /* Row ACL / CLP may deny update */
    }
  }
}

async function loadRecentRecords() {
  if (authEnvMissing() || !currentSessionToken) {
    recordsEl.innerHTML = '<div class="record">Sign in to load recent records.</div>';
    return;
  }
  setStatus(recordsStatusEl, "");
  try {
    await fetchOrgSettings();
    syncInactiveSettingsUI();
    const query = new URLSearchParams({
      limit: "50",
      order: "-updatedAt",
      keys: "objectId,clientName,recordType,role,riskLevel,referralAgency,recordStatus,assignedTo,assignedToUsername,lastModifiedBy,updatedAt,createdAt,dateContactAttempted,contactAttemptMade,contactMadeWithWhom,sbpdAddressCorrect,sbpdCorrectedAddress,detroitStyleCustomCandidate,retaliationConcerns"
    });
    const url = `/classes/${encodeURIComponent(referralSummaryClassName)}?${query.toString()}`;
    const data = await back4AppRequest(url, {
      method: "GET",
      headers: { "X-Parse-Session-Token": currentSessionToken }
    });
    let rows = [...(data.results || data.rows || [])];
    await applyAutoInactiveToReferralSummaries(rows);
    if (cachedInactiveAfterDays > 0) {
      const dataFresh = await back4AppRequest(url, {
        method: "GET",
        headers: { "X-Parse-Session-Token": currentSessionToken }
      });
      rows = [...(dataFresh.results || [])];
    }
    rows.sort((a, b) => {
      const da = (parseParseDate(a.updatedAt) || parseParseDate(a.createdAt) || new Date(0)).getTime();
      const db = (parseParseDate(b.updatedAt) || parseParseDate(b.createdAt) || new Date(0)).getTime();
      return db - da;
    });
    renderRecords(rows.slice(0, 25));
  } catch (error) {
    recordsEl.innerHTML = `<div class="record">Failed to load records: ${error.message}</div>`;
  }
}

function formatDurationMinutes(min) {
  const m = Number(min) || 0;
  if (m <= 0) return "0 min";
  if (m % 60 === 0) {
    const h = m / 60;
    return `${h} hr${h === 1 ? "" : "s"}`;
  }
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return `${h}h ${r}m`;
}

function renderTimeLogs(rows) {
  if (!timeLogsListEl) return;
  timeLogsListEl.innerHTML = "";
  if (!rows.length) {
    timeLogsListEl.innerHTML = '<div class="small">No time entries yet.</div>';
    return;
  }
  rows.forEach((row) => {
    const div = document.createElement("div");
    div.className = "timelog-item";
    let when = "—";
    const wd = row.workDate;
    if (wd && typeof wd === "object" && wd.iso) {
      when = new Date(wd.iso).toLocaleDateString();
    } else if (wd) {
      when = new Date(wd).toLocaleDateString();
    }
    const cats = Array.isArray(row.categories) ? row.categories : [];
    const catLabels = cats
      .map((c) => {
        if (!c || typeof c !== "object") return "";
        if (c.name) return String(c.name);
        const id = c.objectId;
        if (id) {
          const found = timeCategoriesCache.find((x) => x.objectId === id);
          return found?.name ? String(found.name) : "";
        }
        return "";
      })
      .filter(Boolean);
    const head = document.createElement("div");
    head.innerHTML = `<strong>${when}</strong> — ${formatDurationMinutes(row.durationMinutes)}`;
    div.appendChild(head);
    if (row.notes) {
      const noteEl = document.createElement("div");
      noteEl.className = "small";
      noteEl.style.marginTop = "0.35rem";
      noteEl.textContent = row.notes;
      div.appendChild(noteEl);
    }
    const tags = document.createElement("div");
    tags.className = "timelog-tags";
    catLabels.forEach((label) => {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = label;
      tags.appendChild(pill);
    });
    div.appendChild(tags);
    timeLogsListEl.appendChild(div);
  });
}

async function ensureDefaultTimeCategories() {
  if (!currentSessionToken || authEnvMissing()) return;
  const encClass = encodeURIComponent(timeCategoryClassName);
  const probe = await back4AppRequest(`/classes/${encClass}?limit=1&keys=objectId`, {
    method: "GET",
    headers: { "X-Parse-Session-Token": currentSessionToken }
  });
  if (probe.results?.length) return;
  const openAcl = { "*": { read: true, write: true } };
  for (let i = 0; i < DEFAULT_TIME_CATEGORY_NAMES.length; i++) {
    await back4AppRequest(`/classes/${encClass}`, {
      method: "POST",
      headers: {
        "X-Parse-Session-Token": currentSessionToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: DEFAULT_TIME_CATEGORY_NAMES[i],
        sortOrder: i,
        ACL: openAcl
      })
    });
  }
}

async function fetchTimeCategories() {
  if (!currentSessionToken || authEnvMissing()) {
    timeCategoriesCache = [];
    return [];
  }
  const encClass = encodeURIComponent(timeCategoryClassName);
  const qs = new URLSearchParams({
    limit: "200",
    order: "sortOrder,name",
    keys: "name,sortOrder,objectId"
  });
  const data = await back4AppRequest(`/classes/${encClass}?${qs}`, {
    method: "GET",
    headers: { "X-Parse-Session-Token": currentSessionToken }
  });
  timeCategoriesCache = Array.isArray(data.results) ? data.results : [];
  return timeCategoriesCache;
}

function renderTimeCategoryManager() {
  if (!timeCategoriesListEl) return;
  timeCategoriesListEl.innerHTML = "";
  if (!timeCategoriesCache.length) {
    timeCategoriesListEl.innerHTML =
      '<span class="small">No categories yet — add one below or reload after creating the TimeCategory class in Back4App.</span>';
    return;
  }
  timeCategoriesCache.forEach((cat) => {
    const row = document.createElement("div");
    row.className = "category-row";
    const input = document.createElement("input");
    input.type = "text";
    input.value = cat.name || "";
    input.setAttribute("aria-label", "Category name");
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn-secondary";
    saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", () => saveTimeCategory(cat.objectId, input.value.trim()));
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn-secondary";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => deleteTimeCategory(cat.objectId));
    actions.appendChild(saveBtn);
    actions.appendChild(delBtn);
    row.appendChild(input);
    row.appendChild(actions);
    timeCategoriesListEl.appendChild(row);
  });
}

function renderTimeCategoryCheckboxes() {
  if (!timeCategoryCheckboxesEl) return;
  timeCategoryCheckboxesEl.innerHTML = "";
  if (!timeCategoriesCache.length) {
    timeCategoryCheckboxesEl.innerHTML = '<span class="small">No categories yet.</span>';
    return;
  }
  timeCategoriesCache.forEach((cat) => {
    const id = `tc-${cat.objectId}`;
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.name = "timeCategories";
    cb.value = cat.objectId;
    cb.id = id;
    label.setAttribute("for", id);
    label.appendChild(cb);
    label.appendChild(document.createTextNode(cat.name || "Untitled"));
    timeCategoryCheckboxesEl.appendChild(label);
  });
}

async function saveTimeCategory(objectId, name) {
  if (!objectId || !name) {
    setStatus(timelogStatusEl, "Category name required.", "#f87171");
    return;
  }
  const enc = encodeURIComponent(timeCategoryClassName);
  try {
    await back4AppRequest(`/classes/${enc}/${objectId}`, {
      method: "PUT",
      headers: {
        "X-Parse-Session-Token": currentSessionToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name })
    });
    await fetchTimeCategories();
    renderTimeCategoryManager();
    renderTimeCategoryCheckboxes();
    setStatus(timelogStatusEl, "Category updated.", "#4ade80");
  } catch (e) {
    setStatus(timelogStatusEl, `Update failed: ${e.message}`, "#f87171");
  }
}

async function deleteTimeCategory(objectId) {
  if (!objectId) return;
  if (!window.confirm("Delete this category? Past entries may still reference it by id.")) return;
  const enc = encodeURIComponent(timeCategoryClassName);
  try {
    await back4AppRequest(`/classes/${enc}/${objectId}`, {
      method: "DELETE",
      headers: { "X-Parse-Session-Token": currentSessionToken }
    });
    await fetchTimeCategories();
    renderTimeCategoryManager();
    renderTimeCategoryCheckboxes();
    await loadTimeLogs();
    setStatus(timelogStatusEl, "Category deleted.", "#4ade80");
  } catch (e) {
    setStatus(timelogStatusEl, `Delete failed: ${e.message}`, "#f87171");
  }
}

async function addTimeCategory() {
  const name = String(newTimeCategoryInput?.value || "").trim();
  if (!name) {
    setStatus(timelogStatusEl, "Enter a category name.", "#f87171");
    return;
  }
  const enc = encodeURIComponent(timeCategoryClassName);
  const nextOrder =
    timeCategoriesCache.length > 0
      ? Math.max(...timeCategoriesCache.map((c) => Number(c.sortOrder) || 0)) + 1
      : 0;
  try {
    await back4AppRequest(`/classes/${enc}`, {
      method: "POST",
      headers: {
        "X-Parse-Session-Token": currentSessionToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        sortOrder: nextOrder,
        ACL: { "*": { read: true, write: true } }
      })
    });
    if (newTimeCategoryInput) newTimeCategoryInput.value = "";
    await fetchTimeCategories();
    renderTimeCategoryManager();
    renderTimeCategoryCheckboxes();
    setStatus(timelogStatusEl, "Category added.", "#4ade80");
  } catch (e) {
    setStatus(timelogStatusEl, `Add failed: ${e.message}`, "#f87171");
  }
}

async function loadTimeLogs() {
  if (!timeLogsListEl || !currentSessionToken || !currentUser?.objectId) return;
  const encLog = encodeURIComponent(timeLogClassName);
  const where = encodeURIComponent(
    JSON.stringify({
      user: {
        __type: "Pointer",
        className: "_User",
        objectId: currentUser.objectId
      }
    })
  );
  const keys = encodeURIComponent("workDate,durationMinutes,categories,notes,createdAt");
  const path = `/classes/${encLog}?where=${where}&limit=40&order=-workDate,-createdAt&keys=${keys}&include=categories`;
  try {
    const data = await back4AppRequest(path, {
      method: "GET",
      headers: { "X-Parse-Session-Token": currentSessionToken }
    });
    renderTimeLogs(data.results || []);
  } catch (e) {
    setStatus(timelogStatusEl, `Could not load time entries: ${e.message}`, "#f87171");
    renderTimeLogs([]);
  }
}

async function initTimeLogging() {
  if (!currentUser || !currentSessionToken || authEnvMissing()) return;
  setStatus(timelogStatusEl, "");
  try {
    await ensureDefaultTimeCategories();
    await fetchTimeCategories();
    renderTimeCategoryManager();
    renderTimeCategoryCheckboxes();
    if (timelogDateInput) {
      timelogDateInput.value = new Date().toISOString().slice(0, 10);
    }
    if (timelogHoursInput && !timelogHoursInput.value) timelogHoursInput.value = "1";
    await loadTimeLogs();
  } catch (e) {
    setStatus(timelogStatusEl, `Time logging unavailable: ${e.message}`, "#f87171");
  }
}

function clearTimeLoggingUI() {
  timeCategoriesCache = [];
  if (timeCategoriesListEl) timeCategoriesListEl.innerHTML = "";
  if (timeCategoryCheckboxesEl) {
    timeCategoryCheckboxesEl.innerHTML = '<span class="small">Sign in to load categories.</span>';
  }
  if (timeLogsListEl) timeLogsListEl.innerHTML = "";
  if (timelogStatusEl) timelogStatusEl.textContent = "";
}

async function saveTimeLogEntry(event) {
  event.preventDefault();
  if (!currentUser?.objectId || !currentSessionToken) return;
  const checked = Array.from(
    timeCategoryCheckboxesEl?.querySelectorAll('input[type="checkbox"]:checked') || []
  );
  if (!checked.length) {
    setStatus(timelogStatusEl, "Select at least one category.", "#f87171");
    return;
  }
  const hours = Number(timelogHoursInput?.value || 0);
  if (!hours || hours <= 0) {
    setStatus(timelogStatusEl, "Enter a positive number of hours.", "#f87171");
    return;
  }
  const dateStr = String(timelogDateInput?.value || "").trim();
  if (!dateStr) {
    setStatus(timelogStatusEl, "Pick a date.", "#f87171");
    return;
  }
  const durationMinutes = Math.round(hours * 60);
  const categories = checked.map((el) => ({
    __type: "Pointer",
    className: timeCategoryClassName,
    objectId: el.value
  }));
  const workDateIso = new Date(`${dateStr}T12:00:00`).toISOString();
  const notes = String(timelogNotesInput?.value || "").trim();
  const encClass = encodeURIComponent(timeLogClassName);
  const ownerAcl = { [currentUser.objectId]: { read: true, write: true } };
  setStatus(timelogStatusEl, "Saving time entry...", "#93c5fd");
  try {
    await back4AppRequest(`/classes/${encClass}`, {
      method: "POST",
      headers: {
        "X-Parse-Session-Token": currentSessionToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user: {
          __type: "Pointer",
          className: "_User",
          objectId: currentUser.objectId
        },
        workDate: { __type: "Date", iso: workDateIso },
        durationMinutes,
        categories,
        notes,
        ACL: ownerAcl
      })
    });
    setStatus(timelogStatusEl, "Time entry saved.", "#4ade80");
    timelogForm?.reset();
    if (timelogDateInput) timelogDateInput.value = new Date().toISOString().slice(0, 10);
    if (timelogHoursInput) timelogHoursInput.value = "1";
    await loadTimeLogs();
  } catch (err) {
    setStatus(timelogStatusEl, `Save failed: ${err.message}`, "#f87171");
  }
}

function getFormPayload(form) {
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.clientName = payload.clientName.trim();
  payload.clientNameLower = normalizeName(payload.clientName);
  payload.additionalInfo = payload.additionalInfo?.trim() || "";
  payload.charges = payload.charges?.trim() || "";
  payload.contactMadeWithWhom = String(payload.contactMadeWithWhom || "").trim();
  payload.sbpdCorrectedAddress = String(payload.sbpdCorrectedAddress || "").trim();
  payload.recordStatus = "active";
  payload.lastModifiedBy = currentUser?.username || currentUser?.email || "unknown_user";
  const self = String(currentUser?.username || currentUser?.email || "").trim();
  if (!userHasAdminPrivileges(currentUser)) {
    payload.assignedTo = self;
  } else {
    payload.assignedTo = String(payload.assignedTo || "").trim() || self || payload.lastModifiedBy;
  }
  return payload;
}

async function saveReferral(event) {
  event.preventDefault();
  if (!currentUser) {
    setStatus(intakeStatusEl, "Please sign in first.", "#f87171");
    return;
  }
  if (envMissing()) {
    setStatus(
      intakeStatusEl,
      "Add VITE_SHEETS_API_URL (your Apps Script web app URL) to .env, save, and restart the dev server.",
      "#f87171"
    );
    return;
  }
  const payload = getFormPayload(intakeForm);
  if (!payload.clientName) {
    setStatus(intakeStatusEl, "Client name is required.", "#f87171");
    return;
  }

  // Prevent creating duplicates by checking similar names in the Sheets archive.
  const dup = await checkPossibleDuplicate(payload.clientName);
  if (dup) {
    setStatus(intakeStatusEl, "Possible duplicate found. Review the name before saving.", "#facc15");
    return;
  }

  setStatus(intakeStatusEl, "Saving referral...", "#93c5fd");
  try {
    await sheetsApiRequest("POST", {
      action: "create",
      record: payload
    });
    let saveMessage = "Referral saved successfully.";
    try {
      await createReferralSummary(payload);
    } catch (mirrorError) {
      saveMessage = `Referral saved to Sheets, but summary sync failed: ${mirrorError.message}`;
    }
    setStatus(intakeStatusEl, saveMessage, saveMessage.includes("failed") ? "#facc15" : "#4ade80");
    intakeForm.reset();
    duplicateWarningEl.textContent = "";
    updateRoleSelect();
    await setupAssignmentUI();
    await loadRecentRecords();
    await new Promise((r) => setTimeout(r, 500));
    await loadRecentRecords();
  } catch (error) {
    setStatus(intakeStatusEl, `Save failed: ${error.message}`, "#f87171");
  }
}

async function handleSignIn(event) {
  event.preventDefault();
  if (authEnvMissing()) {
    setStatus(authStatusEl, "Missing Back4App env vars in .env.", "#f87171");
    return;
  }
  const formData = new FormData(authForm);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();
  if (!username || !password) {
    setStatus(authStatusEl, "Username and password are required.", "#f87171");
    return;
  }
  const email = String(formData.get("email") || "").trim();
  const roles = [];
  if (roleAdminCheckbox.checked) roles.push("admin");
  if (roleSocialWorkerCheckbox.checked) roles.push("social_worker");

  if (authMode === "register" && roles.length === 0) {
    setStatus(authStatusEl, "Select at least one role.", "#f87171");
    return;
  }

  setStatus(authStatusEl, authMode === "register" ? "Registering..." : "Signing in...", "#93c5fd");
  try {
    const auth =
      authMode === "register"
        ? await signUp(username, password, email, roles)
        : await signIn(username, password);
    currentSessionToken = auth.sessionToken;
    const user = await validateSession(auth.sessionToken);
    saveSession(auth.sessionToken, user);
    await showLoggedInUI(user);
    setStatus(authStatusEl, "");
    await loadRecentRecords();
  } catch (error) {
    setStatus(authStatusEl, `Sign-in failed: ${error.message}`, "#f87171");
  }
}

async function bootstrapSession() {
  if (authEnvMissing()) {
    setStatus(authStatusEl, "Set Back4App env vars to enable login.", "#facc15");
    showLoggedOutUI();
    return;
  }
  const saved = loadSession();
  if (!saved) {
    showLoggedOutUI();
    return;
  }
  try {
    currentSessionToken = saved.sessionToken;
    const user = await validateSession(saved.sessionToken);
    saveSession(saved.sessionToken, user);
    await showLoggedInUI(user);
    await loadRecentRecords();
  } catch {
    clearSession();
    showLoggedOutUI();
  }
}

function handleLogout() {
  lastTimeReportExport = null;
  sbpdCsvFetchedRows = [];
  if (sbpdCsvTableWrap) sbpdCsvTableWrap.innerHTML = "";
  setStatus(sbpdCsvStatusEl, "");
  clearSession();
  intakeForm.reset();
  recordsEl.innerHTML = "";
  setStatus(recordsStatusEl, "");
  duplicateWarningEl.textContent = "";
  setStatus(intakeStatusEl, "");
  orgSettingsObjectId = null;
  cachedInactiveAfterDays = 90;
  setStatus(inactiveSettingsStatusEl, "");
  clearTimeLoggingUI();
  showLoggedOutUI();
}

authForm?.addEventListener("submit", handleSignIn);
showRegisterBtn?.addEventListener("click", () => setAuthMode("register"));
authReturnSigninBtn?.addEventListener("click", () => setAuthMode("signin"));
logoutBtn?.addEventListener("click", handleLogout);
intakeForm?.addEventListener("submit", saveReferral);
timelogForm?.addEventListener("submit", saveTimeLogEntry);
addTimeCategoryBtn?.addEventListener("click", () => addTimeCategory());
saveInactiveSettingsBtn?.addEventListener("click", () => saveOrgSettingsFromUI());
reportPeriodTypeSelect?.addEventListener("change", () => {
  const isCustom = reportPeriodTypeSelect.value === "custom";
  reportEndDateWrap?.classList.toggle("hidden", !isCustom);
});
if (reportStartDateInput && !reportStartDateInput.value) {
  reportStartDateInput.value = new Date().toISOString().slice(0, 10);
}
reportPeriodTypeSelect?.dispatchEvent(new Event("change"));
generateReportBtn?.addEventListener("click", () => generateReportPreview());
exportReportPdfBtn?.addEventListener("click", () => exportReportPdfViaPrint());
timeReportPeriodTypeSelect?.addEventListener("change", () => {
  const isCustom = timeReportPeriodTypeSelect.value === "custom";
  timeReportEndDateWrap?.classList.toggle("hidden", !isCustom);
});
if (timeReportStartDateInput && !timeReportStartDateInput.value) {
  timeReportStartDateInput.value = new Date().toISOString().slice(0, 10);
}
timeReportPeriodTypeSelect?.dispatchEvent(new Event("change"));
generateTimeReportBtn?.addEventListener("click", () => generateTimeReportPreview());
exportTimeReportPdfBtn?.addEventListener("click", () => exportTimeReportPdfViaPrint());
exportTimeReportJpgBtn?.addEventListener("click", () => exportTimeReportJpg());
sbpdCsvFetchBtn?.addEventListener("click", () => fetchSbpdCsvList());
sbpdCsvDownloadBtn?.addEventListener("click", () => downloadSbpdCsv());
sbpdCsvSelectAllBtn?.addEventListener("click", () => setAllSbpdCsvCheckboxes(true));
sbpdCsvDeselectAllBtn?.addEventListener("click", () => setAllSbpdCsvCheckboxes(false));
document.getElementById("clientName")?.addEventListener("blur", (event) => {
  checkPossibleDuplicate(event.target.value);
});

bootstrapSession();
