/**
 * Lists _User rows using the Master Key (server-only).
 * Client-side queries only see the current user because Parse ACL hides other users.
 * Configure BACK4APP_MASTER_KEY in Netlify (never in VITE_* or the browser).
 */

const serverUrl = process.env.BACK4APP_SERVER_URL?.replace(/\/$/, "") || "";
const appId = process.env.BACK4APP_APP_ID || "";
const jsKey = process.env.BACK4APP_JS_KEY || "";
const masterKey = process.env.BACK4APP_MASTER_KEY || "";

function parseRoles(raw) {
  if (Array.isArray(raw) && raw.length) return raw.map(String);
  if (typeof raw === "string" && raw.trim()) {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p.map(String);
    } catch {
      /* ignore */
    }
  }
  return [];
}

function userHasAdminPrivileges(user) {
  const roles = parseRoles(user?.roles);
  if (!roles.length) return false;
  return roles.includes("admin") || roles.includes("admin_social_worker");
}

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "X-Parse-Session-Token, Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: jsonHeaders };
  }
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }), headers: jsonHeaders };
  }
  if (!serverUrl || !appId || !masterKey) {
    return {
      statusCode: 501,
      body: JSON.stringify({ error: "Staff list not configured (set BACK4APP_* on Netlify)" }),
      headers: jsonHeaders
    };
  }
  if (!jsKey) {
    return {
      statusCode: 501,
      body: JSON.stringify({ error: "Missing BACK4APP_JS_KEY" }),
      headers: jsonHeaders
    };
  }

  const sessionToken =
    event.headers["x-parse-session-token"] || event.headers["X-Parse-Session-Token"] || "";
  if (!sessionToken) {
    return { statusCode: 401, body: JSON.stringify({ error: "Missing session" }), headers: jsonHeaders };
  }

  const meRes = await fetch(`${serverUrl}/users/me`, {
    headers: {
      "X-Parse-Application-Id": appId,
      "X-Parse-Javascript-Key": jsKey,
      "X-Parse-Session-Token": sessionToken
    }
  });
  const meData = await meRes.json().catch(() => ({}));
  if (!meRes.ok) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: meData.error || "Invalid session" }),
      headers: jsonHeaders
    };
  }
  if (!userHasAdminPrivileges(meData)) {
    return { statusCode: 403, body: JSON.stringify({ error: "Admin only" }), headers: jsonHeaders };
  }

  const keys = encodeURIComponent("username,email,roles,objectId");
  const usersRes = await fetch(`${serverUrl}/users?limit=500&keys=${keys}`, {
    headers: {
      "X-Parse-Application-Id": appId,
      "X-Parse-Master-Key": masterKey
    }
  });
  const usersData = await usersRes.json().catch(() => ({}));
  if (!usersRes.ok) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: usersData.error || "Parse users query failed" }),
      headers: jsonHeaders
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ results: usersData.results || [] }),
    headers: jsonHeaders
  };
};
