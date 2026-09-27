const BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const KEY = "skilltrace.auth";

export function getAuth() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function setAuth(auth) {
  try {
    if (auth) window.localStorage.setItem(KEY, JSON.stringify(auth));
    else window.localStorage.removeItem(KEY);
  } catch {}
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function refresh(auth) {
  const r = await fetch(`${BASE}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: auth.tokens.refresh }),
  });
  if (!r.ok) return null;
  const data = await r.json();
  const next = { ...auth, tokens: { ...auth.tokens, access: data.access } };
  setAuth(next);
  return next;
}

export async function api(path, { method = "GET", body, form, params, auth = true, retry = true } = {}) {
  let url = `${BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""));
    if ([...qs].length) url += `?${qs}`;
  }
  const headers = {};
  const stored = auth ? getAuth() : null;
  if (stored?.tokens?.access) headers.Authorization = `Bearer ${stored.tokens.access}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, { method, headers, body: payload });
  } catch {
    throw new ApiError("Cannot reach the SkillTrace server. Check that the backend is running.", 0);
  }
  if (res.status === 401 && stored && retry) {
    const next = await refresh(stored);
    if (next) return api(path, { method, body, form, params, auth, retry: false });
    setAuth(null);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("skilltrace:logout"));
  }
  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) throw new ApiError(data?.detail || `Request failed (${res.status})`, res.status, data);
  return data;
}
