/**
 * Petites finitions typographiques françaises, appliquées à l'affichage :
 * les textes peuvent ainsi être saisis simplement dans `data/` (apostrophes
 * droites, espaces ordinaires) et s'afficher proprement.
 *
 * - apostrophe droite → apostrophe typographique ;
 * - espace insécable avant ? ! ; : » et après « (évite un « ? » seul en
 *   début de ligne sur un petit écran).
 */
export function typo(text: string): string {
  return text
    .replace(/'/g, "’")
    .replace(/ ([?!;:»])/g, " $1")
    .replace(/« /g, "« ");
}
