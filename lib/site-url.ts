/**
 * Adresse publique du jeu : c'est vers elle que pointent les QR codes.
 *
 * Par défaut : https://qcm-argenteuil.vercel.app
 * Pour en changer (nom de domaine personnalisé, par exemple), il suffit de
 * définir la variable NEXT_PUBLIC_SITE_URL sur Vercel, puis de redéployer.
 */
export const DEFAULT_SITE_URL = "https://qcm-argenteuil.vercel.app";

/** Adresse publique du site, sans barre finale. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.toString().replace(/\/+$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}

/** Adresse du jeu pour une source donnée : https://…/?src=table */
export function buildPlayUrl(baseUrl: string, source: string | null): string {
  const base = baseUrl.replace(/\/+$/, "");
  return source ? `${base}/?src=${encodeURIComponent(source)}` : `${base}/`;
}
