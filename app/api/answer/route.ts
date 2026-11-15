import { getCorrectOption, getOption, getQuestion } from "@/data/questions";
import { ApiError, ok, publicRoute } from "@/lib/server/api";
import {
  PG_FOREIGN_KEY_VIOLATION,
  PG_UNIQUE_VIOLATION,
  getSupabase,
} from "@/lib/server/supabase";
import { isUuid } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/answer — enregistre une réponse, dès le clic.
 * Corps : { sessionId, questionId, optionId }
 *
 * - la question et la réponse doivent exister dans data/questions.ts ;
 * - `is_correct` est calculé ici, jamais fourni par le client ;
 * - une seule réponse par question et par partie (contrainte unique en base).
 */
export const POST = publicRoute(
  { name: "answer", limitPerMinute: 600 },
  async (body) => {
    if (!isUuid(body.sessionId)) {
      throw new ApiError(400, "Identifiant de partie invalide.");
    }
    if (typeof body.questionId !== "number" || typeof body.optionId !== "string") {
      throw new ApiError(400, "Réponse invalide.");
    }

    const question = getQuestion(body.questionId);
    if (!question) throw new ApiError(400, "Question inconnue.");

    const option = getOption(question, body.optionId);
    if (!option) throw new ApiError(400, "Réponse inconnue pour cette question.");

    const isCorrect = getCorrectOption(question).id === option.id;

    const { error } = await getSupabase().from("answers").insert({
      session_id: body.sessionId.toLowerCase(),
      question_id: question.id,
      selected_option: option.id,
      is_correct: isCorrect,
    });

    if (error) {
      if (error.code === PG_UNIQUE_VIOLATION) {
        // Déjà répondu (double clic, réessai réseau…) : la première réponse fait foi.
        return ok({ duplicate: true });
      }
      if (error.code === PG_FOREIGN_KEY_VIOLATION) {
        throw new ApiError(404, "Partie inconnue.");
      }
      throw new Error(`Enregistrement de la réponse : ${error.message}`);
    }

    return ok({ duplicate: false }, 201);
  },
);
