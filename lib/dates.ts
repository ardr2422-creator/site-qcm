/**
 * Dates et fuseau horaire.
 *
 * Les dates sont stockées en UTC. Tout ce que voit l'organisateur (filtres,
 * graphiques, exports) est exprimé à l'heure de Paris, quel que soit le
 * fuseau du serveur (UTC chez Vercel).
 */

export const TIME_ZONE = "Europe/Paris";

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

/** Composantes d'un instant, à l'heure de Paris. */
export function zonedParts(instant: Date): ZonedParts {
  const map: Record<string, number> = {};
  for (const part of partsFormatter.formatToParts(instant)) {
    if (part.type !== "literal") map[part.type] = Number(part.value);
  }
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    second: map.second,
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

/** Clé de jour à l'heure de Paris : "2026-11-15". */
export function dayKey(instant: Date): string {
  const p = zonedParts(instant);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Clé d'heure à l'heure de Paris : "2026-11-15T18". */
export function hourKey(instant: Date): string {
  const p = zonedParts(instant);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}`;
}

/** Décalage (en ms) entre l'heure de Paris et l'UTC à un instant donné. */
function offsetMs(instant: Date): number {
  const p = zonedParts(instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

export function isDateString(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

/** Instant correspondant à minuit, heure de Paris, pour un jour "AAAA-MM-JJ". */
export function startOfDay(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d);
  let result = guess - offsetMs(new Date(guess));
  // Second passage : le décalage peut différer autour d'un changement d'heure.
  result = guess - offsetMs(new Date(result));
  return new Date(result);
}

/** Jour suivant / précédent, en pur calcul de calendrier. */
export function addDays(date: string, amount: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + amount));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

/** Date du jour à Paris : "2026-11-15". */
export function today(now: Date = new Date()): string {
  return dayKey(now);
}

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDayFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});

const weekdayFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
});

/** "15 novembre 2026 à 18:42" */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** "15 novembre 2026" */
export function formatDate(iso: string | Date): string {
  return dateFormatter.format(typeof iso === "string" ? new Date(iso) : iso);
}

/** "15 novembre 2026" à partir d'une clé de jour "2026-11-15". */
export function formatDayKey(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** "15 nov." à partir d'une clé de jour. */
export function formatDayShort(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return shortDayFormatter.format(new Date(Date.UTC(y, m - 1, d)));
}

/** "dim. 15" à partir d'une clé de jour. */
export function formatWeekday(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return weekdayFormatter.format(new Date(Date.UTC(y, m - 1, d)));
}

/** "2026-11-15 18:42:07" à l'heure de Paris (pour les exports CSV). */
export function formatForCsv(iso: string | null): string {
  if (!iso) return "";
  const p = zonedParts(new Date(iso));
  return `${p.year}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}
