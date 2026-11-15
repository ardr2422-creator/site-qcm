import { ApiError, detectDeviceType, ok, publicRoute } from "@/lib/server/api";
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
 * Corps : { id, firstName?, district?, source?, replay? }
 * Idempotent : renvoyer deux fois la même partie (réessai réseau) ne crée
 * pas de doublon et n'écrase rien.
 */
export const POST = publicRoute(
  { name: "session", limitPerMinute: 120 },
  async (body, request) => {
    if (!isUuid(body.id)) {
      throw new ApiError(400, "Identifiant de partie invalide.");
    }

    const { error } = await getSupabase()
      .from("sessions")
      .upsert(
        {
          id: body.id.toLowerCase(),
          first_name: cleanLine(body.firstName, FIRST_NAME_MAX),
          district: cleanDistrict(body.district),
          source: cleanSource(body.source),
          replay: body.replay === true,
          user_agent_type: detectDeviceType(request.headers.get("user-agent")),
        },
        { onConflict: "id", ignoreDuplicates: true },
      );

    if (error) throw new Error(`Création de la partie : ${error.message}`);

    return ok({}, 201);
  },
);
