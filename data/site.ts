/**
 * Textes et réglages généraux du jeu.
 * Tout ce qui est ici peut être modifié sans toucher au reste du code.
 */

export const site = {
  title: "Les Secrets Gourmands d'Argenteuil",
  eyebrow: "Jeu de devinettes",
  tagline: "À vous de retrouver les trésors de notre territoire",
  /** Sous-titre complet, utilisé dans les métadonnées et les supports imprimés. */
  subtitle:
    "Jeu de devinettes • À vous de retrouver les trésors de notre territoire",
  intro:
    "Cinq devinettes pour voyager dans l'histoire, les paysages et les saveurs de notre ville. Saurez-vous percer leurs secrets ?",
  mention: "Participation anonyme • 2 minutes",
  closing:
    "Un petit voyage dans l'histoire, les paysages et les saveurs d'Argenteuil… Bonne dégustation et bonne enquête !",
  description:
    "Cinq devinettes pour retrouver les trésors d'Argenteuil : son pont, ses bords de Seine, sa butte, ses vergers et ses saveurs. Participation anonyme, 2 minutes.",
  qrCallToAction: "Scannez-moi pour jouer !",
} as const;

/** Message affiché sur l'écran de fin, selon le score obtenu. */
export function scoreMessage(score: number, total: number): string {
  if (total > 0 && score >= total) return "Vous êtes un vrai Argenteuillais !";
  if (total > 0 && score / total >= 0.6) return "Très beau score !";
  return "Vous allez redécouvrir votre ville !";
}

/**
 * Page « Confidentialité ».
 * - `contactEmail` : adresse à laquelle écrire pour toute question ou demande
 *   de suppression. Laisser vide ("") pour renvoyer vers l'équipe sur place.
 * - `retentionMonths` : durée de conservation annoncée, en mois.
 * - `hostedInEU` : affiche la mention « hébergées dans l'Union européenne ».
 */
export const privacy = {
  organizer: "l'équipe organisatrice du jeu",
  contactEmail: "",
  retentionMonths: 12,
  /** Passer à `true` si le projet Supabase est créé dans une région européenne. */
  hostedInEU: false,
} as const;

/** Sources proposées par défaut dans le générateur de QR codes (`?src=`). */
export const defaultSources = [
  { id: "table", label: "Table" },
  { id: "affiche", label: "Affiche" },
  { id: "menu", label: "Menu" },
] as const;
