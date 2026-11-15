/**
 * Authentification de l'espace organisateur.
 *
 * Un seul mot de passe (variable ADMIN_PASSWORD). Après connexion, un cookie
 * httpOnly contient un jeton signé (HMAC-SHA-256) avec une date d'expiration.
 * La clé de signature est dérivée du mot de passe : le changer déconnecte
 * immédiatement tout le monde.
 *
 * Ce module n'utilise que l'API Web Crypto, disponible à la fois dans le
 * middleware (runtime Edge) et dans les routes Node.
 */

export const ADMIN_COOKIE = "sga_admin";
/** Durée de la session organisateur, en secondes (12 h). */
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

const encoder = new TextEncoder();

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

/** Comparaison à temps constant de deux chaînes de même nature. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function getAdminPassword(): string | null {
  // Espaces de début et de fin ignorés : ils viennent presque toujours d'un copier-coller.
  const password = process.env.ADMIN_PASSWORD?.trim();
  return password ? password : null;
}

function signingSecret(password: string): string {
  return `sga-admin-session-v1:${password}`;
}

/** Vérifie le mot de passe saisi, sans fuite d'information par le temps de réponse. */
export async function passwordMatches(input: string): Promise<boolean> {
  const expected = getAdminPassword();
  if (!expected) return false;
  const [a, b] = await Promise.all([
    hmacHex("sga-admin-compare", input.trim()),
    hmacHex("sga-admin-compare", expected),
  ]);
  return safeEqual(a, b);
}

/** Jeton de session : `v1.<expiration en ms>.<signature>`. */
export async function createAdminToken(now: number = Date.now()): Promise<string> {
  const password = getAdminPassword();
  if (!password) throw new Error("ADMIN_PASSWORD n'est pas défini.");
  const payload = `v1.${now + ADMIN_SESSION_MAX_AGE * 1000}`;
  return `${payload}.${await hmacHex(signingSecret(password), payload)}`;
}

export async function verifyAdminToken(
  token: string | null | undefined,
  now: number = Date.now(),
): Promise<boolean> {
  const password = getAdminPassword();
  if (!password || !token) return false;

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;

  const expiresAt = Number(parts[1]);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) return false;

  const expected = await hmacHex(signingSecret(password), `v1.${parts[1]}`);
  return safeEqual(expected, parts[2]);
}

/** N'autorise que les redirections internes vers l'espace organisateur. */
export function safeAdminRedirect(target: string | null | undefined): string {
  if (!target) return "/admin";
  return /^\/admin(?:[/?#]|$)/.test(target) && !target.includes("//") && !target.includes("\\")
    ? target
    : "/admin";
}
