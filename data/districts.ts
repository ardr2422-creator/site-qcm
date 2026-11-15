/**
 * Quartiers proposés dans la liste déroulante « Votre quartier ».
 * Liste modifiable librement : ajoutez, retirez ou renommez des lignes.
 */
export const districts = [
  "Centre-ville",
  "Les Coteaux",
  "Orgemont-Volembert",
  "Val d'Argent Nord",
  "Val d'Argent Sud",
  "Val Notre-Dame",
] as const;

/** Choix supplémentaire enregistré tel quel. */
export const DISTRICT_OTHER = "Autre";

/** Choix « Je préfère ne pas répondre » : rien n'est enregistré. */
export const DISTRICT_NO_ANSWER_LABEL = "Je préfère ne pas répondre";

/** Valeurs acceptées par le serveur pour le champ `district`. */
export const allowedDistricts: readonly string[] = [...districts, DISTRICT_OTHER];
