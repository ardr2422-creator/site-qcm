import { ApiError, ok, publicRoute } from "@/lib/server/api";
import {
  PG_FOREIGN_KEY_VIOLATION,
  PG_UNIQUE_VIOLATION,
  getSupabase,
} from "@/lib/server/supabase";
import {
  COMMENT_MAX,
  cleanMultiline,
  cleanRating,
  isUuid,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/feedback — enregistre l'avis de fin de partie.
 * Corps : { sessionId, rating?, comment? } (au moins l'un des deux)
 * Un seul avis par partie.
 */
export const POST = publicRoute(
  { name: "feedback", limitPerMinute: 60 },
  async (body) => {
    if (!isUuid(body.sessionId)) {
      throw new ApiError(400, "Identifiant de partie invalide.");
    }

    if (body.rating != null && cleanRating(body.rating) === null) {
      throw new ApiError(400, "La note doit être comprise entre 1 et 5.");
    }
    if (typeof body.comment === "string" && Array.from(body.comment).length > COMMENT_MAX * 2) {
      throw new ApiError(400, "Commentaire trop long.");
    }

    const rating = cleanRating(body.rating);
    const comment = cleanMultiline(body.comment, COMMENT_MAX);
    if (rating === null && comment === null) {
      throw new ApiError(400, "Avis vide.");
    }

    const { error } = await getSupabase().from("feedback").insert({
      session_id: body.sessionId.toLowerCase(),
      rating,
      comment,
    });

    if (error) {
      if (error.code === PG_UNIQUE_VIOLATION) {
        return ok({ duplicate: true });
      }
      if (error.code === PG_FOREIGN_KEY_VIOLATION) {
        throw new ApiError(404, "Partie inconnue.");
      }
      throw new Error(`Enregistrement de l'avis : ${error.message}`);
    }

    return ok({ duplicate: false }, 201);
  },
);
