import { TOTAL_QUESTIONS, isCorrectAnswer, questions } from "@/data/questions";
import { ApiError, ok, publicRoute } from "@/lib/server/api";
import { getSupabase } from "@/lib/server/supabase";
import { isUuid } from "@/lib/validation";

export const dynamic = "force-dynamic";

type SessionRow = { id: string; completed_at: string | null; score: number | null };
type AnswerRow = { question_id: number; selected_option: string };

/**
 * POST /api/complete — termine la partie.
 * Corps : { sessionId }
 *
 * Le score est recalculé ici à partir des réponses enregistrées en base :
 * rien de ce que le client pourrait envoyer n'est pris en compte.
 */
export const POST = publicRoute(
  { name: "complete", limitPerMinute: 120 },
  async (body) => {
    if (!isUuid(body.sessionId)) {
      throw new ApiError(400, "Identifiant de partie invalide.");
    }
    const sessionId = body.sessionId.toLowerCase();
    const supabase = getSupabase();

    const sessionResult = await supabase
      .from("sessions")
      .select("id, completed_at, score")
      .eq("id", sessionId)
      .maybeSingle();
    if (sessionResult.error) {
      throw new Error(`Lecture de la partie : ${sessionResult.error.message}`);
    }
    const session = sessionResult.data as SessionRow | null;
    if (!session) throw new ApiError(404, "Partie inconnue.");

    // Déjà terminée (réessai réseau) : on renvoie le score déjà enregistré.
    if (session.completed_at && session.score !== null) {
      return ok({ score: session.score, total: TOTAL_QUESTIONS });
    }

    const answersResult = await supabase
      .from("answers")
      .select("question_id, selected_option")
      .eq("session_id", sessionId);
    if (answersResult.error) {
      throw new Error(`Lecture des réponses : ${answersResult.error.message}`);
    }
    const answers = (answersResult.data ?? []) as AnswerRow[];

    const answered = new Map(answers.map((a) => [a.question_id, a.selected_option]));
    const missing = questions.filter((q) => !answered.has(q.id));
    if (missing.length > 0) {
      throw new ApiError(409, "La partie n'est pas terminée.");
    }

    const score = questions.reduce(
      (total, q) =>
        total + (isCorrectAnswer(q.id, answered.get(q.id) as string) ? 1 : 0),
      0,
    );

    const update = await supabase
      .from("sessions")
      .update({ completed_at: new Date().toISOString(), score })
      .eq("id", sessionId)
      .is("completed_at", null);
    if (update.error) {
      throw new Error(`Clôture de la partie : ${update.error.message}`);
    }

    return ok({ score, total: TOTAL_QUESTIONS });
  },
);
