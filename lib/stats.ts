import { getCorrectOption, questions, type QuizQuestion } from "@/data/questions";

import {
  addDays,
  dayKey,
  formatDayShort,
  formatWeekday,
  hourKey,
} from "./dates";
import type { SessionRecord } from "./types";

/**
 * Calcul des statistiques du tableau de bord.
 * Fonctions pures : on leur donne les parties (déjà filtrées), elles
 * renvoient des chiffres prêts à afficher.
 */

export type OptionStats = {
  id: string;
  label: string;
  isCorrect: boolean;
  count: number;
  /** Part des réponses à cette question, de 0 à 100. */
  share: number;
};

export type QuestionStats = {
  id: number;
  /** Position dans le jeu, à partir de 1. */
  number: number;
  text: string;
  correctLabel: string;
  answered: number;
  correct: number;
  /** Taux de bonnes réponses, de 0 à 100 (`null` si personne n'a répondu). */
  correctRate: number | null;
  options: OptionStats[];
};

export type CountRow = { label: string; count: number; share: number };

export type TimePoint = {
  key: string;
  /** Libellé court pour l'axe. */
  label: string;
  /** Libellé complet pour l'infobulle et le tableau. */
  fullLabel: string;
  count: number;
};

export type FunnelStep = {
  label: string;
  count: number;
  /** Part des parties démarrées, de 0 à 100. */
  share: number;
};

export type Totals = {
  started: number;
  completed: number;
  completionRate: number | null;
  averageScore: number | null;
  averageRating: number | null;
  ratingCount: number;
  commentCount: number;
  totalQuestions: number;
};

export type DashboardStats = {
  totals: Totals;
  questions: QuestionStats[];
  scoreDistribution: { score: number; count: number; share: number }[];
  timeline: {
    hourly: TimePoint[];
    /**
     * "timeline" : heures qui se suivent (un événement, quelques jours au plus) ;
     * "profile"  : heures de la journée, tous jours confondus (période longue).
     */
    hourlyKind: "timeline" | "profile";
    daily: TimePoint[];
    defaultMode: "hour" | "day";
  };
  districts: CountRow[];
  sources: CountRow[];
  funnel: FunnelStep[];
};

export type FeedbackEntry = {
  sessionId: string;
  rating: number | null;
  comment: string;
  createdAt: string;
  firstName: string | null;
  district: string | null;
  source: string | null;
  score: number | null;
};

const percent = (part: number, whole: number): number =>
  whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;

const average = (values: number[]): number | null =>
  values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;

/* ───────────────────────────── Questions ──────────────────────────────── */

function questionStats(
  question: QuizQuestion,
  index: number,
  sessions: SessionRecord[],
): QuestionStats {
  const counts = new Map<string, number>(question.options.map((o) => [o.id, 0]));
  const correctId = getCorrectOption(question).id;

  for (const session of sessions) {
    for (const answer of session.answers) {
      if (answer.question_id !== question.id) continue;
      // Réponse à une option qui n'existe plus dans data/questions.ts : ignorée.
      if (!counts.has(answer.selected_option)) continue;
      counts.set(answer.selected_option, (counts.get(answer.selected_option) ?? 0) + 1);
    }
  }

  const answered = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  const correct = counts.get(correctId) ?? 0;

  return {
    id: question.id,
    number: index + 1,
    text: question.text,
    correctLabel: getCorrectOption(question).label,
    answered,
    correct,
    correctRate: answered > 0 ? percent(correct, answered) : null,
    options: question.options
      .map((option) => ({
        id: option.id,
        label: option.label,
        isCorrect: option.id === correctId,
        count: counts.get(option.id) ?? 0,
        share: percent(counts.get(option.id) ?? 0, answered),
      }))
      // La bonne réponse d'abord, puis les autres de la plus à la moins choisie.
      .sort(
        (a, b) =>
          Number(b.isCorrect) - Number(a.isCorrect) || b.count - a.count,
      ),
  };
}

/* ───────────────────────────── Répartitions ───────────────────────────── */

function countBy(
  sessions: SessionRecord[],
  pick: (session: SessionRecord) => string | null,
  missingLabel: string,
): CountRow[] {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    const label = pick(session) ?? missingLabel;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts, ([label, count]) => ({
    label,
    count,
    share: percent(count, sessions.length),
  })).sort(
    (a, b) =>
      // « Non renseigné » toujours en dernier, le reste par effectif décroissant.
      Number(a.label === missingLabel) - Number(b.label === missingLabel) ||
      b.count - a.count ||
      a.label.localeCompare(b.label, "fr"),
  );
}

/* ───────────────────────────── Chronologie ────────────────────────────── */

/** Au-delà de 72 h entre la première et la dernière partie : profil horaire. */
const MAX_HOURLY_SPAN = 72;
const MAX_DAILY_GAP_FILL = 120;

