const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

// Small helper that always hits the API base and returns JSON (or throws)
async function _json(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    mode: "cors",
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      if (j?.detail) msg = j.detail;
    } catch (_) {}
    const err = new Error(msg);
    err.response = res;
    throw err;
  }
  return res.json();
}

export async function listArticles(limit = 50) {
  return _json(`/articles?limit=${encodeURIComponent(limit)}`);
}

export async function getArticle(id) {
  return _json(`/articles/${id}`);
}

export async function deleteArticle(id) {
  const res = await fetch(`${API_BASE}/articles/${id}`, { method: "DELETE", mode: "cors" });
  if (!res.ok && res.status !== 204) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
}

export async function listHighlights(articleId, limit = 50) {
  return _json(
    `/highlights?article_id=${encodeURIComponent(articleId)}&limit=${encodeURIComponent(limit)}`
  );
}

export async function analyzeArticle(payload, { full = false } = {}) {
  return _json(`/analyze?full=${full ? "true" : "false"}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function exportCsvUrl(articleId) {
  return `${API_BASE}/articles/${articleId}/export.csv`;
}

// Optional generic GET if you need it elsewhere
export function apiGet(path, init = {}) {
  return fetch(`${API_BASE}${path}`, { ...init, mode: "cors" });
}
