import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return NextResponse.json({ error: "Server not configured" }, { status: 503 });

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const authClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user?.email) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const admins = (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!admins.includes(user.email.toLowerCase())) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: visits, error: visitsError }, { data: events, error: eventsError }] = await Promise.all([
    db.from("visits").select("session_id,device_category,first_seen_at,last_seen_at,duration_seconds,landing_path,ended_at").gte("first_seen_at", since).order("first_seen_at", { ascending: false }).limit(100),
    db.from("page_events").select("session_id,event_name,page_path,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(200)
  ]);
  if (visitsError || eventsError) return NextResponse.json({ error: "Could not load analytics" }, { status: 500 });

  const rows = visits || [];
  const totalSeconds = rows.reduce((sum, v) => sum + (v.duration_seconds || 0), 0);
  const counts = rows.reduce((acc, v) => {
    acc[v.device_category] = (acc[v.device_category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return NextResponse.json({
    totalVisits: rows.length,
    averageSeconds: rows.length ? Math.round(totalSeconds / rows.length) : 0,
    devices: counts,
    visits: rows,
    events: events || []
  }, { headers: { "Cache-Control": "no-store" } });
}
