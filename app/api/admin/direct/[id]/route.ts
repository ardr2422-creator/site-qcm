import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/server/admin-auth";
import { fail } from "@/lib/server/api";
import { getLiveBoard } from "@/lib/server/live";
import { isUuid } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET /api/admin/direct/[id] — classement en temps réel (organisatrice uniquement). */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return fail(401, "Non autorisé.");
  const { id } = await context.params;
  if (!isUuid(id)) return fail(404, "Partie introuvable.");

  try {
    const board = await getLiveBoard(id);
    if (!board) return fail(404, "Partie introuvable.");
    return NextResponse.json({ ok: true, ...board }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[api/admin/direct]", error);
    return fail(500, "Classement indisponible pour le moment.");
  }
}
