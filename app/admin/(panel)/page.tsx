import type { Metadata } from "next";

import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { FeedbackList } from "@/components/admin/FeedbackList";
import { FiltersBar } from "@/components/admin/FiltersBar";
import { StatTiles } from "@/components/admin/StatTiles";
import { filtersToQuery, hasActiveFilters, parseFilters } from "@/lib/filters";
import { requireAdmin } from "@/lib/server/admin-auth";
import { loadDashboard, type DashboardData } from "@/lib/server/admin-data";
import { SupabaseConfigError } from "@/lib/server/supabase";
import { explainDatabaseError } from "@/lib/supabase-config";

export const metadata: Metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const actionClasses =
  "inline-flex h-11 items-center gap-2 rounded-full border border-nuit-500 bg-white px-4 text-[0.9375rem] font-semibold text-nuit-800 transition-colors hover:bg-givre-200";

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3v10m0 0l-4-4m4 4l4-4M4 16.5h12" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 7V3h8v4M6 14H4.5A1.5 1.5 0 013 12.5v-4A1.5 1.5 0 014.5 7h11A1.5 1.5 0 0117 8.5v4a1.5 1.5 0 01-1.5 1.5H14M6 11.5h8V17H6z" />
    </svg>
  );
}

function LoadError({ error }: { error: unknown }) {
  const configProblems = error instanceof SupabaseConfigError ? error.problems : null;
  const explanation = configProblems ? null : explainDatabaseError(error);

  return (
    <div
      role="alert"
      className="mt-6 rounded-2xl border border-erreur-600 bg-erreur-50 px-5 py-5 text-nuit-900"
    >
      <h2 className="font-serif text-xl font-semibold text-erreur-800">
        {configProblems
          ? "La base de données n’est pas encore branchée"
          : "Impossible de lire les données"}
      </h2>

      {configProblems ? (
        <>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            {configProblems.map((problem) => (
              <li key={problem.message}>{problem.message}</li>
            ))}
          </ul>
          <p className="mt-3 text-[0.9375rem] text-nuit-700">
            Ces réglages se trouvent sur Vercel : projet → <strong>Settings</strong> →{" "}
            <strong>Environment Variables</strong>. Après une modification,
            relancez un déploiement (<strong>Deployments</strong> → <strong>…</strong> →{" "}
            <strong>Redeploy</strong>), puis rechargez cette page.
          </p>
        </>
      ) : (
        <>
          <p className="mt-2">
            {explanation ??
              "Vérifiez que le fichier supabase/schema.sql a bien été exécuté dans Supabase et que les réglages sont corrects, puis rechargez la page."}
          </p>
          {error instanceof Error ? (
            <p className="mt-2 text-sm text-nuit-700">Détail technique : {error.message}</p>
          ) : null}
        </>
      )}
    </div>
  );
}

export default async function DashboardPage({ searchParams }: Props) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  const query = filtersToQuery(filters);

  let data: DashboardData | null = null;
  let loadError: unknown = null;
  try {
    data = await loadDashboard(filters);
  } catch (error) {
    loadError = error;
    console.error("[admin] chargement du tableau de bord :", error);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold leading-tight text-nuit-900">
            Tableau de bord
          </h1>
          <p className="mt-1 text-nuit-700">
            Participation, connaissances et avis, en temps réel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/admin/export/reponses${query}`} className={actionClasses} download>
            <DownloadIcon />
            Exporter en CSV
          </a>
          <a href={`/api/admin/export/avis${query}`} className={actionClasses} download>
            <DownloadIcon />
            Exporter les avis en CSV
          </a>
          <a
            href={`/admin/imprimer${query}`}
            target="_blank"
            rel="noopener"
            className={actionClasses}
          >
            <PrintIcon />
            Version imprimable
          </a>
        </div>
      </div>

      {data ? (
        <>
          <div className="mt-6">
            <FiltersBar
              filters={filters}
              sources={data.sources}
              hasSessionsWithoutSource={data.hasSessionsWithoutSource}
            />
          </div>

          <div className="mt-4">
            <StatTiles totals={data.stats.totals} />
          </div>

          {data.stats.totals.started === 0 ? (
            <div className="mt-6 rounded-2xl border border-givre-300 bg-white px-6 py-12 text-center">
              <p className="font-serif text-2xl font-semibold text-nuit-900">
                {hasActiveFilters(filters)
                  ? "Aucune participation pour ces filtres"
                  : "Aucune participation pour l’instant"}
              </p>
              <p className="mx-auto mt-2 max-w-lg text-nuit-700">
                {hasActiveFilters(filters)
                  ? "Élargissez la période ou changez de source pour retrouver des données."
                  : "Les chiffres et les graphiques apparaîtront ici dès la première partie. Pour une démonstration, lancez « npm run seed »."}
              </p>
            </div>
          ) : (
            <div className="mt-8">
              <DashboardCharts stats={data.stats} />

              <div className="mb-3 mt-9">
                <h2 className="font-serif text-xl font-semibold text-nuit-900">Avis</h2>
                <p className="mt-0.5 text-sm text-nuit-600">
                  Ce que les participants ont souhaité partager.
                </p>
              </div>
              <FeedbackList entries={data.feedback} />
            </div>
          )}
        </>
      ) : (
        <LoadError error={loadError} />
      )}
    </>
  );
}
