 "use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Activity, Clock3, Smartphone, Monitor, Tablet, RefreshCw, LogOut, LockKeyhole, Heart } from "lucide-react";

type Visit = { session_id: string; device_category: string; first_seen_at: string; last_seen_at: string; duration_seconds: number; landing_path: string; ended_at: string | null };
type Event = { session_id: string; event_name: string; page_path: string; created_at: string };
type Stats = { totalVisits: number; averageSeconds: number; devices: Record<string, number>; visits: Visit[]; events: Event[] };

function duration(n: number) { return `${Math.floor(n / 60)}m ${n % 60}s`; }
function dateTime(value: string) { return new Date(value).toLocaleString(); }
function shortId(value: string) { return value.slice(0, 8) + "…"; }

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadStats(accessToken = token) {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to load stats");
      setStats(json);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    const client = getSupabaseBrowser();
    client.auth.getSession().then(({ data }) => {
      const current = data.session?.access_token;
      if (current) { setToken(current); void loadStats(current); }
    }).catch(() => undefined);
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) { setToken(session.access_token); void loadStats(session.access_token); }
      else { setToken(""); setStats(null); }
    });
    return () => listener.subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token) return;
    const timer = window.setInterval(() => { void loadStats(token); }, 20000);
    return () => window.clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const { data, error } = await getSupabaseBrowser().auth.signInWithPassword({ email, password });
      if (error || !data.session) throw new Error(error?.message || "Sign-in failed");
      setToken(data.session.access_token);
      await loadStats(data.session.access_token);
    } catch (e) { setError(e instanceof Error ? e.message : "Sign-in failed"); }
    finally { setBusy(false); }
  }

  async function signOut() {
    await getSupabaseBrowser().auth.signOut();
    setToken(""); setStats(null);
  }

  if (!token || !stats) return (
    <main className="admin-shell">
      <form className="login-card" onSubmit={signIn}>
        <div className="admin-mark"><Heart size={23} /></div>
        <span className="eyebrow">PRIVATE SPACE</span>
        <h1>Visit dashboard</h1>
        <p>Sign in with the admin account you created in Supabase.</p>
        <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" /></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label>
        {error && <p className="error">{error}</p>}
        <button className="primary-button admin-submit" disabled={busy}>{busy ? "Please wait…" : <><LockKeyhole size={16} /> Sign in securely</>}</button>
        <a className="back-link" href="/">← Back to the apology page</a>
      </form>
    </main>
  );

  return (
    <main className="admin-shell">
      <div className="dashboard">
        <header className="dashboard-head">
          <div><span className="eyebrow">PRIVATE · LAST 30 DAYS · MAX 100 VISITS</span><h1>Visit overview</h1><p>Anonymous, approximate analytics. No phone identity or precise location is collected.</p></div>
          <div className="head-actions"><button className="outline-button" onClick={() => void loadStats()} disabled={busy}><RefreshCw size={15} /> Refresh</button><button className="outline-button" onClick={signOut}><LogOut size={15} /> Sign out</button></div>
        </header>
        {error && <p className="error">{error}</p>}
        <div className="stats-grid">
          <article className="stat-card"><Activity /><span>Total sessions</span><strong>{stats.totalVisits}</strong></article>
          <article className="stat-card"><Clock3 /><span>Average recorded duration</span><strong>{duration(stats.averageSeconds)}</strong></article>
          <article className="stat-card"><Smartphone /><span>Mobile</span><strong>{stats.devices.mobile || 0}</strong></article>
          <article className="stat-card"><Monitor /><span>Desktop / tablet</span><strong>{(stats.devices.desktop || 0) + (stats.devices.tablet || 0)}</strong></article>
        </div>
        <section className="admin-panel">
          <h2>Recent visits</h2>
          {stats.visits.length === 0 ? <p className="empty-state">No visits recorded yet. Open the public page in another tab to test it.</p> : <div className="table-wrap"><table><thead><tr><th>Session</th><th>Device</th><th>Opened</th><th>Duration*</th><th>Status</th></tr></thead><tbody>
            {stats.visits.map(v => <tr key={v.session_id}><td><code>{shortId(v.session_id)}</code></td><td>{v.device_category === "mobile" ? <Smartphone size={14} /> : v.device_category === "tablet" ? <Tablet size={14} /> : <Monitor size={14} />} {v.device_category}</td><td>{dateTime(v.first_seen_at)}</td><td>{duration(v.duration_seconds || 0)}</td><td><span className={`status ${v.ended_at ? "" : "active"}`}>{v.ended_at ? "Ended" : "May be active"}</span></td></tr>)}
          </tbody></table></div>}
          <p className="footnote">*Duration is approximate and updates on heartbeats. A tab may close without a final event; “active” is not proof someone is currently viewing.</p>
        </section>
        <section className="admin-panel">
          <h2>Recent page events</h2>
          {stats.events.length === 0 ? <p className="empty-state">No events yet.</p> : <div className="event-list">{stats.events.slice(0, 40).map((e, i) => <div className="event-row" key={`${e.session_id}-${e.event_name}-${e.created_at}-${i}`}><span className="event-dot" /><div><strong>{e.event_name.replaceAll("_", " ")}</strong><p>Session {shortId(e.session_id)} · {e.page_path}</p></div><time>{dateTime(e.created_at)}</time></div>)}</div>}
        </section>
        <p className="admin-bottom"><Heart size={13} /> Keep it kind. These numbers are approximate and are not proof of who visited.</p>
      </div>
    </main>
  );
}
