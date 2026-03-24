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
const assignedToOtherWrap = document.getElementById("assignedTo-other-wrap");
const assignedToOtherInput = document.getElementById("assignedToOther");
const assignedToHintEl = document.getElementById("assignedTo-hint");

const directSheetsApiUrl = import.meta.env.VITE_SHEETS_API_URL?.trim();
const isLocalDev = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const sheetsApiUrl = isLocalDev ? "/api/sheets" : directSheetsApiUrl;

const back4AppAppId = import.meta.env.VITE_BACK4APP_APP_ID?.trim();
const back4AppJsKey = import.meta.env.VITE_BACK4APP_JS_KEY?.trim();
const back4AppServerUrl = import.meta.env.VITE_BACK4APP_SERVER_URL?.trim().replace(/\/$/, "");
const extraAssigneeUsernames = String(import.meta.env.VITE_ASSIGNEE_USERNAMES || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
/** Same-origin Netlify function by default; override for local `netlify dev` on another port. */
const staffUsersListUrl = import.meta.env.VITE_STAFF_USERS_URL?.trim();
const authStorageKey = "ngo_auth_session";

let currentUser = null;
let currentSessionToken = "";
let authMode = "signin";

function setStatus(el, message, color = "#cbd5e1") {
  if (!el) return;
  el.textContent = message;
  el.style.color = color;
}

function envMissing() {
  return !sheetsApiUrl;
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
  await setupAssignmentUI();
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
    if (serverRows.length > 0) {
      return Array.from(byKey.values());
    }
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
  if (assignedToOtherInput) assignedToOtherInput.value = "";
  if (assignedToHintEl) assignedToHintEl.textContent = "";

  if (!userHasAdminPrivileges(currentUser)) {
    assignedToOtherWrap?.classList.add("hidden");
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

  assignedToOtherWrap?.classList.remove("hidden");
  assignedToSelect.disabled = false;
  const assignees = new Map();
  if (selfName) assignees.set(selfName, `${selfName} (you)`);

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

  extraAssigneeUsernames.forEach((uname) => {
    if (!assignees.has(uname)) assignees.set(uname, uname);
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

  if (assignedToHintEl) {
    const others = Array.from(assignees.keys()).filter((k) => k !== selfName);
    if (others.length === 0) {
      assignedToHintEl.textContent =
        staff === null
          ? "Could not load staff from Back4App. Deploy with Netlify Functions and BACK4APP_MASTER_KEY (see .env.example), or type a username below / VITE_ASSIGNEE_USERNAMES / sheet history."
          : "Parse hides other users from the browser (row ACL), not class permissions. Use the Netlify staff-users function + master key on the server, or the manual username field / VITE_ASSIGNEE_USERNAMES / sheet names.";
    } else {
      assignedToHintEl.textContent = "";
    }
  }

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

async function validateSession(sessionToken) {
  return back4AppRequest("/users/me", {
    method: "GET",
    headers: {
      "X-Parse-Session-Token": sessionToken
    }
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
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error || data.message || `Google Sheets request failed (${response.status})`;
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

function renderRecords(records) {
  recordsEl.innerHTML = "";
  if (!records.length) {
    recordsEl.innerHTML = '<div class="record">No records yet. Save your first referral above.</div>';
    return;
  }
  records.forEach((record) => {
    const item = document.createElement("div");
    item.className = "record";
    item.innerHTML = `
      <div><strong>${record.clientName || "Unnamed"}</strong> - ${record.recordType || "contact"} <span class="pill">${toRoleLabel(record.role || "social_worker")}</span></div>
      <div class="small">Agency: ${record.referralAgency || "N/A"} | Risk: ${record.riskLevel || "unknown"} | Assigned: ${record.assignedTo || "Unassigned"}</div>
      <div class="small">Updated: ${record.updatedAt ? new Date(record.updatedAt).toLocaleString() : "N/A"} | Modified by: ${record.lastModifiedBy || "N/A"}</div>
    `;
    recordsEl.appendChild(item);
  });
}

async function loadRecentRecords() {
  if (envMissing()) {
    recordsEl.innerHTML = '<div class="record">Set `VITE_SHEETS_API_URL` in `.env` to load records.</div>';
    return;
  }
  try {
    const data = await sheetsApiRequest("GET", {
      action: "list",
      limit: "50"
    });
    const rows = [...(data.results || data.rows || [])];
    rows.sort((a, b) => {
      const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const db = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return db - da;
    });
    renderRecords(rows.slice(0, 25));
  } catch (error) {
    recordsEl.innerHTML = `<div class="record">Failed to load records: ${error.message}</div>`;
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
  const manualOther = String(assignedToOtherInput?.value || "").trim();
  if (!userHasAdminPrivileges(currentUser)) {
    payload.assignedTo = self;
  } else if (manualOther) {
    payload.assignedTo = manualOther;
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
    setStatus(intakeStatusEl, "Set VITE_SHEETS_API_URL in .env, save, and restart npm run dev.", "#f87171");
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
    setStatus(intakeStatusEl, "Referral saved successfully.", "#4ade80");
    intakeForm.reset();
    if (assignedToOtherInput) assignedToOtherInput.value = "";
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
  showLoggedOutUI();
}

authForm?.addEventListener("submit", handleSignIn);
showRegisterBtn?.addEventListener("click", () => setAuthMode("register"));
authReturnSigninBtn?.addEventListener("click", () => setAuthMode("signin"));
logoutBtn?.addEventListener("click", handleLogout);
intakeForm?.addEventListener("submit", saveReferral);
document.getElementById("clientName")?.addEventListener("blur", (event) => {
  checkPossibleDuplicate(event.target.value);
});

bootstrapSession();
