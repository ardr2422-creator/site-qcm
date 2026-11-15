/**
 * Adresse publique du site (variable NEXT_PUBLIC_SITE_URL), sans barre finale.
 * Renvoie `null` si elle n'est pas définie ou invalide.
 */
export function getSiteUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

/** Adresse du jeu pour une source donnée : https://…/?src=table */
export function buildPlayUrl(baseUrl: string, source: string | null): string {
  const base = baseUrl.replace(/\/+$/, "");
  return source ? `${base}/?src=${encodeURIComponent(source)}` : `${base}/`;
}
