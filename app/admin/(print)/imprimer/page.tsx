import type { Metadata } from "next";
import Link from "next/link";

import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { PrintButton } from "@/components/admin/PrintButton";
import { StatTiles } from "@/components/admin/StatTiles";
import { Asparagus } from "@/components/illustrations/Asparagus";
import { Fig } from "@/components/illustrations/Fig";
import { site } from "@/data/site";
import { formatDateTime, formatDayKey } from "@/lib/dates";
import { NO_SOURCE, filtersToQuery, parseFilters, type DashboardFilters } from "@/lib/filters";
import { requireAdmin } from "@/lib/server/admin-auth";
import { loadDashboard, type DashboardData } from "@/lib/server/admin-data";
import { typo } from "@/lib/typo";

export const metadata: Metadata = { title: "Bilan imprimable" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function describeFilters(filters: DashboardFilters): string {
  const parts: string[] = [];

  if (filters.from && filters.to) {
    parts.push(
      filters.from === filters.to
        ? `Journée du ${formatDayKey(filters.from)}`
        : `Du ${formatDayKey(filters.from)} au ${formatDayKey(filters.to)}`,
    );
  } else if (filters.from) {
    parts.push(`Depuis le ${formatDayKey(filters.from)}`);
  } else if (filters.to) {
    parts.push(`Jusqu’au ${formatDayKey(filters.to)}`);
  } else {
    parts.push("Toute la période");
  }

  if (filters.source === NO_SOURCE) parts.push("sans source (accès direct)");
  else if (filters.source) parts.push(`source « ${filters.source} »`);
  else parts.push("toutes les sources");

  parts.push(filters.includeReplays ? "parties rejouées incluses" : "hors parties rejouées");
  return parts.join(" · ");
}

export default async function PrintableReportPage({ searchParams }: Props) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);

  let data: DashboardData | null = null;
  try {
    data = await loadDashboard(filters);
  } catch (error) {
    console.error("[admin] version imprimable :", error);
  }

  return (
    <>
      {/* Format de page pour l'impression et l'export PDF. */}
      <style>{`@page { size: A4 portrait; margin: 12mm; }`}</style>

      <div className="sticky top-0 z-10 border-b border-creme-400 bg-creme-50 print:hidden">
        <div className="mx-auto flex max-w-[760px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link
            href={`/admin${filtersToQuery(filters)}`}
            className="text-[0.9375rem] font-medium text-brun-700 underline decoration-brun-400 underline-offset-4 hover:text-figue-600"
          >
            ← Retour au tableau de bord
          </Link>
          <div className="flex items-center gap-3">
            <p className="hidden text-sm text-brun-600 sm:block">
              Format A4 · choisissez « Enregistrer au format PDF » pour un fichier.
            </p>
            <PrintButton />
          </div>
        </div>
      </div>

      {/* La feuille : 664 px de contenu, à l'écran comme à l'impression. */}
      <div className="mx-auto my-6 box-content w-[664px] bg-white px-6 py-8 shadow-xl print:my-0 print:p-0 print:shadow-none">
        <header className="flex items-end justify-between gap-6 border-b-2 border-brun-900 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-asperge-700">
              Bilan de participation
            </p>
            <h1 className="mt-1 font-serif text-3xl font-semibold leading-tight text-brun-900">
              {typo(site.title)}
            </h1>
            <p className="mt-1 font-serif italic text-figue-600">{typo(site.subtitle)}</p>
          </div>
          <div className="flex shrink-0 items-end gap-2" aria-hidden="true">
            <Asparagus className="h-16 w-auto" />
            <Fig className="h-12 w-auto" />
          </div>
        </header>

        <p className="mt-3 text-sm text-brun-700">
          <strong className="font-semibold text-brun-900">{describeFilters(filters)}</strong>
          {data ? <> — données arrêtées au {formatDateTime(data.generatedAt)}</> : null}
        </p>

        {!data ? (
          <p role="alert" className="mt-8 rounded-lg border border-erreur-600 bg-erreur-50 px-4 py-4 text-erreur-800">
            Impossible de lire les données pour le moment. Revenez au tableau de
            bord pour plus de détails.
          </p>
        ) : data.stats.totals.started === 0 ? (
          <p className="mt-8 rounded-lg bg-creme-100 px-4 py-8 text-center text-brun-700">
            Aucune participation sur cette sélection.
          </p>
        ) : (
          <>
            <div className="mt-5">
              <StatTiles totals={data.stats.totals} compact />
            </div>
            <div className="mt-6">
              <DashboardCharts stats={data.stats} print />
            </div>

            {data.feedback.length > 0 ? (
              <section className="mt-6">
                <h2 className="mb-3 break-after-avoid font-serif text-lg font-semibold text-brun-900">
                  Quelques mots de participants
                </h2>
                <ul className="grid grid-cols-2 gap-3">
                  {data.feedback.slice(0, 8).map((entry) => (
                    <li
                      key={entry.sessionId}
                      className="break-inside-avoid rounded-lg border border-creme-300 px-4 py-3 text-sm"
                    >
                      <p className="font-serif italic leading-snug text-brun-900">
                        « {entry.comment} »
                      </p>
                      <p className="mt-1.5 text-xs text-brun-600">
                        {entry.firstName ?? "Anonyme"}
                        {entry.district ? ` · ${typo(entry.district)}` : ""}
                        {entry.rating !== null ? ` · ${entry.rating}/5` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}

        <footer className="mt-8 border-t border-creme-300 pt-3 text-xs text-brun-600">
          {typo(site.title)} — bilan généré depuis l’espace organisateur. Données
          anonymes, utilisées uniquement pour les statistiques du jeu.
        </footer>
      </div>
    </>
  );
}
