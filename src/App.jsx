import { useEffect, useMemo, useState } from "react";
import "./index.css";
import {
  analyzeArticle,
  listArticles,
  deleteArticle,
  listHighlights,
  getArticle,
  exportCsvUrl,
  listNarratives,
} from "./lib/api";

/* ------- helpers ------- */
function bandOf(v) {
  if (v == null || Number.isNaN(v)) return "low";
  if (v < 30) return "low";
  if (v < 50) return "medium";
  if (v < 70) return "high";
  return "extremely_high";
}
function verdict(idx) {
  if (idx < 30) return "Not biased";
  if (idx < 50) return "Some bias";
  if (idx < 70) return "Biased";
  return "Highly biased";
}
function bandColor(v) {
  if (v < 30) return "#2ecc71";
  if (v < 60) return "#f1c40f";
  if (v < 80) return "#e67e22";
  return "#e74c3c";
}

/* ------- basic layout bits ------- */
function Header() {
  return (
    <header className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 20 }}>
      <div className="logo">BIAS&nbsp;LAB</div>
      {/* API label removed per request */}
    </header>
  );
}

function Hero() {
  return (
    <div className="container">
      <section className="hero">
        <div>
          {/* timezone row removed per request */}
          <div className="logo" style={{ marginBottom: 10 }}>MEDIA BIAS ANALYSIS</div>
          <h1>Real-Time Intelligence with Highlighted Framing</h1>
        </div>
      </section>
    </div>
  );
}

/* rectangular panel */
function Panel({ children, style }) {
  return <div className="panel" style={style}>{children}</div>;
}

/* ------- Analyze ------- */
function AnalyzePanel({ onAnalyzed, onBusyChange }) {
  const [mode, setMode] = useState("url");
  const [title, setTitle] = useState("");
  const [outlet, setOutlet] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [includePrimary, setIncludePrimary] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);

  const hasRequired = title.trim().length > 0 && outlet.trim().length > 0;
  const hasContent = mode === "url" ? url.trim().length > 0 : text.trim().length > 0;

  const canSubmit = useMemo(() => {
    if (busy) return false;
    return hasRequired && hasContent;
  }, [busy, hasRequired, hasContent]);

  async function submit() {
    setBusy(true); setError("");
    try {
      const payload = { title: title.trim(), outlet: outlet.trim() };
      if (mode === "url") payload.url = url.trim(); else payload.text = text.trim();
      const data = await analyzeArticle(payload, { full: includePrimary });
      onAnalyzed?.(data);
      if (mode === "text") setText("");
    } catch (e) {
      setError(e.message);
    } finally { setBusy(false); }
  }

  return (
    <section className="container grid">
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <h2>Analyze</h2>

        <div className="row" style={{ marginTop: 8 }}>
          <button className={`btn ${mode === "url" ? "" : "alt"}`} onClick={() => setMode("url")}>Via URL</button>
          <button className={`btn ${mode === "text" ? "" : "alt"}`} onClick={() => setMode("text")}>Paste Text</button>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <input
            className="input"
            placeholder="Title (required)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-required="true"
          />
          <input
            className="input"
            placeholder="Outlet (required)"
            value={outlet}
            onChange={(e) => setOutlet(e.target.value)}
            aria-required="true"
          />
        </div>

        {mode === "url" ? (
          <div style={{ marginTop: 12 }}>
            <input
              className="input code"
              placeholder="https://example.com/news/story"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <div className="small" style={{ marginTop: 6, opacity: 0.75 }}>Some sites block scrapers; try a few if one fails.</div>
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <textarea
              className="textarea"
              rows={8}
              placeholder="Paste article text…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        )}

        <label className="small" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, opacity: 0.9 }}>
          <input type="checkbox" checked={includePrimary} onChange={(e) => setIncludePrimary(e.target.checked)} />
          Include primary sources (slower)
        </label>

        <div className="row" style={{ marginTop: 12, alignItems: "center", gap: 10 }}>
          <button className="btn" onClick={submit} disabled={!canSubmit}>{busy ? "Analyzing…" : "Run analysis"}</button>
          {!hasRequired && <span className="small" style={{ color: "var(--bad)" }}>Title and Outlet are required.</span>}
          {busy && <span className="small k">Working… ~5–8s</span>}
          {error && <span className="small" style={{ color: "var(--bad)" }}>{String(error)}</span>}
        </div>
      </div>
    </section>
  );
}

