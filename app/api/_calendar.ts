export type CalendarMeeting = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  attendeeName: string;
  attendeeEmail: string;
  location: string;
  meetLink: string;
  description: string;
  status: "upcoming" | "live" | "completed" | "cancelled";
};

export type CalendarFeed = {
  meetings: CalendarMeeting[];
  timeZone: string;
  updatedAt: string;
};

type IcsProperty = { value: string; params: Record<string, string> };

export function validateGoogleCalendarUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "calendar.google.com" && url.pathname.endsWith("/basic.ics");
  } catch {
    return false;
  }
}

function decodeIcsText(value = "") {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function readProperty(line: string): { name: string; property: IcsProperty } | null {
  const colon = line.indexOf(":");
  if (colon < 0) return null;
  const descriptor = line.slice(0, colon);
  const [rawName, ...rawParams] = descriptor.split(";");
  const params: Record<string, string> = {};
  for (const rawParam of rawParams) {
    const equals = rawParam.indexOf("=");
    if (equals > 0) params[rawParam.slice(0, equals).toUpperCase()] = rawParam.slice(equals + 1).replace(/^"|"$/g, "");
  }
  return { name: rawName.toUpperCase(), property: { value: line.slice(colon + 1), params } };
}

function zonedDateToUtc(parts: number[], timeZone: string) {
  const [year, month, day, hour, minute, second] = parts;
  let timestamp = Date.UTC(year, month - 1, day, hour, minute, second);
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const formatted = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).formatToParts(new Date(timestamp));
      const value = (type: string) => Number(formatted.find((part) => part.type === type)?.value || 0);
      const represented = Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second"));
      timestamp -= represented - Date.UTC(year, month - 1, day, hour, minute, second);
    }
  } catch {
    // Unknown calendar time zones fall back to UTC rather than breaking the feed.
  }
  return new Date(timestamp);
}

function parseIcsDate(property: IcsProperty | undefined, fallbackTimeZone: string) {
  if (!property?.value) return null;
  const value = property.value.trim();
  const allDay = property.params.VALUE === "DATE" || /^\d{8}$/.test(value);
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?(Z)?$/);
  if (!match) return null;
  const parts = [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4] || 0), Number(match[5] || 0), Number(match[6] || 0)];
  const date = match[7]
    ? new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]))
    : zonedDateToUtc(parts, property.params.TZID || fallbackTimeZone || "UTC");
  return { date, allDay };
}

function findMeetLink(...values: string[]) {
  const match = values.join("\n").match(/https:\/\/(?:meet\.google\.com|zoom\.us|teams\.microsoft\.com)\/[^\s\\,;]+/i);
  return match?.[0] || "";
}

function collectEvents(source: string) {
  const unfolded = source.replace(/\r?\n[ \t]/g, "");
  const timeZone = decodeIcsText(unfolded.match(/^X-WR-TIMEZONE:(.+)$/im)?.[1] || "UTC");
  const blocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
  return { timeZone, blocks };
}

export function parseGoogleCalendar(source: string): CalendarFeed {
  const now = Date.now();
  const lowerBound = now - 24 * 60 * 60 * 1000;
  const upperBound = now + 120 * 24 * 60 * 60 * 1000;
  const { timeZone, blocks } = collectEvents(source);
  const meetings: CalendarMeeting[] = [];

  for (const block of blocks) {
    const properties = new Map<string, IcsProperty[]>();
    for (const line of block.split(/\r?\n/)) {
      const parsed = readProperty(line);
      if (!parsed) continue;
      properties.set(parsed.name, [...(properties.get(parsed.name) || []), parsed.property]);
    }
    const first = (name: string) => properties.get(name)?.[0];
    const startValue = parseIcsDate(first("DTSTART"), timeZone);
    if (!startValue) continue;
    const endValue = parseIcsDate(first("DTEND"), timeZone);
    const start = startValue.date;
    const end = endValue?.date || new Date(start.getTime() + (startValue.allDay ? 24 : 1) * 60 * 60 * 1000);
    if (end.getTime() < lowerBound || start.getTime() > upperBound) continue;

    const organizerEmail = decodeIcsText(first("ORGANIZER")?.value || "").replace(/^mailto:/i, "").toLowerCase();
    const attendees = (properties.get("ATTENDEE") || []).map((attendee) => ({
      name: decodeIcsText(attendee.params.CN || ""),
      email: decodeIcsText(attendee.value).replace(/^mailto:/i, ""),
    })).filter((attendee) => attendee.email.toLowerCase() !== organizerEmail);
    const attendee = attendees[0];
    const title = decodeIcsText(first("SUMMARY")?.value || "Client meeting");
    const description = decodeIcsText(first("DESCRIPTION")?.value || "");
    const location = decodeIcsText(first("LOCATION")?.value || "");
    const rawStatus = decodeIcsText(first("STATUS")?.value || "").toUpperCase();
    const status: CalendarMeeting["status"] = rawStatus === "CANCELLED"
      ? "cancelled"
      : now >= start.getTime() && now <= end.getTime()
        ? "live"
        : now > end.getTime()
          ? "completed"
          : "upcoming";

    meetings.push({
      id: decodeIcsText(first("UID")?.value || `${start.toISOString()}-${title}`),
      title,
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: startValue.allDay,
      attendeeName: attendee?.name || (attendee?.email ? attendee.email.split("@")[0] : "Calendar guest"),
      attendeeEmail: attendee?.email || "",
      location,
      meetLink: findMeetLink(first("URL")?.value || "", location, description),
      description: description.slice(0, 500),
      status,
    });
  }

  meetings.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return { meetings: meetings.slice(0, 100), timeZone, updatedAt: new Date().toISOString() };
}

export async function fetchGoogleCalendar(url: string) {
  if (!validateGoogleCalendarUrl(url)) throw new Error("Use the Secret address in iCal format from Google Calendar.");
  const response = await fetch(url, {
    headers: { accept: "text/calendar", "cache-control": "no-cache" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Google Calendar could not be reached. Check that the private iCal address is still active.");
  const source = await response.text();
  if (source.length > 5_000_000 || !source.includes("BEGIN:VCALENDAR")) throw new Error("The supplied address is not a valid Google Calendar feed.");
  return parseGoogleCalendar(source);
}
