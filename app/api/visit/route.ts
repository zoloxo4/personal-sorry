import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const allowedActions = new Set(["start", "event", "heartbeat", "end"]);
const allowedDevices = new Set(["mobile", "tablet", "desktop"]);
const allowedEvents = new Set([
  "page_open", "still_here", "page_exit", "page_visible", "page_hidden",
  "music_started", "music_paused", "hero_read_more", "forgive_button_clicked", "small_note_toggled"
]);

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: "Analytics not configured" }, { status: 503 });

    const body = await req.json();
    const { action, sessionId, device, path, eventName } = body ?? {};
    if (!allowedActions.has(action) || typeof sessionId !== "string" ||
        !/^[0-9a-f-]{36}$/i.test(sessionId) || !allowedDevices.has(device) ||
        typeof path !== "string" || path.length > 120) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }
    if (action === "event" && !allowedEvents.has(eventName)) {
      return NextResponse.json({ error: "Invalid event name" }, { status: 400 });
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const now = new Date().toISOString();
    if (action === "start") {
      const { error } = await supabase.from("visits").upsert({
        session_id: sessionId, device_category: device, first_seen_at: now, last_seen_at: now,
        duration_seconds: 0, landing_path: path, ended_at: null
      }, { onConflict: "session_id", ignoreDuplicates: true });
      if (error) throw error;
      await supabase.from("page_events").insert({ session_id: sessionId, event_name: "page_open", page_path: path });
    } else {
      const { data: visit, error: readError } = await supabase.from("visits")
        .select("first_seen_at").eq("session_id", sessionId).maybeSingle();
      if (readError) throw readError;
      if (!visit) {
        await supabase.from("visits").insert({
          session_id: sessionId, device_category: device, first_seen_at: now, last_seen_at: now,
          duration_seconds: 0, landing_path: path
        });
      } else {
        const first = new Date(visit.first_seen_at).getTime();
        const duration = Math.max(0, Math.min(86400, Math.floor((Date.now() - first) / 1000)));
        const { error } = await supabase.from("visits").update({
          last_seen_at: now, duration_seconds: duration, ...(action === "end" ? { ended_at: now } : {})
        }).eq("session_id", sessionId);
        if (error) throw error;
      }
      if (action === "event" && eventName) {
        await supabase.from("page_events").insert({
          session_id: sessionId, event_name: eventName, page_path: path
        });
      }
    }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Analytics route error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Unable to record analytics" }, { status: 500 });
  }
}
