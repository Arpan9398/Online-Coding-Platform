const TOKEN_KEY = 'token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, method = 'GET', body) {
  const token = getToken();
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // An expired token on a signed-in request means the session is over.
    if (res.status === 401 && token && !path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {
      clearToken();
      window.dispatchEvent(new Event('auth:expired'));
    }
    const fields = data.fieldErrors ? Object.values(data.fieldErrors).join(' ') : '';
    throw new Error(fields || data.message || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, b) => request(p, 'POST', b),
  put: (p, b) => request(p, 'PUT', b),
  del: (p) => request(p, 'DELETE')
};

export const STATUS_LABEL = {
  ACCEPTED: 'Accepted',
  PASSED: 'Passed',
  WRONG_ANSWER: 'Wrong answer',
  RUNTIME_ERROR: 'Runtime error',
  TIME_LIMIT_EXCEEDED: 'Time limit exceeded',
  OUTPUT_LIMIT_EXCEEDED: 'Output limit exceeded'
};

export const formatTime = (iso) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
