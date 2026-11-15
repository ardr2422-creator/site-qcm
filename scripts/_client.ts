import nextEnv from "@next/env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { explainDatabaseError, readSupabaseConfig } from "../lib/supabase-config.ts";

/**
 * Client Supabase pour les scripts en ligne de commande (`npm run seed`,
 * `npm run reset`). Les variables sont lues dans `.env.local`, exactement
 * comme le fait Next.js.
 */

// @next/env est un module CommonJS : import par défaut, puis déstructuration.
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), true, { info: () => undefined, error: console.error });

export function getScriptClient(): SupabaseClient {
  const { config, problems } = readSupabaseConfig();

  if (!config) {
    console.error(
      `\n✗ Réglages Supabase à corriger dans .env.local :\n${problems.map((p) => `  • ${p.message}`).join("\n")}\n`,
    );
    process.exit(1);
  }

  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Hôte de la base, pour rappeler à l'écran sur quel projet on agit. */
export function describeTarget(): string {
  const { config } = readSupabaseConfig();
  return config ? new URL(config.url).host : "(adresse Supabase invalide)";
}

export async function countRows(
  supabase: SupabaseClient,
  table: "sessions" | "answers" | "feedback",
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    const hint =
      explainDatabaseError(error) ??
      "Le schéma supabase/schema.sql a-t-il bien été exécuté ?";
    throw new Error(`Lecture de la table « ${table} » impossible : ${error.message}. ${hint}`);
  }
  return count ?? 0;
}
