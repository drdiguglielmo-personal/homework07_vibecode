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
const orgSettingsClassName =
  String(import.meta.env.VITE_ORG_SETTINGS_CLASS || "OrgSettings").trim() || "OrgSettings";
/** Days without summary update before recordStatus → inactive (0 = off). Loaded from OrgSettings. */
let cachedInactiveAfterDays = 90;
let orgSettingsObjectId = null;
const timeCategoryClassName =
  String(import.meta.env.VITE_TIME_CATEGORY_CLASS || "TimeCategory").trim() || "TimeCategory";
const timeLogClassName = String(import.meta.env.VITE_TIME_LOG_CLASS || "TimeLog").trim() || "TimeLog";
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
  if (!normalized) return;
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
    }
  } catch {
    // Ignore duplicate check errors.
  }
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
  try {
    await fetchOrgSettings();
    syncInactiveSettingsUI();
    const query = new URLSearchParams({
      limit: "50",
      order: "-updatedAt",
      keys: "objectId,clientName,recordType,role,riskLevel,referralAgency,recordStatus,assignedTo,assignedToUsername,lastModifiedBy,updatedAt,createdAt"
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
  clearSession();
  intakeForm.reset();
  recordsEl.innerHTML = "";
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
document.getElementById("clientName")?.addEventListener("blur", (event) => {
  checkPossibleDuplicate(event.target.value);
});

bootstrapSession();
