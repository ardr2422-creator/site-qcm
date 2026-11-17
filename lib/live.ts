/**
 * Parties en direct : outils communs (code de partie, classement).
 *
 * Une « partie en direct » sert aux animations devant un public (par exemple
 * la démonstration aux élus) : chaque participant joue sous son nom, et le
 * classement s'affiche sur l'écran de l'organisatrice. Ces parties ne comptent
 * jamais dans les statistiques du jeu.
 */

/** Lettres et chiffres sans ambiguïté à l'oral ou à l'écrit (ni 0/O, ni 1/I/L). */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const LIVE_CODE_LENGTH = 6;
export const LIVE_NAME_MAX = 80;
export const PLAYER_NAME_MAX = 40;

export function generateLiveCode(random: () => number = Math.random): string {
  return Array.from(
    { length: LIVE_CODE_LENGTH },
    () => CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)],
  ).join("");
}

/** Code saisi ou lu dans une adresse : majuscules, sans espace. `null` si invalide. */
export function normalizeLiveCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z0-9]{4,10}$/.test(code) ? code : null;
}

/** Adresse à scanner pour rejoindre une partie en direct. */
export function liveJoinUrl(siteUrl: string, code: string): string {
  return `${siteUrl.replace(/\/+$/, "")}/direct/${code}`;
}

/* ─────────────────────────────── Classement ───────────────────────────── */

export type LivePlayerRow = {
  id: string;
  name: string;
  startedAt: string;
  completedAt: string | null;
  /** Score calculé par le serveur à la fin de la partie. */
  score: number | null;
  /** Nombre de devinettes déjà répondues. */
  answered: number;
};

export type LivePlayer = LivePlayerRow & {
  finished: boolean;
  /** Temps de jeu en millisecondes (parties terminées). */
  durationMs: number | null;
  /** Place au classement (ex æquo possibles) ; `null` tant que la partie n'est pas finie. */
  rank: number | null;
};

/**
 * Classement : d'abord les parties terminées, du meilleur score au moins bon ;
 * à score égal, la plus rapide passe devant. Les parties en cours suivent,
 * dans l'ordre d'arrivée.
 */
export function rankPlayers(rows: LivePlayerRow[]): LivePlayer[] {
  const players: LivePlayer[] = rows.map((row) => {
    const finished = row.completedAt !== null && row.score !== null;
    const durationMs = finished
      ? Math.max(0, Date.parse(row.completedAt as string) - Date.parse(row.startedAt))
      : null;
    return { ...row, finished, durationMs, rank: null };
  });

  const finished = players
    .filter((p) => p.finished)
    .sort(
      (a, b) =>
        (b.score as number) - (a.score as number) ||
        (a.durationMs as number) - (b.durationMs as number) ||
        a.startedAt.localeCompare(b.startedAt),
    );

  finished.forEach((player, index) => {
    const previous = finished[index - 1];
    const tied =
      previous !== undefined &&
      previous.score === player.score &&
      Math.round((previous.durationMs as number) / 1000) ===
        Math.round((player.durationMs as number) / 1000);
    player.rank = tied ? (previous.rank as number) : index + 1;
  });

  const playing = players
    .filter((p) => !p.finished)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));

  return [...finished, ...playing];
}

/** 92 400 ms → « 1 min 32 s » ; 41 000 ms → « 41 s ». */
export function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0 ? `${minutes} min ${String(seconds).padStart(2, "0")} s` : `${seconds} s`;
}