function dailyTimeline(sessions: SessionRecord[]): TimePoint[] {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    const key = dayKey(new Date(session.created_at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const keys = Array.from(counts.keys()).sort();
  if (keys.length === 0) return [];

  // On comble les jours sans participation pour garder un axe continu.
  const filled: string[] = [];
  let cursor = keys[0];
  const last = keys[keys.length - 1];
  while (cursor <= last && filled.length < MAX_DAILY_GAP_FILL) {
    filled.push(cursor);
    cursor = addDays(cursor, 1);
  }
  const allKeys = filled[filled.length - 1] === last ? filled : keys;

  return allKeys.map((key) => ({
    key,
    label: formatDayShort(key),
    fullLabel: `${formatWeekday(key)} ${formatDayShort(key).replace(/^\d+\s/, "")}`,
    count: counts.get(key) ?? 0,
  }));
}

function hourlyTimeline(sessions: SessionRecord[]): {
  points: TimePoint[];
  kind: "timeline" | "profile";
} {
  const counts = new Map<string, number>();
  let first = Infinity;
  let last = -Infinity;
  for (const session of sessions) {
    const instant = new Date(session.created_at);
    const key = hourKey(instant);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    first = Math.min(first, instant.getTime());
    last = Math.max(last, instant.getTime());
  }
  if (counts.size === 0) return { points: [], kind: "timeline" };

  const HOUR = 60 * 60 * 1000;
  const spanHours = Math.floor(last / HOUR) - Math.floor(first / HOUR) + 1;

  // Période longue : un axe heure par heure serait illisible. On montre plutôt
  // à quelle heure de la journée on joue, tous jours confondus.
  if (spanHours > MAX_HOURLY_SPAN) {
    const byHour = new Map<number, number>();
    for (const [key, count] of counts) {
      const hour = Number(key.slice(11, 13));
      byHour.set(hour, (byHour.get(hour) ?? 0) + count);
    }
    const hours = Array.from(byHour.keys());
    const points: TimePoint[] = [];
    for (let hour = Math.min(...hours); hour <= Math.max(...hours); hour += 1) {
      points.push({
        key: String(hour).padStart(2, "0"),
        label: `${hour} h`,
        fullLabel: `De ${hour} h à ${(hour + 1) % 24} h, tous jours confondus`,
        count: byHour.get(hour) ?? 0,
      });
    }
    return { points, kind: "profile" };
  }

  // Axe continu, heure par heure, entre la première et la dernière partie.
  const keys = new Set<string>(counts.keys());
  for (let t = Math.floor(first / HOUR) * HOUR; t <= last; t += HOUR) {
    keys.add(hourKey(new Date(t)));
  }
  const sorted = Array.from(keys).sort();
  const singleDay = new Set(sorted.map((key) => key.slice(0, 10))).size === 1;

  return {
    kind: "timeline",
    points: sorted.map((key) => {
      const day = key.slice(0, 10);
      const hour = Number(key.slice(11, 13));
      return {
        key,
        label: singleDay ? `${hour} h` : `${formatWeekday(day)} · ${hour} h`,
        fullLabel: `${formatWeekday(day)} ${formatDayShort(day).replace(/^\d+\s/, "")}, de ${hour} h à ${(hour + 1) % 24} h`,
        count: counts.get(key) ?? 0,
      };
    }),
  };
}

/* ───────────────────────────── Assemblage ─────────────────────────────── */

export function computeStats(sessions: SessionRecord[]): DashboardStats {
  const started = sessions.length;
  const completedSessions = sessions.filter((s) => s.completed_at !== null);
  const scores = completedSessions
    .map((s) => s.score)
    .filter((score): score is number => score !== null);
  const ratings = sessions
    .map((s) => s.feedback?.rating ?? null)
    .filter((rating): rating is number => rating !== null);
  const commentCount = sessions.filter((s) => s.feedback?.comment?.trim()).length;

  const perQuestion = questions.map((q, index) => questionStats(q, index, sessions));

  const scoreDistribution = Array.from({ length: questions.length + 1 }, (_, score) => {
    const count = scores.filter((value) => value === score).length;
    return { score, count, share: percent(count, scores.length) };
  });

  const answeredQuestion = (questionId: number) =>
    sessions.filter((s) => s.answers.some((a) => a.question_id === questionId)).length;

  const funnel: FunnelStep[] = [
    { label: "Partie démarrée", count: started, share: started > 0 ? 100 : 0 },
    ...questions.map((q, index) => {
      const count = answeredQuestion(q.id);
      return {
        label: `A répondu à la devinette ${index + 1}`,
        count,
        share: percent(count, started),
      };
    }),
  ];

  const daily = dailyTimeline(sessions);
  const hourly = hourlyTimeline(sessions);

  return {
    totals: {
      started,
      completed: completedSessions.length,
      completionRate: started > 0 ? percent(completedSessions.length, started) : null,
      averageScore: average(scores),
      averageRating: average(ratings),
      ratingCount: ratings.length,
      commentCount,
      totalQuestions: questions.length,
    },
    questions: perQuestion,
    scoreDistribution,
    timeline: {
      hourly: hourly.points,
      hourlyKind: hourly.kind,
      daily,
      // Un seul événement (un ou deux jours) : vue par heure ; sinon par jour.
      defaultMode: daily.length <= 2 ? "hour" : "day",
    },
    districts: countBy(sessions, (s) => s.district, "Non renseigné"),
    sources: countBy(sessions, (s) => s.source, "Sans source"),
    funnel,
  };
}

/** Avis comportant un commentaire, du plus récent au plus ancien. */
export function listFeedback(sessions: SessionRecord[]): FeedbackEntry[] {
  return sessions
    .filter((s) => s.feedback?.comment?.trim())
    .map((s) => ({
      sessionId: s.id,
      rating: s.feedback?.rating ?? null,
      comment: (s.feedback?.comment ?? "").trim(),
      createdAt: s.feedback?.created_at ?? s.created_at,
      firstName: s.first_name,
      district: s.district,
      source: s.source,
      score: s.score,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
