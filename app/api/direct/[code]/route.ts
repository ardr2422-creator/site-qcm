import { NextResponse } from "next/server";

import { normalizeLiveCode } from "@/lib/live";
import { getLiveGameByCode } from "@/lib/server/live";
import { getClientIp, rateLimit } from "@/lib/server/rate-limit";
import { SupabaseConfigError } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/direct/[code] — vérifie qu'une partie en direct existe et est
 * ouverte, avant que le participant ne saisisse son nom. Ne renvoie que le nom
 * de la partie (rien sur les participants).
 */
export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const headers = { "Cache-Control": "no-store" };
  const limited = rateLimit(`direct:${getClientIp(request.headers)}`, 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Trop de requêtes, réessayez dans un instant." },
      { status: 429, headers: { ...headers, "Retry-After": String(limited.retryAfter) } },
    );
  }

  const { code } = await context.params;
  if (!normalizeLiveCode(code)) {
    return NextResponse.json({ ok: false, error: "Code invalide." }, { status: 404, headers });
  }

  try {
    const game = await getLiveGameByCode(code);
    if (!game) {
      return NextResponse.json({ ok: false, error: "Partie introuvable." }, { status: 404, headers });
    }
    return NextResponse.json(
      { ok: true, name: game.name, code: game.code, open: game.closed_at === null },
      { headers },
    );
  } catch (error) {
    console.error("[api/direct]", error);
    const status = error instanceof SupabaseConfigError ? 503 : 500;
    return NextResponse.json({ ok: false, error: "Service momentanément indisponible." }, { status, headers });
  }
}
