/**
 * Google Calendar deep-link (no OAuth). Opens create-event UI with prefilled fields.
 * @param {{ title: string; details?: string; start: string; end?: string }} p
 * @returns {{ url: string }}
 */
export function buildCalendarDeepLink(p) {
  const title = encodeURIComponent(p.title || "Election reminder");
  const details = encodeURIComponent(
    p.details || "Reminder from Civitra — verify dates on https://eci.gov.in/"
  );
  const start = formatGcalUtc(p.start);
  const end = formatGcalUtc(p.end || addOneHourIso(p.start));
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${start}/${end}`;
  return { url };
}

function formatGcalUtc(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const fallback = new Date();
    fallback.setUTCHours(0, 0, 0, 0);
    return fallback.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function addOneHourIso(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date(Date.now() + 3600000).toISOString();
  d.setUTCHours(d.getUTCHours() + 1);
  return d.toISOString();
}
