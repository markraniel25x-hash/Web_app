// ================================================================
// gasClient.js — Central API layer for Google Apps Script backend
// ================================================================

// ⚠️  Replace this with your deployed GAS Web App URL
export const GAS_URL =
  'https://script.google.com/macros/s/AKfycbw9uc7nPwGCNvfc_fhlKe7W6DzLT7oi9bldAP4dajpUjkSEWdVC6ITTrYUwOXV776cY/exec';

/**
 * POST to GAS.
 * @param {object} payload  Must include `action` and any data fields.
 */
export async function gasPost(payload) {
  const user = getStoredUser();
  const fullPayload = {
    email: user?.email,
    password: user?.password,
    ...payload, // Payload (like action: 'login') will overwrite the defaults above
  };
  const res = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify(fullPayload),
  });
  return res.json();
}

/**
 * GET from GAS.
 * @param {string} action  The action name.
 * @param {object} params  Additional query params (email is pulled from localStorage).
 */
export async function gasGet(action, params = {}) {
  const user = getStoredUser();
  const query = new URLSearchParams({
    action,
    email: user?.email ?? '',
    ...params,
  });
  const res = await fetch(`${GAS_URL}?${query}`);
  return res.json();
}

/**
 * Authenticate: POST { action: 'login', email, password }
 */
export async function gasLogin(email, password) {
  return gasPost({ action: 'login', email, password });
}

// ── Session helpers ──────────────────────────────────────────────
const SESSION_KEY = 'asa_user';

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(SESSION_KEY);
}
