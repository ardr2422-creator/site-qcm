import { addDays, isDateString, startOfDay } from "./dates";
import { cleanSource } from "./validation";

/**
 * Filtres du tableau de bord, portés par l'URL :
 *   ?du=2026-11-01&au=2026-11-15&src=table&rejouees=1
 * Les mêmes paramètres sont compris par les exports CSV et la version
 * imprimable, pour que tout reste cohérent.
 */

/** Valeur spéciale du filtre « source » : parties sans paramètre ?src=. */
export const NO_SOURCE = "aucune";

export type DashboardFilters = {
  /** Premier jour inclus (AAAA-MM-JJ, heure de Paris) ou `null`. */
  from: string | null;
  /** Dernier jour inclus (AAAA-MM-JJ, heure de Paris) ou `null`. */
  to: string | null;
  /** Source exacte, `NO_SOURCE`, ou `null` pour toutes. */
  source: string | null;
  includeReplays: boolean;
};

type RawParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function read(params: RawParams, key: string): string | null {
  if (params instanceof URLSearchParams) return params.get(key);
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

export function parseFilters(params: RawParams): DashboardFilters {
  const rawFrom = read(params, "du");
  const rawTo = read(params, "au");
  let from = isDateString(rawFrom) ? rawFrom : null;
  let to = isDateString(rawTo) ? rawTo : null;
  // Dates saisies à l'envers : on les remet dans l'ordre.
  if (from && to && from > to) [from, to] = [to, from];

  const rawSource = read(params, "src");
  const source = rawSource === NO_SOURCE ? NO_SOURCE : cleanSource(rawSource);

  return {
    from,
    to,
    source,
    includeReplays: read(params, "rejouees") === "1",
  };
}

/** Chaîne de requête correspondant aux filtres ("" si aucun filtre). */
export function filtersToQuery(filters: DashboardFilters): string {
  const params = new URLSearchParams();
  if (filters.from) params.set("du", filters.from);
  if (filters.to) params.set("au", filters.to);
  if (filters.source) params.set("src", filters.source);
  if (filters.includeReplays) params.set("rejouees", "1");
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function hasActiveFilters(filters: DashboardFilters): boolean {
  return Boolean(
    filters.from || filters.to || filters.source || filters.includeReplays,
  );
}

/** Bornes UTC de la période : [début inclus, fin exclue]. */
export function filterBounds(filters: DashboardFilters): {
  fromIso: string | null;
  toIso: string | null;
} {
  return {
    fromIso: filters.from ? startOfDay(filters.from).toISOString() : null,
    toIso: filters.to ? startOfDay(addDays(filters.to, 1)).toISOString() : null,
  };
}
