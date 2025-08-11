const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

async function _json(url, opts = {}) {
  const res = await fetch(url, {
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
  return _json(`${BASE}/articles?limit=${encodeURIComponent(limit)}`);
}

export async function getArticle(id) {
  return _json(`${BASE}/articles/${id}`);
}

export async function deleteArticle(id) {
  const res = await fetch(`${BASE}/articles/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
}

export async function listHighlights(articleId, limit = 50) {
  return _json(
    `${BASE}/highlights?article_id=${encodeURIComponent(
      articleId
    )}&limit=${encodeURIComponent(limit)}`
  );
}

export async function analyzeArticle(payload, { full = false } = {}) {
  return _json(`${BASE}/analyze?full=${full ? "true" : "false"}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// export
export function exportCsvUrl(articleId) {
  return `${BASE}/articles/${articleId}/export.csv`;
}

export async function listNarratives(order = "desc") {
  // If the backend route isn't there yet, this will 404; callers guard it.
  return _json(`${BASE}/narratives?order=${encodeURIComponent(order)}`);
}