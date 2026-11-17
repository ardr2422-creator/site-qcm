"use client";

import {
  TOTAL_QUESTIONS,
  getOption,
  getQuestion,
  isCorrectAnswer,
  questions,
} from "@/data/questions";
import { cleanDistrict, cleanLine, cleanSource, FIRST_NAME_MAX } from "@/lib/validation";

import { enqueue } from "./outbox";
import {
  STORAGE_KEYS,
  randomUuid,
  readStored,
  useStored,
  writeStored,
} from "./storage";

/**
 * État de la partie, conservé sur le téléphone du visiteur.
 *
 * Le jeu se déroule entièrement en local (affichage immédiat, aucun écran
 * bloqué par le réseau) ; chaque étape est envoyée au serveur en parallèle
 * via la file d'envoi (`outbox.ts`). Le score affiché est calculé ici pour
 * l'affichage, mais celui qui est enregistré est recalculé par le serveur.
 */

export type LocalAnswer = {
  questionId: number;
  optionId: string;
  correct: boolean;
};

export type LocalGame = {
  /** Identifiant anonyme de la partie (UUID). */
  sessionId: string;
  /** Vrai si le jeu avait déjà été terminé sur cet appareil. */
  replay: boolean;
  firstName: string | null;
  district: string | null;
  source: string | null;
  startedAt: string;
  /** Ordre (mélangé) des réponses pour chaque question : { "1": ["id", …] }. */
  optionOrder: Record<string, string[]>;
  answers: LocalAnswer[];
  completedAt: string | null;
  feedbackSent: boolean;
  /**
   * Partie en direct (concours nominatif) : code de la partie et nom du joueur.
   * Absent ou `null` pour une partie ordinaire.
   */
  live?: LiveInfo | null;
};

export type LiveInfo = {
  code: string;
  /** Nom de la partie en direct (ex. « Démonstration aux élus »). */
  title: string;
};

/** Trace de la première partie terminée sur cet appareil. */
export type DoneRecord = {
  score: number;
  total: number;
  completedAt: string;
};

export type Profile = {
  firstName: string | null;
  district: string | null;
};

/* ─────────────────────────────── Lecture ──────────────────────────────── */

/** Écarte une partie enregistrée qui ne correspond plus aux questions actuelles. */
function isUsable(game: LocalGame | null): game is LocalGame {
  if (!game || typeof game.sessionId !== "string") return false;
  if (!Array.isArray(game.answers) || typeof game.optionOrder !== "object") {
    return false;
  }
  if (game.answers.length > TOTAL_QUESTIONS) return false;

  const everyQuestionHasItsOrder = questions.every((q) => {
    const order = game.optionOrder?.[String(q.id)];
    return (
      Array.isArray(order) &&
      order.length === q.options.length &&
      q.options.every((o) => order.includes(o.id))
    );
  });
  if (!everyQuestionHasItsOrder) return false;

  return game.answers.every((a, index) => {
    const question = questions[index];
    return (
      question !== undefined &&
      a.questionId === question.id &&
      getOption(question, a.optionId) !== undefined
    );
  });
}

export function readGame(): LocalGame | null {
  const game = readStored<LocalGame>(STORAGE_KEYS.game);
  return isUsable(game) ? game : null;
}

/** `undefined` pendant l'hydratation, `null` s'il n'y a pas de partie. */
export function useGame(): LocalGame | null | undefined {
  const game = useStored<LocalGame>(STORAGE_KEYS.game);
  if (game === undefined) return undefined;
  return isUsable(game) ? game : null;
}

export function useDone(): DoneRecord | null | undefined {
  return useStored<DoneRecord>(STORAGE_KEYS.done);
}

export function gameScore(game: LocalGame): number {
  return game.answers.filter((a) => a.correct).length;
}

export function isGameComplete(game: LocalGame): boolean {
  return game.completedAt !== null;
}

/* ─────────────────────────────── Source ───────────────────────────────── */

/** Mémorise le paramètre `?src=` de l'URL d'arrivée (table, affiche, menu…). */
export function captureSourceFromUrl(): void {
  try {
    const raw = new URLSearchParams(window.location.search).get("src");
    const source = cleanSource(raw);
    if (source) writeStored(STORAGE_KEYS.source, source);
  } catch {
    // URL illisible : tant pis pour la source, le jeu continue.
  }
}

/* ─────────────────────────────── Actions ──────────────────────────────── */

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Démarre une nouvelle partie et prévient le serveur.
 * Avec `live`, la partie est rattachée à une partie en direct : elle n'est
 * jamais comptée comme « rejouée » et ne marque pas l'appareil comme ayant
 * déjà participé (plusieurs joueurs peuvent se passer le même téléphone).
 */
export function startGame(profile: Profile, live: LiveInfo | null = null): LocalGame {
  const done = readStored<DoneRecord>(STORAGE_KEYS.done);

  const game: LocalGame = {
    sessionId: randomUuid(),
    replay: live ? false : done !== null,
    firstName: cleanLine(profile.firstName, FIRST_NAME_MAX),
    district: live ? null : cleanDistrict(profile.district),
    source: live ? null : readStored<string>(STORAGE_KEYS.source),
    startedAt: new Date().toISOString(),
    optionOrder: Object.fromEntries(
      questions.map((q) => [String(q.id), shuffle(q.options.map((o) => o.id))]),
    ),
    answers: [],
    completedAt: null,
    feedbackSent: false,
    live,
  };

  writeStored(STORAGE_KEYS.game, game);
  enqueue("/api/session", {
    id: game.sessionId,
    firstName: game.firstName,
    district: game.district,
    source: game.source,
    replay: game.replay,
    ...(live ? { liveCode: live.code } : {}),
  });
  return game;
}

/**
 * Enregistre la réponse à la question en cours. Sans effet si la question a
 * déjà reçu une réponse (on ne revient pas en arrière) ou n'est pas la suivante.
 */
export function answerQuestion(questionId: number, optionId: string): LocalGame | null {
  const game = readGame();
  if (!game || isGameComplete(game)) return game;

  const expected = questions[game.answers.length];
  const question = getQuestion(questionId);
  if (!expected || !question || expected.id !== questionId) return game;
  if (!getOption(question, optionId)) return game;

  const answers: LocalAnswer[] = [
    ...game.answers,
    { questionId, optionId, correct: isCorrectAnswer(questionId, optionId) },
  ];
  const finished = answers.length >= TOTAL_QUESTIONS;
  const next: LocalGame = {
    ...game,
    answers,
    completedAt: finished ? new Date().toISOString() : null,
  };

  writeStored(STORAGE_KEYS.game, next);
  enqueue("/api/answer", { sessionId: game.sessionId, questionId, optionId });

  if (finished) {
    enqueue("/api/complete", { sessionId: game.sessionId });
    if (!game.live && readStored<DoneRecord>(STORAGE_KEYS.done) === null) {
      writeStored<DoneRecord>(STORAGE_KEYS.done, {
        score: gameScore(next),
        total: TOTAL_QUESTIONS,
        completedAt: next.completedAt as string,
      });
    }
  }
  return next;
}

/** Envoie l'avis de fin de partie (une seule fois par partie). */
export function sendFeedback(rating: number | null, comment: string | null): void {
  const game = readGame();
  if (!game || !isGameComplete(game) || game.feedbackSent) return;
  if (rating === null && !comment) return;

  writeStored(STORAGE_KEYS.game, { ...game, feedbackSent: true });
  enqueue("/api/feedback", { sessionId: game.sessionId, rating, comment });
}
