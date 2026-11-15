/**
 * Petites fonctions de validation / nettoyage, utilisées côté serveur
 * (routes API) et côté client (formulaires). Aucune dépendance.
 */

import { allowedDistricts } from "@/data/districts";

export const FIRST_NAME_MAX = 40;
export const COMMENT_MAX = 500;
export const SOURCE_MAX = 40;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Retire les caractères de contrôle et normalise les espaces. */
function stripControlChars(value: string, keepNewlines: boolean): string {
  // \p{Cc} = caractères de contrôle ; [^\P{Cc}\n] = les mêmes, sauf le saut de ligne.
  const pattern = keepNewlines ? /[^\P{Cc}\n]/gu : /\p{Cc}/gu;
  return value.replace(pattern, " ");
}

/** Texte court sur une ligne (prénom…). Renvoie `null` si vide. */
export function cleanLine(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = stripControlChars(value, false).replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return Array.from(cleaned).slice(0, maxLength).join("");
}

/** Texte libre sur plusieurs lignes (commentaire). Renvoie `null` si vide. */
export function cleanMultiline(
  value: unknown,
  maxLength: number,
): string | null {
  if (typeof value !== "string") return null;
  const cleaned = stripControlChars(value.replace(/\r\n?/g, "\n"), true)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!cleaned) return null;
  return Array.from(cleaned).slice(0, maxLength).join("");
}

/** Quartier : uniquement une valeur de la liste, sinon `null`. */
export function cleanDistrict(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return allowedDistricts.includes(value) ? value : null;
}

/**
 * Paramètre `?src=` : minuscules, chiffres, tirets et tirets bas uniquement
 * (« Table 12 » devient « table-12 »). Renvoie `null` si rien d'exploitable.
 */
export function cleanSource(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SOURCE_MAX);
  return cleaned || null;
}

/** Note de 1 à 5, sinon `null`. */
export function cleanRating(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  return value >= 1 && value <= 5 ? value : null;
}