/* ------- Scoring Guide Modal ------- */
function ScoringGuide({ onClose }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex",
               alignItems: "center", justifyContent: "center", padding: 16, zIndex: 70 }}
      onClick={onClose}
    >
      <div className="card" style={{ maxWidth: 820, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h2>Scoring Guide</h2>
          <button className="btn" onClick={onClose}>Close</button>
        </div>

        <div className="row" style={{ flexDirection: "column", gap: 10, marginTop: 10 }}>
          <Panel>
            <div className="small"><b className="code">emotional_tone</b> — How emotionally loaded the language is (e.g., alarmist, outrage, fear).</div>
          </Panel>
          <Panel>
            <div className="small"><b className="code">framing_choices</b> — Presence of spin or loaded framing (e.g., “critics say”, labeling, hedging).</div>
          </Panel>
          <Panel>
            <div className="small"><b className="code">factual_grounding</b> — Concrete facts, attributions, and verifiable details.</div>
          </Panel>
          <Panel>
            <div className="small"><b className="code">ideological_stance</b> — Clear ideological lean or one‑sided portrayal.</div>
          </Panel>
          <Panel>
            <div className="small"><b className="code">source_transparency</b> — Clarity of quotes/links/attribution; avoidance of vague “sources”.</div>
          </Panel>
        </div>

        <div style={{ marginTop: 14 }}>
          <h3 style={{ color: "var(--accent-2)", marginBottom: 6 }}>How the overall score is calculated</h3>
          <Panel>
            <div className="small" style={{ lineHeight: 1.6 }}>
              Each dimension is scored 0–100. Higher means “more of that thing.”
              We convert them into an overall **Bias Index** with these weights:
              <br />
              <span className="code">25%</span> framing_choices,&nbsp;
              <span className="code">25%</span> <i>inverse</i> of factual_grounding,&nbsp;
              <span className="code">20%</span> <i>inverse</i> of source_transparency,&nbsp;
              <span className="code">15%</span> emotional_tone,&nbsp;
              <span className="code">15%</span> ideological_stance.
              <br />
              “Inverse” means weak grounding/transparency increases bias.
            </div>
          </Panel>
          <div className="small k" style={{ marginTop: 8 }}>
            Bands: 0–29 low • 30–49 medium • 50–69 high • 70–100 extremely high.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------- Summary ------- */
function SummaryPanel({ text }) {
  if (!text) return null;
  return (
    <section className="container card" style={{ marginTop: 16 }}>
      <h2>Summary</h2>
      <p className="small" style={{ lineHeight: 1.6, marginTop: 8 }}>{text}</p>
    </section>
  );
}

/* ------- Bias Scores (+ Scoring Guide) ------- */
function BiasScores({ scores, overall }) {
  const [showGuide, setShowGuide] = useState(false);
  if (!scores || !overall) return null;

  const entries = Object.entries(scores || {});
  const idx = Number(overall.value ?? 0);
  const band = (overall.band || bandOf(idx)).replace("_", " ");

  return (
    <section className="container card" style={{ marginTop: 16 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h2>Bias Score</h2>
        <button className="btn alt" onClick={() => setShowGuide(true)}>Scoring Guide</button>
      </div>

      <div className="small" style={{ marginBottom: 8 }}>
        Overall: <b className="code">{idx}</b> • <span className="badge">{band}</span> •{" "}
        <span className="badge alt">{verdict(idx)}</span>
      </div>

      <div className="row" style={{ flexDirection: "column", gap: 8 }}>
        {entries.map(([k, v]) => {
          const val = Number(v ?? 0);
          return (
            <div key={k} className="row" style={{ alignItems: "center", gap: 12 }}>
              <span className="code" style={{ width: 180 }}>{k}</span>
              <div style={{ flex: 1, height: 10, background: "#1a1a1a", borderRadius: 999, position: "relative", border: "1px solid var(--edge)" }}>
                <div style={{ position: "absolute", inset: 0, width: `${val}%`, background: bandColor(val), borderRadius: 999 }} />
              </div>
              <span className="small code" style={{ width: 140 }}>{val} • {bandOf(val)}</span>
            </div>
          );
        })}
      </div>

      {showGuide && <ScoringGuide onClose={() => setShowGuide(false)} />}
    </section>
  );
}

/* ---------- Collapsible Claim item ---------- */
function ClaimItem({ claim, syncOpen, syncKey }) {
  const [open, setOpen] = useState(!!syncOpen);
  useEffect(() => { setOpen(!!syncOpen); }, [syncOpen, syncKey]);

  const conf = Math.round((claim?.confidence ?? 0) * 100);

  return (
    <Panel>
      <button className="panel-head" onClick={() => setOpen((x) => !x)} aria-expanded={open} aria-controls={`claim-body-${syncKey}`} type="button">
        <div className="small"><b className="code">Claim:</b> {claim.text}</div>
        <span className={`chev-icon ${open ? "rot" : ""}`} aria-hidden>▸</span>
      </button>
      {open && (
        <div id={`claim-body-${syncKey}`} style={{ marginTop: 8 }}>
          {claim.rationale && (<div className="small k" style={{ marginTop: 4 }}><b>Why:</b> {claim.rationale}</div>)}
          <div className="small k" style={{ marginTop: 4 }}>Confidence: {conf}%</div>
          {Array.isArray(claim.sources) && claim.sources.length > 0 && (
            <div className="small" style={{ marginTop: 6 }}>
              {claim.sources.slice(0, 2).map((s, j) => (
                <div key={j} style={{ marginTop: 4 }}>
                  <a className="small" href={s.url} target="_blank" rel="noreferrer">{s.title || s.url} ↗</a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

/* ---------- Claims panel ---------- */
function ClaimsPanel({ claims }) {
  const [allOpen, setAllOpen] = useState(false);
  const [syncKey, setSyncKey] = useState(0);
  if (!Array.isArray(claims) || claims.length === 0) return null;

  function toggleAll() { setAllOpen((v) => !v); setSyncKey((k) => k + 1); }

  return (
    <section className="container card" style={{ marginTop: 16 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h2>Claims & Primary Sources</h2>
        <button className="btn alt" onClick={toggleAll}>{allOpen ? "Collapse all" : "Expand all"}</button>
      </div>
      <div className="row" style={{ flexDirection: "column", gap: 12, marginTop: 8 }}>
        {claims.map((c, i) => (<ClaimItem key={i} claim={c} syncOpen={allOpen} syncKey={syncKey * 1000 + i} />))}
      </div>
    </section>
  );
}

/* ---------- Single highlight item ---------- */
function HighlightItem({ h, syncOpen, syncKey }) {
  const [open, setOpen] = useState(!!syncOpen);
  useEffect(() => { setOpen(!!syncOpen); }, [syncOpen, syncKey]);

  const txt = h?.data?.text || "";
  const start = Number(h?.data?.start || 0);
  const end = Number(h?.data?.end || 0);
  const showRange = start > 0 && end > start && end - start < 2000;

  return (
    <Panel>
      <button className="panel-head" onClick={() => setOpen((x) => !x)} aria-expanded={open} aria-controls={`hl-body-${syncKey}`} type="button">
        <div className="small"><span className="code">{h.dimension}</span>{showRange && <span className="small k" style={{ marginLeft: 8 }}>({start}–{end})</span>}</div>
        <span className={`chev-icon ${open ? "rot" : ""}`} aria-hidden>▸</span>
      </button>
      {open && (
        <div id={`hl-body-${syncKey}`} className="small" style={{ marginTop: 6 }}>
          <div>{txt}</div>
          {h.data?.reason && <div className="small k" style={{ marginTop: 6 }}>Why: {h.data.reason}</div>}
          {"confidence" in (h.data || {}) && (<div className="small k" style={{ marginTop: 4 }}>Confidence: {Math.round((h.data.confidence ?? 0) * 100)}%</div>)}
        </div>
      )}
    </Panel>
  );
}

/* ---------- Highlights panel ---------- */
function HighlightsPanel({ highlights }) {
  const clean = (highlights || []).filter(
    (h) => (h?.data?.text || "").trim().length > 1 && !/return only json/i.test(h?.data?.text || "")
  );
  const [allOpen, setAllOpen] = useState(false);
  const [syncKey, setSyncKey] = useState(0);
  const toggleAll = () => { setAllOpen(v => !v); setSyncKey(k => k + 1); };

  return (
    <section className="container card" style={{ marginTop: 16 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h2>Highlights</h2>
        {!!clean.length && (<button className="btn alt" onClick={toggleAll}>{allOpen ? "Collapse all" : "Expand all"}</button>)}
      </div>
      <div className="small" style={{ marginBottom: 8 }}>Highlight exact phrases that signal bias or framing choices.</div>
      {!clean.length ? (
        <Panel><div className="small k">No highlights recorded.</div></Panel>
      ) : (
        <div className="row" style={{ flexDirection: "column", gap: 10 }}>
          {clean.map((h, i) => (<HighlightItem key={h.id ?? i} h={h} syncOpen={allOpen} syncKey={syncKey * 1000 + i} />))}
        </div>
      )}
    </section>
  );
}

/* ---------- Narratives (main page) ---------- */
function NarrativesPanel({ articleId }) {
  const [order, setOrder] = useState("desc");
  const [rows, setRows] = useState([]);
  const [articleMap, setArticleMap] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      setLoaded(false);

      try {
        if (articleId) {
          await fetch(`${import.meta.env.VITE_API_BASE}/narratives/cluster`, { method: "POST" });
        }
      } catch { /* non-fatal */ }

      try {
        const [nv, arts] = await Promise.all([
          listNarratives(order),
          listArticles(100),
        ]);
        setRows(Array.isArray(nv) ? nv : []);
        const amap = {};
        (Array.isArray(arts) ? arts : []).forEach(a => { amap[a.id] = a; });
        setArticleMap(amap);
      } catch {
        setRows([]);
        setArticleMap({});
      } finally {
        setLoaded(true);
      }
    })();
  }, [order, articleId]);

  if (!articleId) {
    return (
      <section className="container card" style={{ marginTop: 16 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h2>Narratives</h2>
          <select className="input" value={order} onChange={(e) => setOrder(e.target.value)} style={{ width: 160 }}>
            <option value="desc">New → Old</option>
            <option value="asc">Old → New</option>
          </select>
        </div>
        <div className="small k" style={{ marginTop: 10 }}>No narratives yet.</div>
      </section>
    );
  }

  const filtered = (rows || []).filter(n =>
    Array.isArray(n?.data?.article_ids) && n.data.article_ids.includes(articleId)
  );

  return (
    <section className="container card" style={{ marginTop: 16 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h2>Narratives</h2>
        <select className="input" value={order} onChange={(e) => setOrder(e.target.value)} style={{ width: 160 }}>
          <option value="desc">New → Old</option>
          <option value="asc">Old → New</option>
        </select>
      </div>

      {!loaded ? (
        <div className="small k" style={{ marginTop: 10 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="small k" style={{ marginTop: 10 }}>No narratives for this article yet.</div>
      ) : (
        <div className="row" style={{ flexDirection: "column", gap: 10, marginTop: 8 }}>
          {filtered.map((n) => {
            const ids = Array.isArray(n?.data?.article_ids) ? n.data.article_ids : [];
            const linked = ids.map(id => articleMap[id]).filter(Boolean);
            return (
              <Panel key={n.id}>
                <div className="small" style={{ opacity: 0.8 }}>
                  {new Date(n.created_at || n.date || Date.now()).toLocaleString()}
                </div>
                <div style={{ marginTop: 6 }}>
                  <b>{n.label}</b>
                </div>
                {n.data?.summary && (
                  <div className="small k" style={{ marginTop: 6 }}>{n.data.summary}</div>
                )}
                {linked.length > 0 && (
                  <div className="row" style={{ flexDirection: "column", gap: 6, marginTop: 8 }}>
                    {linked.map(a => (
                      <div key={a.id} className="small">
                        {a.url ? (
                          <a href={a.url} target="_blank" rel="noreferrer">{a.title || a.url} ↗</a>
                        ) : (
                          <span>{a.title || `Article ${a.id}`}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ---------- Articles list + modal ---------- */
function ArticlesPanel({ refreshKey }) {
  const [rows, setRows] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [open, setOpen] = useState(null);

  async function load() {
    const data = await listArticles(50);
    setRows(data);
  }
  useEffect(() => { load(); }, [refreshKey]);

  async function handleDelete(id) {
    if (!confirm("Delete this article?")) return;
    setBusyId(id);
    try { await deleteArticle(id); await load(); } finally { setBusyId(null); }
  }

  return (
    <section className="container card" style={{ marginTop: 16 }}>
      <h2>Recent Articles</h2>
      <div className="small" style={{ marginBottom: 8 }}>{rows.length} item(s)</div>

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>ID</th><th>Title</th><th>Outlet</th><th>Scores</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="code">{r.id}</td>
                <td>{r.title}</td>
                <td className="small">{r.outlet || <span className="k">—</span>}</td>
                <td className="small code">
                  emo:{r.scores?.emotional_tone ?? 0} • frame:{r.scores?.framing_choices ?? 0} • fact:{r.scores?.factual_grounding ?? 0}
                </td>
                <td className="row" style={{ gap: 8 }}>
                  <button className="btn alt" onClick={() => setOpen(r)}>View</button>
                  <button className="btn danger" disabled={busyId === r.id} onClick={() => handleDelete(r.id)}>
                    {busyId === r.id ? "…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan="5" className="small">Nothing yet. Run an analysis above.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && <ArticleModal article={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

function ArticleModal({ article, onClose }) {
  const [fresh, setFresh] = useState(article);
  const [highlights, setHighlights] = useState([]);
  const [narrs, setNarrs] = useState([]);

  useEffect(() => {
    if (!article?.id) return;
    (async () => {
      try {
        const [detail, hl, nv] = await Promise.all([
          getArticle(article.id),
          listHighlights(article.id, 50),
          listNarratives("desc"),
        ]);
        setFresh(detail);
        setHighlights(hl);
        const mine = (Array.isArray(nv) ? nv : []).filter(n =>
          Array.isArray(n?.data?.article_ids) && n.data.article_ids.includes(article.id)
        );
        setNarrs(mine);
      } catch { /* ignore */ }
    })();
  }, [article?.id]);

  const a = fresh || article;
  const showHighlights = (highlights || []).filter(
    (h) => (h?.data?.text || "").trim().length > 1 && !/return only json/i.test(h?.data?.text || "")
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex",
               alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ maxWidth: 900, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-sticky">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h2>Article {a.id}</h2>
            <div className="row" style={{ gap: 8 }}>
              <a className="btn alt" href={exportCsvUrl(a.id)} target="_blank" rel="noreferrer">Export CSV</a>
              <button className="btn" onClick={onClose}>Close</button>
            </div>
          </div>
          <h3 style={{ marginTop: 6 }}>{a.title}</h3>
          {a.url && <a className="small" href={a.url} target="_blank" rel="noreferrer">Open original ↗</a>}
        </div>

        <div style={{ marginTop: 8 }}>
          <h3 style={{ color: "var(--accent-2)", marginBottom: 6 }}>Summary</h3>
          {a.summary ? <p className="small" style={{ lineHeight: 1.5 }}>{a.summary}</p> : <div className="small k">No summary available.</div>}
        </div>

        <div style={{ marginTop: 12 }}>
          <h3 style={{ color: "var(--accent-2)", marginBottom: 6 }}>Scores</h3>
          <div className="row" style={{ flexDirection: "column", gap: 10 }}>
            {Object.entries(a.scores || {}).map(([k, v]) => {
              const val = Number(v ?? 0);
              return (
                <div key={k} className="row" style={{ alignItems: "center", gap: 12 }}>
                  <span className="code" style={{ width: 180 }}>{k}</span>
                  <div style={{ flex: 1, height: 10, background: "#1a1a1a", borderRadius: 999, position: "relative", border: "1px solid var(--edge)" }}>
                    <div style={{ position: "absolute", inset: 0, width: `${val}%`, background: bandColor(val), borderRadius: 999 }} />
                  </div>
                  <span className="small code" style={{ width: 140 }}>{val}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Narratives in modal */}
        <div style={{ marginTop: 16 }}>
          <h3 style={{ color: "var(--accent-2)", marginBottom: 6 }}>Narratives</h3>
          {!narrs.length ? (
            <Panel><div className="small k">No narratives for this article.</div></Panel>
          ) : (
            <div className="row" style={{ flexDirection: "column", gap: 10 }}>
              {narrs.map(n => {
                const ids = Array.isArray(n?.data?.article_ids) ? n.data.article_ids : [];
                return (
                  <Panel key={n.id}>
                    <div className="small" style={{ opacity: .8 }}>
                      {new Date(n.created_at || Date.now()).toLocaleString()}
                    </div>
                    <div style={{ marginTop: 6 }}><b>{n.label}</b></div>
                    {n.data?.summary && (
                      <div className="small k" style={{ marginTop: 6 }}>{n.data.summary}</div>
                    )}
                    {ids.includes(article.id) && a.url && (
                      <div className="small" style={{ marginTop: 6 }}>
                        <a href={a.url} target="_blank" rel="noreferrer">Open this story ↗</a>
                      </div>
                    )}
                  </Panel>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <h3 style={{ color: "var(--accent-2)", marginBottom: 6 }}>Highlights</h3>
          <div className="small" style={{ marginBottom: 6 }}>
            Highlight exact phrases that signal bias or framing choices.
          </div>
          {(!showHighlights || showHighlights.length === 0) ? (
            <Panel><div className="small k">No highlights recorded.</div></Panel>
          ) : (
            <div className="row" style={{ flexDirection: "column", gap: 10 }}>
              {showHighlights.map((h, i) => {
                const start = Number(h.data?.start || 0);
                const end = Number(h.data?.end || 0);
                const showRange = start > 0 && end > start && end - start < 2000;
                return (
                  <Panel key={h.id ?? i}>
                    <div className="row" style={{ width: "100%", justifyContent: "space-between" }}>
                      <span className="small code">{h.dimension}</span>
                      {showRange && <span className="small k">({start}–{end})</span>}
                    </div>
                    <div className="small" style={{ marginTop: 6 }}>{h.data?.text}</div>
                    {h.data?.reason && <div className="small k" style={{ marginTop: 6 }}>Why: {h.data.reason}</div>}
                    {"confidence" in (h.data || {}) && (
                      <div className="small k" style={{ marginTop: 4 }}>
                        Confidence: {Math.round((h.data.confidence ?? 0) * 100)}%
                      </div>
                    )}
                  </Panel>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------- page ------- */
export default function App() {
  const [lastAnalyzed, setLastAnalyzed] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [pageHighlights, setPageHighlights] = useState([]);

  useEffect(() => {
    (async () => {
      if (!lastAnalyzed?.id) { setPageHighlights([]); return; }
      try {
        const hl = await listHighlights(lastAnalyzed.id, 50);
        setPageHighlights(hl);
      } catch { setPageHighlights([]); }
    })();
  }, [lastAnalyzed?.id]);

  return (
    <>
      <Header />
      <Hero />
      <AnalyzePanel onAnalyzed={setLastAnalyzed} onBusyChange={(b) => setIsBusy(b)} />
      <SummaryPanel text={!isBusy ? lastAnalyzed?.summary : null} />
      <BiasScores scores={!isBusy ? lastAnalyzed?.scores : null} overall={!isBusy ? lastAnalyzed?.overall : null} />
      <ClaimsPanel claims={!isBusy ? lastAnalyzed?.claims : null} />
      <NarrativesPanel articleId={lastAnalyzed?.id} />
      <HighlightsPanel highlights={!isBusy ? pageHighlights : []} />
      <ArticlesPanel refreshKey={lastAnalyzed?.id} />
      <footer className="container small" style={{ opacity: 0.6, paddingBottom: 40, marginTop: 16 }}>
        © {new Date().getFullYear()} Bias Lab • built for demo
      </footer>
    </>
  );
}