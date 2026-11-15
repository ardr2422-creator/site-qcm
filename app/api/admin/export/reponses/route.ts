import { getOption, getQuestion } from "@/data/questions";
import { csvResponse, toCsv, type CsvCell } from "@/lib/csv";
import { formatForCsv, today } from "@/lib/dates";
import { parseFilters } from "@/lib/filters";
import { isAdmin } from "@/lib/server/admin-auth";
import { fail } from "@/lib/server/api";
import { fetchSessions } from "@/lib/server/admin-data";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/export/reponses — réponses brutes au format CSV.
 * Une ligne par réponse, avec les informations de la partie. Les mêmes
 * filtres que le tableau de bord s'appliquent (paramètres d'URL).
 */
export async function GET(request: Request) {
  if (!(await isAdmin())) return fail(401, "Non autorisé.");

  try {
    const filters = parseFilters(new URL(request.url).searchParams);
    const sessions = await fetchSessions(filters);

    const headers = [
      "partie",
      "date_partie",
      "source",
      "quartier",
      "prenom",
      "appareil",
      "partie_rejouee",
      "partie_terminee",
      "score",
      "question",
      "enonce",
      "reponse_id",
      "reponse",
      "correcte",
      "date_reponse",
    ];

    const rows: CsvCell[][] = [];
    for (const session of sessions) {
      for (const answer of session.answers) {
        const question = getQuestion(answer.question_id);
        const option = question
          ? getOption(question, answer.selected_option)
          : undefined;
        rows.push([
          session.id,
          formatForCsv(session.created_at),
          session.source,
          session.district,
          session.first_name,
          session.user_agent_type,
          session.replay,
          session.completed_at !== null,
          session.score,
          answer.question_id,
          question?.text ?? "",
          answer.selected_option,
          option?.label ?? "",
          answer.is_correct,
          formatForCsv(answer.answered_at),
        ]);
      }
    }

    return csvResponse(`reponses-${today()}.csv`, toCsv(headers, rows));
  } catch (error) {
    console.error("[api/admin/export/reponses]", error);
    return fail(500, "Export impossible pour le moment.");
  }
}
