import Link from "next/link";

import { addDays, today } from "@/lib/dates";
import {
  NO_SOURCE,
  filtersToQuery,
  hasActiveFilters,
  type DashboardFilters,
} from "@/lib/filters";

type Props = {
  filters: DashboardFilters;
  sources: string[];
  hasSessionsWithoutSource: boolean;
};

const fieldClasses =
  "mt-1 block h-11 w-full rounded-lg border border-brun-500 bg-white px-3 text-brun-900 " +
  "focus:border-asperge-700 focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-figue-500";

const labelClasses = "text-sm font-medium text-brun-700";

/**
 * Filtres du tableau de bord : un simple formulaire GET, qui fonctionne sans
 * JavaScript et donne une adresse partageable. Tout ce qui se trouve en
 * dessous (chiffres, graphiques, avis, exports) suit ces filtres.
 */
export function FiltersBar({ filters, sources, hasSessionsWithoutSource }: Props) {
  const day = today();
  const presets = [
    { label: "Aujourd’hui", from: day, to: day },
    { label: "7 derniers jours", from: addDays(day, -6), to: day },
    { label: "30 derniers jours", from: addDays(day, -29), to: day },
  ];

  // Une source filtrée qui n'existe plus dans les données reste sélectionnable.
  const sourceOptions =
    filters.source && filters.source !== NO_SOURCE && !sources.includes(filters.source)
      ? [...sources, filters.source]
      : sources;

  return (
    <section
      aria-label="Filtres"
      className="rounded-2xl border border-creme-300 bg-[#fffdf8] p-4 sm:p-5"
    >
      <form
        method="get"
        action="/admin"
        className="grid grid-cols-2 items-end gap-x-4 gap-y-3 md:flex md:flex-wrap"
      >
        <div className="md:w-40">
          <label htmlFor="filtre-du" className={labelClasses}>
            Du
          </label>
          <input
            id="filtre-du"
            type="date"
            name="du"
            defaultValue={filters.from ?? ""}
            className={fieldClasses}
          />
        </div>
        <div className="md:w-40">
          <label htmlFor="filtre-au" className={labelClasses}>
            Au
          </label>
          <input
            id="filtre-au"
            type="date"
            name="au"
            defaultValue={filters.to ?? ""}
            className={fieldClasses}
          />
        </div>
        <div className="col-span-2 md:w-48">
          <label htmlFor="filtre-source" className={labelClasses}>
            Source
          </label>
          <select
            id="filtre-source"
            name="src"
            defaultValue={filters.source ?? ""}
            className={fieldClasses}
          >
            <option value="">Toutes les sources</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
            {hasSessionsWithoutSource || filters.source === NO_SOURCE ? (
              <option value={NO_SOURCE}>Sans source (accès direct)</option>
            ) : null}
          </select>
        </div>
        <label className="col-span-2 flex h-11 cursor-pointer items-center gap-2.5 text-[0.9375rem] text-brun-800 md:w-auto">
          <input
            type="checkbox"
            name="rejouees"
            value="1"
            defaultChecked={filters.includeReplays}
            className="h-5 w-5 rounded border-brun-500 accent-asperge-700"
          />
          Inclure les parties rejouées
        </label>
        <div className="col-span-2 flex items-center gap-3 md:ml-auto">
          <button
            type="submit"
            className="h-11 rounded-full bg-asperge-700 px-6 font-semibold text-white transition-colors hover:bg-asperge-800"
          >
            Appliquer
          </button>
          {hasActiveFilters(filters) ? (
            <Link
              href="/admin"
              className="text-[0.9375rem] font-medium text-brun-700 underline decoration-brun-400 underline-offset-4 hover:text-figue-600"
            >
              Réinitialiser
            </Link>
          ) : null}
        </div>
      </form>

      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 border-t border-creme-200 pt-3 text-sm text-brun-600">
        <span>Raccourcis :</span>
        {presets.map((preset) => {
          const active = filters.from === preset.from && filters.to === preset.to;
          return (
            <Link
              key={preset.label}
              href={`/admin${filtersToQuery({ ...filters, from: preset.from, to: preset.to })}`}
              aria-current={active ? "true" : undefined}
              className={`rounded-full border px-3 py-1 font-medium transition-colors ${
                active
                  ? "border-asperge-700 bg-sauge-100 text-asperge-800"
                  : "border-creme-400 text-brun-700 hover:border-brun-500 hover:text-brun-900"
              }`}
            >
              {preset.label}
            </Link>
          );
        })}
        <Link
          href={`/admin${filtersToQuery({ ...filters, from: null, to: null })}`}
          aria-current={!filters.from && !filters.to ? "true" : undefined}
          className={`rounded-full border px-3 py-1 font-medium transition-colors ${
            !filters.from && !filters.to
              ? "border-asperge-700 bg-sauge-100 text-asperge-800"
              : "border-creme-400 text-brun-700 hover:border-brun-500 hover:text-brun-900"
          }`}
        >
          Toute la période
        </Link>
      </p>
    </section>
  );
}
