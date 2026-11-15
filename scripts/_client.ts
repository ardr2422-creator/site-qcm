import { loadEnvConfig } from "@next/env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase pour les scripts en ligne de commande (`npm run seed`,
 * `npm run reset`). Les variables sont lues dans `.env.local`, exactement
 * comme le fait Next.js.
 */

loadEnvConfig(process.cwd(), true, { info: () => undefined, error: console.error });

export function getScriptClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "\n✗ Variables manquantes : renseignez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local\n",
    );
    process.exit(1);
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Hôte de la base, pour rappeler à l'écran sur quel projet on agit. */
export function describeTarget(): string {
  try {
    return new URL(process.env.SUPABASE_URL ?? "").host;
  } catch {
    return "(adresse Supabase invalide)";
  }
}

export async function countRows(
  supabase: SupabaseClient,
  table: "sessions" | "answers" | "feedback",
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    throw new Error(
      `Lecture de la table « ${table} » impossible : ${error.message}. ` +
        "Le schéma supabase/schema.sql a-t-il bien été exécuté ?",
    );
  }
  return count ?? 0;
}
