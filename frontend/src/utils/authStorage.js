const TOKEN_KEY = 'sgip_token';
const USER_KEY = 'sgip_user';
const PENDING_EMAIL_KEY = 'sgip_pending_email';
const PENDING_FLOW_KEY = 'sgip_pending_flow';

function parseJson(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setStoredToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser() {
  return parseJson(localStorage.getItem(USER_KEY), null);
}

export function setStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PENDING_EMAIL_KEY);
  localStorage.removeItem(PENDING_FLOW_KEY);
  localStorage.removeItem('sgip_student_id');
}

export function setPendingAuth({ email, flow }) {
  if (email) localStorage.setItem(PENDING_EMAIL_KEY, email);
  if (flow) localStorage.setItem(PENDING_FLOW_KEY, flow);
}

export function getPendingAuth() {
  return {
    email: localStorage.getItem(PENDING_EMAIL_KEY) || '',
    flow: localStorage.getItem(PENDING_FLOW_KEY) || '',
  };
}

export function clearPendingAuth() {
  localStorage.removeItem(PENDING_EMAIL_KEY);
  localStorage.removeItem(PENDING_FLOW_KEY);
}
