import "server-only";

import {
  NO_SOURCE,
  filterBounds,
  type DashboardFilters,
} from "@/lib/filters";
import { computeStats, listFeedback, type DashboardStats, type FeedbackEntry } from "@/lib/stats";
import type { AnswerRecord, FeedbackRecord, SessionRecord } from "@/lib/types";

import { getSupabase } from "./supabase";

/**
 * Lecture des données pour l'espace organisateur.
 *
 * Les parties sont lues avec leurs réponses et leur avis en une seule
 * requête (par pages de 1 000, limite par défaut de l'API Supabase), puis
 * les statistiques sont calculées en mémoire. C'est largement suffisant pour
 * quelques milliers de participations.
 */

const PAGE_SIZE = 1000;
/** Garde-fou : au-delà, on s'arrête plutôt que de saturer la mémoire. */
const MAX_ROWS = 50_000;

const SESSION_COLUMNS =
  "id, created_at, completed_at, first_name, district, source, score, replay, user_agent_type, " +
  "answers(question_id, selected_option, is_correct, answered_at), " +
  "feedback(rating, comment, created_at)";

type RawSession = Omit<SessionRecord, "answers" | "feedback"> & {
  answers: AnswerRecord[] | null;
  // Relation 1–1 (contrainte unique sur session_id) : objet, ou tableau selon
  // la façon dont l'API détecte la relation. On accepte les deux.
  feedback: FeedbackRecord | FeedbackRecord[] | null;
};

function normalize(row: RawSession): SessionRecord {
  const feedback = Array.isArray(row.feedback)
    ? (row.feedback[0] ?? null)
    : (row.feedback ?? null);
  return {
    ...row,
    answers: [...(row.answers ?? [])].sort(
      (a, b) => a.question_id - b.question_id,
    ),
    feedback,
  };
}

export async function fetchSessions(
  filters: DashboardFilters,
): Promise<SessionRecord[]> {
  const supabase = getSupabase();
  const { fromIso, toIso } = filterBounds(filters);
  const sessions: SessionRecord[] = [];

  for (let offset = 0; offset < MAX_ROWS; offset += PAGE_SIZE) {
    let query = supabase.from("sessions").select(SESSION_COLUMNS);

    if (!filters.includeReplays) query = query.eq("replay", false);
    if (fromIso) query = query.gte("created_at", fromIso);
    if (toIso) query = query.lt("created_at", toIso);
    if (filters.source === NO_SOURCE) query = query.is("source", null);
    else if (filters.source) query = query.eq("source", filters.source);

    const { data, error } = await query
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(`Lecture des parties : ${error.message}`);

    const rows = (data ?? []) as unknown as RawSession[];
    for (const row of rows) sessions.push(normalize(row));
    if (rows.length < PAGE_SIZE) break;
  }

  return sessions;
}

/** Toutes les sources rencontrées (pour la liste déroulante du filtre). */
export async function fetchSources(): Promise<{
  sources: string[];
  hasSessionsWithoutSource: boolean;
}> {
  const supabase = getSupabase();
  const sources = new Set<string>();
  let hasSessionsWithoutSource = false;

  for (let offset = 0; offset < MAX_ROWS; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("sessions")
      .select("source")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(`Lecture des sources : ${error.message}`);

    const rows = (data ?? []) as { source: string | null }[];
    for (const row of rows) {
      if (row.source) sources.add(row.source);
      else hasSessionsWithoutSource = true;
    }
    if (rows.length < PAGE_SIZE) break;
  }

  return {
    sources: Array.from(sources).sort((a, b) => a.localeCompare(b, "fr")),
    hasSessionsWithoutSource,
  };
}

export type DashboardData = {
  stats: DashboardStats;
  feedback: FeedbackEntry[];
  sources: string[];
  hasSessionsWithoutSource: boolean;
  generatedAt: string;
};

export async function loadDashboard(
  filters: DashboardFilters,
): Promise<DashboardData> {
  const [sessions, sourceInfo] = await Promise.all([
    fetchSessions(filters),
    fetchSources(),
  ]);

  return {
    stats: computeStats(sessions),
    feedback: listFeedback(sessions),
    sources: sourceInfo.sources,
    hasSessionsWithoutSource: sourceInfo.hasSessionsWithoutSource,
    generatedAt: new Date().toISOString(),
  };
}
