/**
 * Quartiers proposés dans la liste déroulante « Votre quartier ».
 *
 * Ce sont les 6 quartiers officiels de la ville, ceux des comités de quartier,
 * avec l'orthographe de la charte municipale (argenteuil.fr). Les secteurs
 * plus petits (Joliot-Curie, Volembert, Mazagran, Champioux…) sont rattachés à
 * l'un d'eux.
 *
 * Liste modifiable librement : ajoutez, retirez ou renommez des lignes.
 * Évitez seulement de renommer un quartier en cours d'opération : les
 * statistiques compteraient l'ancien et le nouveau nom séparément.
 */
export const districts = [
  "Centre-ville",
  "Coteaux",
  "Orgemont",
  "Val-d'Argent-Nord",
  "Val-d'Argent-Sud",
  "Val-Notre-Dame",
] as const;

/** Choix supplémentaire enregistré tel quel. */
export const DISTRICT_OTHER = "Autre";

/** Choix « Je préfère ne pas répondre » : rien n'est enregistré. */
export const DISTRICT_NO_ANSWER_LABEL = "Je préfère ne pas répondre";

/** Valeurs acceptées par le serveur pour le champ `district`. */
export const allowedDistricts: readonly string[] = [...districts, DISTRICT_OTHER];
