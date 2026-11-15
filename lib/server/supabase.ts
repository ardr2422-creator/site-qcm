import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase réservé au serveur (route handlers, server components).
 * Il utilise la clé « service role » : ce fichier ne doit JAMAIS être importé
 * depuis un composant client (`server-only` fait échouer le build sinon).
 */

export class SupabaseConfigError extends Error {
  constructor() {
    super(
      "Supabase n'est pas configuré : renseignez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
    );
    this.name = "SupabaseConfigError";
  }
}

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new SupabaseConfigError();

  client = createClient(url, key, {
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
