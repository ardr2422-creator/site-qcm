import "server-only";

import { randomUUID } from "node:crypto";

import {
  LIVE_NAME_MAX,
  generateLiveCode,
  normalizeLiveCode,
  rankPlayers,
  type LivePlayer,
} from "@/lib/live";
import { cleanLine } from "@/lib/validation";

import { PG_UNIQUE_VIOLATION, getSupabase } from "./supabase";

/** Accès aux parties en direct (côté serveur uniquement). */

export type LiveGame = {
  id: string;
  code: string;
  name: string;
  created_at: string;
  closed_at: string | null;
};

export type LiveGameSummary = LiveGame & { players: number; finished: number };

export type LiveBoard = {
  game: LiveGame;
  players: LivePlayer[];
  generatedAt: string;
};

const GAME_COLUMNS = "id, code, name, created_at, closed_at";

function dbError(context: string, error: { message: string; code?: string }) {
  return Object.assign(new Error(`${context} : ${error.message}`), { code: error.code });
}

export async function createLiveGame(rawName: unknown): Promise<LiveGame> {
  const name = cleanLine(rawName, LIVE_NAME_MAX) ?? "Partie en direct";
  const supabase = getSupabase();

  // Un code aléatoire de 6 caractères : on réessaie dans le cas (rarissime) d'un doublon.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const game: LiveGame = {
      id: randomUUID(),
      code: generateLiveCode(),
      name,
      created_at: new Date().toISOString(),
      closed_at: null,
    };
    const { error } = await supabase
      .from("live_games")
      .insert({ id: game.id, code: game.code, name: game.name });
    if (!error) return game;
    if (error.code !== PG_UNIQUE_VIOLATION) throw dbError("Création de la partie en direct", error);
  }
  throw new Error("Impossible de générer un code de partie unique.");
}

export async function listLiveGames(): Promise<LiveGameSummary[]> {
  const supabase = getSupabase();
  const [games, sessions] = await Promise.all([
    supabase.from("live_games").select(GAME_COLUMNS).order("created_at", { ascending: false }),
    supabase
      .from("sessions")
      .select("live_game_id, completed_at")
      .not("live_game_id", "is", null)
      .range(0, 9999),
  ]);
  if (games.error) throw dbError("Lecture des parties en direct", games.error);
  if (sessions.error) throw dbError("Lecture des participants", sessions.error);

  const counts = new Map<string, { players: number; finished: number }>();
  for (const row of (sessions.data ?? []) as { live_game_id: string; completed_at: string | null }[]) {
    const entry = counts.get(row.live_game_id) ?? { players: 0, finished: 0 };
    entry.players += 1;
    if (row.completed_at) entry.finished += 1;
    counts.set(row.live_game_id, entry);
  }

  return ((games.data ?? []) as LiveGame[]).map((game) => ({
    ...game,
    ...(counts.get(game.id) ?? { players: 0, finished: 0 }),
  }));
}

export async function getLiveGame(id: string): Promise<LiveGame | null> {
  const { data, error } = await getSupabase()
    .from("live_games")
    .select(GAME_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw dbError("Lecture de la partie en direct", error);
  return (data as LiveGame | null) ?? null;
}

export async function getLiveGameByCode(rawCode: unknown): Promise<LiveGame | null> {
  const code = normalizeLiveCode(rawCode);
  if (!code) return null;
  const { data, error } = await getSupabase()
    .from("live_games")
    .select(GAME_COLUMNS)
    .eq("code", code)
    .maybeSingle();
  if (error) throw dbError("Lecture de la partie en direct", error);
  return (data as LiveGame | null) ?? null;
}

export async function closeLiveGame(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from("live_games")
    .update({ closed_at: new Date().toISOString() })
    .eq("id", id)
    .is("closed_at", null);
  if (error) throw dbError("Clôture de la partie en direct", error);
}

export async function reopenLiveGame(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from("live_games")
    .update({ closed_at: null })
    .eq("id", id);
  if (error) throw dbError("Réouverture de la partie en direct", error);
}

/** Supprime la partie en direct et, en cascade, ses participants et leurs réponses. */
export async function deleteLiveGame(id: string): Promise<void> {
  const supabase = getSupabase();
  // Suppression explicite des parties rattachées (en plus de la cascade), par sécurité.
  const sessions = await supabase.from("sessions").delete().eq("live_game_id", id);
  if (sessions.error) throw dbError("Suppression des participants", sessions.error);
  const { error } = await supabase.from("live_games").delete().eq("id", id);
  if (error) throw dbError("Suppression de la partie en direct", error);
}

type RawPlayer = {
  id: string;
  first_name: string | null;
  created_at: string;
  completed_at: string | null;
  score: number | null;
  answers: { question_id: number }[] | null;
};

export async function getLiveBoard(id: string): Promise<LiveBoard | null> {
  const game = await getLiveGame(id);
  if (!game) return null;

  const { data, error } = await getSupabase()
    .from("sessions")
    .select("id, first_name, created_at, completed_at, score, answers(question_id)")
    .eq("live_game_id", id)
    .order("created_at", { ascending: true })
    .range(0, 499);
  if (error) throw dbError("Lecture du classement", error);

  const players = rankPlayers(
    ((data ?? []) as RawPlayer[]).map((row) => ({
      id: row.id,
      name: row.first_name ?? "Sans nom",
      startedAt: row.created_at,
      completedAt: row.completed_at,
      score: row.score,
      answered: (row.answers ?? []).length,
    })),
  );

  return { game, players, generatedAt: new Date().toISOString() };
}
