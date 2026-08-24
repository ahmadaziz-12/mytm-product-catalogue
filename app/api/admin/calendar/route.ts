import { database, ensureStore } from "../../_store";
import { fetchGoogleCalendar } from "../../_calendar";
import { getChatGPTUser, isMYTMAdmin } from "../../../chatgpt-auth";

async function requireAdmin() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!isMYTMAdmin(user)) return Response.json({ error: "Admin access required" }, { status: 403 });
  return null;
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  await ensureStore();
  const row = await database().prepare("SELECT value FROM settings WHERE key = 'google_calendar_ical_url'").first() as { value: string } | null;
  if (!row?.value) return Response.json({ connected: false, meetings: [], timeZone: "UTC", updatedAt: new Date().toISOString() });
  try {
    const calendar = await fetchGoogleCalendar(row.value);
    return Response.json({ connected: true, ...calendar }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ connected: true, meetings: [], timeZone: "UTC", updatedAt: new Date().toISOString(), error: error instanceof Error ? error.message : "Calendar sync failed" }, { status: 502 });
  }
}
