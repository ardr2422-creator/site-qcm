import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { readSupabaseConfig, type ConfigProblem } from "@/lib/supabase-config";

/**
 * Client Supabase réservé au serveur (route handlers, server components).
 * Il utilise la clé « service role » : ce fichier ne doit JAMAIS être importé
 * depuis un composant client (`server-only` fait échouer le build sinon).
 */

export class SupabaseConfigError extends Error {
  constructor(public readonly problems: ConfigProblem[]) {
    super(
      `Supabase n'est pas configuré : ${problems.map((p) => p.message).join(" ")}`,
    );
    this.name = "SupabaseConfigError";
  }
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const { config, problems } = readSupabaseConfig();
  if (!config) throw new SupabaseConfigError(problems);

  client = createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return client;
}

/** Codes d'erreur Postgres utiles aux routes API. */
export const PG_UNIQUE_VIOLATION = "23505";
export const PG_FOREIGN_KEY_VIOLATION = "23503";
