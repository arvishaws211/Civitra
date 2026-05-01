/**
 * @typedef {{ id: string; title: string; description: string; approxMonth?: string }} TimelineEvent
 */

/** @type {TimelineEvent[]} */
export const ELECTION_TIMELINE_EVENTS = [
  {
    id: "schedule",
    title: "ECI announces election schedule",
    description: "Notification with polling dates, phases, and key deadlines.",
    approxMonth: "Pre-poll",
  },
  {
    id: "roll_revision",
    title: "Electoral roll revision",
    description: "Special summary revision windows; check inclusion via voters portal.",
    approxMonth: "Year-round",
  },
  {
    id: "nomination",
    title: "Nomination filing",
    description: "Candidates file papers; scrutiny and withdrawal follow ECI calendar.",
    approxMonth: "Campaign period",
  },
  {
    id: "mcc",
    title: "Model Code of Conduct",
    description: "ECI guidelines apply from schedule announcement through counting.",
    approxMonth: "Campaign period",
  },
  {
    id: "polling",
    title: "Polling day",
    description: "Vote with valid ID; follow booth officer instructions; verify VVPAT slip.",
    approxMonth: "Poll day",
  },
  {
    id: "counting",
    title: "Counting and results",
    description: "Votes counted under ECI supervision; results on official channels.",
    approxMonth: "Post-poll",
  },
];

/**
 * @param {string} [query]
 */
export function getElectionTimeline(query = "") {
  const q = query.toLowerCase();
  if (!q.trim()) {
    return {
      events: ELECTION_TIMELINE_EVENTS,
      note: "Always confirm exact dates on https://eci.gov.in/ and CEO portals.",
    };
  }
  const filtered = ELECTION_TIMELINE_EVENTS.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      (e.approxMonth && e.approxMonth.toLowerCase().includes(q))
  );
  return {
    events: filtered.length ? filtered : ELECTION_TIMELINE_EVENTS,
    note: "Dates vary by election; verify with ECI notifications.",
  };
}
