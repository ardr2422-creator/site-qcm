/**
 * Lecture et vérification des réglages Supabase (variables d'environnement).
 *
 * Ces réglages sont souvent copiés-collés à la main depuis le tableau de bord
 * de Supabase vers celui de Vercel. Ce module corrige ce qui peut l'être sans
 * risque (espaces, guillemets, adresse de la page du tableau de bord collée à
 * la place de l'adresse du projet…) et explique clairement le reste.
 *
 * Aucune dépendance au serveur : utilisé aussi par les scripts seed / reset.
 */

export type SupabaseConfig = { url: string; key: string };

export type ConfigProblem = {
  variable: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY";
  message: string;
};

type Env = Record<string, string | undefined>;

/** Retire espaces, retours à la ligne et guillemets ajoutés par un copier-coller. */
function clean(raw: string | undefined): string {
  return (raw ?? "")
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();
}

const looksLikeKey = (value: string) => /^(sb_(secret|publishable)_|eyJ)/.test(value);

/**
 * Adresse du projet. Accepte aussi, et convertit :
 *  - l'adresse de la page du tableau de bord (supabase.com/dashboard/project/abcd…) ;
 *  - l'identifiant seul du projet (abcd…) ;
 *  - une adresse sans « https:// » ou terminée par /rest/v1.
 */
function normalizeUrl(value: string): string | null {
  const dashboard = value.match(/supabase\.com\/dashboard\/project\/([a-z0-9]{10,40})/i);
  if (dashboard) return `https://${dashboard[1].toLowerCase()}.supabase.co`;
  if (/^[a-z0-9]{15,40}$/i.test(value)) return `https://${value.toLowerCase()}.supabase.co`;

  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Rôle inscrit dans une ancienne clé Supabase (format JWT « eyJ… »). */
function jwtRole(key: string): string | null {
  const parts = key.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const role = (JSON.parse(json) as { role?: unknown }).role;
    return typeof role === "string" ? role : null;
  } catch {
    return null;
  }
}

export function readSupabaseConfig(env: Env = process.env): {
  config: SupabaseConfig | null;
  problems: ConfigProblem[];
} {
  const rawUrl = clean(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL);
  // Une clé copiée sur deux lignes : on recolle les morceaux.
  const rawKey = clean(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY)
    .replace(/^Bearer\s+/i, "")
    .replace(/\s+/g, "");

  const problems: ConfigProblem[] = [];

  // Les deux valeurs collées à l'envers.
  if (looksLikeKey(rawUrl) && rawKey && !looksLikeKey(rawKey)) {
    return {
      config: null,
      problems: [
        {
          variable: "SUPABASE_URL",
          message:
            "Les deux valeurs semblent inversées : SUPABASE_URL contient une clé, et SUPABASE_SERVICE_ROLE_KEY une adresse. Échangez-les.",
        },
      ],
    };
  }

  let url: string | null = null;
  if (!rawUrl) {
    problems.push({
      variable: "SUPABASE_URL",
      message:
        "SUPABASE_URL est vide. Indiquez l’adresse du projet Supabase (elle se termine par .supabase.co).",
    });
  } else if (looksLikeKey(rawUrl)) {
    problems.push({
      variable: "SUPABASE_URL",
      message:
        "SUPABASE_URL contient une clé au lieu d’une adresse. Indiquez l’adresse du projet (elle se termine par .supabase.co).",
    });
  } else {
    url = normalizeUrl(rawUrl);
    if (!url) {
      problems.push({
        variable: "SUPABASE_URL",
        message: `SUPABASE_URL n’est pas une adresse valide (« ${rawUrl.slice(0, 60)} »). Elle doit ressembler à https://abcdefgh.supabase.co.`,
      });
    }
  }

  if (!rawKey) {
    problems.push({
      variable: "SUPABASE_SERVICE_ROLE_KEY",
      message:
        "SUPABASE_SERVICE_ROLE_KEY est vide. Indiquez la clé secrète du projet (elle commence par sb_secret_).",
    });
  } else if (rawKey.startsWith("sb_publishable_")) {
    problems.push({
      variable: "SUPABASE_SERVICE_ROLE_KEY",
      message:
        "SUPABASE_SERVICE_ROLE_KEY contient la clé publique (sb_publishable_…). Il faut la clé secrète, qui commence par sb_secret_.",
    });
  } else if (jwtRole(rawKey) === "anon") {
    problems.push({
      variable: "SUPABASE_SERVICE_ROLE_KEY",
      message:
        "SUPABASE_SERVICE_ROLE_KEY contient la clé « anon ». Il faut la clé secrète (sb_secret_…) ou, dans l’onglet des anciennes clés, la clé « service_role ».",
    });
  } else if (/^https?:\/\//i.test(rawKey) || rawKey.includes(".supabase.co")) {
    problems.push({
      variable: "SUPABASE_SERVICE_ROLE_KEY",
      message:
        "SUPABASE_SERVICE_ROLE_KEY contient une adresse au lieu d’une clé. Indiquez la clé secrète (elle commence par sb_secret_).",
    });
  }

  if (problems.length > 0 || !url) return { config: null, problems };
  return { config: { url, key: rawKey }, problems };
}

/**
 * Traduit une erreur renvoyée par Supabase en explication compréhensible.
 * Renvoie `null` si l'erreur n'est pas reconnue.
 */
export function explainDatabaseError(error: unknown): string | null {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  const message = error instanceof Error ? error.message : String(error ?? "");

  if (code === "42703" || /column .* does not exist|Could not find the '.*' column/i.test(message)) {
    return "La base n’est pas à jour : ouvrez « SQL Editor » dans Supabase, collez à nouveau tout le fichier supabase/schema.sql et cliquez sur « Run » (sans risque pour les données).";
  }
  if (code === "PGRST205" || code === "42P01" || /schema cache|does not exist/i.test(message)) {
    return "Les tables du jeu n’existent pas encore dans Supabase : ouvrez « SQL Editor », collez le contenu du fichier supabase/schema.sql et cliquez sur « Run ».";
  }
  if (/invalid api key|no api key|jwt|unauthorized/i.test(message)) {
    return "Supabase refuse la clé : SUPABASE_SERVICE_ROLE_KEY n’est pas la bonne (ou appartient à un autre projet). Recopiez la clé secrète du projet (sb_secret_…).";
  }
  if (code === "42501" || /permission denied/i.test(message)) {
    return "Supabase refuse l’accès : SUPABASE_SERVICE_ROLE_KEY est une clé publique. Il faut la clé secrète (sb_secret_…).";
  }
  if (/fetch failed|ENOTFOUND|getaddrinfo|ECONNREFUSED|network/i.test(message)) {
    return "Impossible de joindre Supabase : vérifiez SUPABASE_URL (elle doit ressembler à https://abcdefgh.supabase.co) et que le projet n’est pas en pause.";
  }
  return null;
}
