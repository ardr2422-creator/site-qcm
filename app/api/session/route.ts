import { ApiError, detectDeviceType, ok, publicRoute } from "@/lib/server/api";
import { PLAYER_NAME_MAX } from "@/lib/live";
import { getLiveGameByCode } from "@/lib/server/live";
import { getSupabase } from "@/lib/server/supabase";
import {
  FIRST_NAME_MAX,
  cleanDistrict,
  cleanLine,
  cleanSource,
  isUuid,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/session — crée la partie.
 * Corps : { id, firstName?, district?, source?, replay?, liveCode? }
 * Idempotent : renvoyer deux fois la même partie (réessai réseau) ne crée
 * pas de doublon et n'écrase rien.
 *
 * Avec `liveCode`, la partie est rattachée à une partie en direct ouverte :
 * le nom est alors obligatoire (il s'affiche au classement) et la partie est
 * exclue des statistiques.
 */
export const POST = publicRoute(
  { name: "session", limitPerMinute: 120 },
  async (body, request) => {
    if (!isUuid(body.id)) {
      throw new ApiError(400, "Identifiant de partie invalide.");
    }

    let liveGameId: string | null = null;
    if (body.liveCode !== undefined && body.liveCode !== null) {
      const live = await getLiveGameByCode(body.liveCode);
      if (!live || live.closed_at) {
        throw new ApiError(404, "Partie en direct introuvable ou terminée.");
      }
      if (!cleanLine(body.firstName, PLAYER_NAME_MAX)) {
        throw new ApiError(400, "Le nom est obligatoire pour une partie en direct.");
      }
      liveGameId = live.id;
    }

    const { error } = await getSupabase()
      .from("sessions")
      .upsert(
        {
          id: body.id.toLowerCase(),
          first_name: cleanLine(body.firstName, liveGameId ? PLAYER_NAME_MAX : FIRST_NAME_MAX),
          district: liveGameId ? null : cleanDistrict(body.district),
          source: liveGameId ? "direct" : cleanSource(body.source),
          replay: liveGameId ? false : body.replay === true,
          user_agent_type: detectDeviceType(request.headers.get("user-agent")),
          ...(liveGameId ? { live_game_id: liveGameId } : {}),
        },
        { onConflict: "id", ignoreDuplicates: true },
      );

    if (error) throw new Error(`Création de la partie : ${error.message}`);

    return ok({}, 201);
  },
);
