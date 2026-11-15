import "server-only";

/**
 * Limitation de débit très simple, en mémoire, par clé (IP + route).
 *
 * Fenêtre fixe : `limit` requêtes au maximum par `windowMs`.
 * Suffisant pour décourager le spam ; sur Vercel chaque instance serverless
 * a son propre compteur, c'est donc une protection « au mieux », pas un
 * pare-feu.
 *
 * Les plafonds sont volontairement généreux : lors d'un événement, tous les
 * téléphones connectés au même Wi-Fi partagent la même adresse IP publique.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

export type RateLimitResult = {
  ok: boolean;
  /** Secondes à attendre avant de réessayer (0 si la requête est acceptée). */
  retryAfter: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) prune(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Toujours plein (attaque distribuée) : on repart de zéro plutôt que de
  // laisser la mémoire grossir sans limite.
  if (buckets.size >= MAX_BUCKETS) buckets.clear();
}

/** Adresse IP du visiteur, telle que transmise par Vercel / le proxy. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "inconnue";
}
