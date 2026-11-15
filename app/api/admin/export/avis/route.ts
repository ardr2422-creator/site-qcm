import { csvResponse, toCsv, type CsvCell } from "@/lib/csv";
import { formatForCsv, today } from "@/lib/dates";
import { parseFilters } from "@/lib/filters";
import { isAdmin } from "@/lib/server/admin-auth";
import { fail } from "@/lib/server/api";
import { fetchSessions } from "@/lib/server/admin-data";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/export/avis — avis des participants au format CSV
 * (notes seules comprises). Mêmes filtres que le tableau de bord.
 */
export async function GET(request: Request) {
  if (!(await isAdmin())) return fail(401, "Non autorisé.");

  try {
    const filters = parseFilters(new URL(request.url).searchParams);
    const sessions = await fetchSessions(filters);

    const headers = [
      "date_avis",
      "note",
      "commentaire",
      "prenom",
      "quartier",
      "source",
      "score",
      "partie_rejouee",
      "partie",
    ];

    const rows: CsvCell[][] = sessions
      .filter((session) => session.feedback !== null)
      .sort((a, b) =>
        (b.feedback?.created_at ?? "").localeCompare(a.feedback?.created_at ?? ""),
      )
      .map((session) => [
        formatForCsv(session.feedback?.created_at ?? null),
        session.feedback?.rating ?? null,
        session.feedback?.comment ?? null,
        session.first_name,
        session.district,
        session.source,
        session.score,
        session.replay,
        session.id,
      ]);

    return csvResponse(`avis-${today()}.csv`, toCsv(headers, rows));
  } catch (error) {
    console.error("[api/admin/export/avis]", error);
    return fail(500, "Export impossible pour le moment.");
  }
}
