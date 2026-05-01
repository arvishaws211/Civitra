import { lookupElectionFaq } from "./faq-search.js";
import { lookupSemanticFaq } from "./embedding-faq.js";
import { translateText } from "./translation.js";
import { getElectionTimeline } from "./election-timeline.js";
import { buildCalendarDeepLink } from "./calendar-links.js";
import { analyzeQueryEntities } from "./natural-language.js";

/**
 * @param {string} name
 * @param {Record<string, unknown>} args
 */
export async function executeToolCall(name, args) {
  switch (name) {
    case "lookup_semantic_faq": {
      const query = String(args.query ?? "");
      return lookupSemanticFaq(query, 4);
    }
    case "lookup_election_faq": {
      const query = String(args.query ?? "");
      return lookupElectionFaq(query, 4);
    }
    case "translate_text": {
      const text = String(args.text ?? "");
      const target = String(args.target_language ?? "hi");
      return translateText(text, target);
    }
    case "get_election_timeline": {
      const q = String(args.topic_filter ?? "");
      return getElectionTimeline(q);
    }
    case "create_calendar_reminder_link": {
      const title = String(args.title ?? "Election task");
      const start = String(args.start_datetime_iso ?? new Date().toISOString());
      const details = String(args.details ?? "");
      return buildCalendarDeepLink({ title, details, start });
    }
    case "analyze_voter_query": {
      const text = String(args.text ?? "");
      return analyzeQueryEntities(text);
    }
    case "check_voter_eligibility": {
      const age = Number(args.age);
      const citizen = Boolean(args.is_citizen_of_india);
      if (!Number.isFinite(age)) {
        return {
          eligible: false,
          reason: "Age not provided or invalid.",
          verify_with_eci: "https://voters.eci.gov.in/",
        };
      }
      if (!citizen) {
        return {
          eligible: false,
          reason: "Must be a citizen of India to vote in Indian elections.",
        };
      }
      if (age < 18) {
        return { eligible: false, reason: "Must be at least 18 years on the qualifying date." };
      }
      return {
        eligible: true,
        reason:
          "Based on simplified rules only; confirm qualifying date and residency with ERO/ECI.",
        verify_with_eci: "https://voters.eci.gov.in/",
      };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export const civitraToolDeclarations = [
  {
    name: "lookup_semantic_faq",
    description:
      "Semantic vector search over the curated 55+ FAQ corpus using Vertex-style embeddings with cosine similarity. Falls back to keyword search when embeddings are unavailable.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "User question in natural language" },
      },
      required: ["query"],
    },
  },
  {
    name: "lookup_election_faq",
    description:
      "Keyword-based FAQ search (fallback). Use lookup_semantic_faq first for better results.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "User question or keywords" },
      },
      required: ["query"],
    },
  },
  {
    name: "translate_text",
    description:
      "Translate voter-facing text to a target Indian language using Cloud Translation when configured.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        target_language: { type: "string", description: "ISO-639-1 code, e.g. hi, ta, kn" },
      },
      required: ["text", "target_language"],
    },
  },
  {
    name: "get_election_timeline",
    description:
      "Return high-level election process milestones (always verify exact dates on ECI).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        topic_filter: { type: "string", description: "Optional filter e.g. polling, counting" },
      },
    },
  },
  {
    name: "create_calendar_reminder_link",
    description: "Build a Google Calendar template URL (no OAuth) for reminders.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        start_datetime_iso: { type: "string", description: "ISO 8601 datetime" },
        details: { type: "string" },
      },
      required: ["title", "start_datetime_iso"],
    },
  },
  {
    name: "analyze_voter_query",
    description:
      "Extract entities from the user query using Cloud Natural Language API when configured.",
    parametersJsonSchema: {
      type: "object",
      properties: { text: { type: "string" } },
      required: ["text"],
    },
  },
  {
    name: "check_voter_eligibility",
    description:
      "Simplified eligibility check (age and citizenship only); always direct user to ECI for official determination.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        age: { type: "number" },
        is_citizen_of_india: { type: "boolean" },
      },
      required: ["age", "is_citizen_of_india"],
    },
  },
];
