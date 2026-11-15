/** Mise en forme des nombres à la française (virgule décimale, espace avant %). */

const NBSP = " ";

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return value.toLocaleString("fr-FR", { maximumFractionDigits });
}

/** 84.2 → "84,2 %" ; les valeurs entières restent entières ("84 %"). */
export function formatPercent(value: number, maximumFractionDigits = 0): string {
  return `${formatNumber(value, maximumFractionDigits)}${NBSP}%`;
}

/** 3.42 → "3,4" ; `null` → "—". */
export function formatAverage(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function plural(count: number, singular: string, pluralForm: string): string {
  return count > 1 ? pluralForm : singular;
}
