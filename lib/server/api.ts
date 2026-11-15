import "server-only";

import { NextResponse } from "next/server";

import { getClientIp, rateLimit } from "./rate-limit";
import { SupabaseConfigError } from "./supabase";

/** Taille maximale acceptée pour le corps d'une requête publique. */
const MAX_BODY_BYTES = 4 * 1024;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function ok<T extends Record<string, unknown>>(
  data?: T,
  status = 200,
): NextResponse {
  return NextResponse.json({ ok: true, ...(data ?? {}) }, { status });
}

export function fail(
  status: number,
  error: string,
  headers?: Record<string, string>,
): NextResponse {
  return NextResponse.json({ ok: false, error }, { status, headers });
}

/** Lit un corps JSON en refusant les charges trop lourdes ou mal formées. */
export async function readJsonBody(
  request: Request,
): Promise<Record<string, unknown>> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) {
    throw new ApiError(413, "Requête trop volumineuse.");
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    throw new ApiError(413, "Requête trop volumineuse.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ApiError(400, "Requête invalide.");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new ApiError(400, "Requête invalide.");
  }
  return parsed as Record<string, unknown>;
}

type RouteOptions = {
  /** Nom court de la route, utilisé comme préfixe de la clé de limitation. */
  name: string;
  /** Nombre maximal de requêtes par minute et par adresse IP. */
  limitPerMinute: number;
};

/**
 * Enveloppe commune aux routes publiques : limitation de débit par IP,
 * lecture du JSON et transformation des erreurs en réponses propres.
 */
export function publicRoute(
  options: RouteOptions,
  handler: (
    body: Record<string, unknown>,
    request: Request,
  ) => Promise<NextResponse>,
): (request: Request) => Promise<NextResponse> {
  return async (request) => {
    try {
      const ip = getClientIp(request.headers);
      const limited = rateLimit(
        `${options.name}:${ip}`,
        options.limitPerMinute,
        60_000,
      );
      if (!limited.ok) {
        throw new ApiError(429, "Trop de requêtes, réessayez dans un instant.", {
          "Retry-After": String(limited.retryAfter),
        });
      }

      const body = await readJsonBody(request);
      return await handler(body, request);
    } catch (error) {
      if (error instanceof ApiError) {
        return fail(error.status, error.message, error.headers);
      }
      if (error instanceof SupabaseConfigError) {
        console.error(`[api/${options.name}] ${error.message}`);
        return fail(503, "Service momentanément indisponible.");
      }
      console.error(`[api/${options.name}]`, error);
      return fail(500, "Erreur interne.");
    }
  };
}

/** Type d'appareil déduit de l'en-tête User-Agent (seule info conservée). */
export function detectDeviceType(userAgent: string | null): "mobile" | "desktop" {
  if (!userAgent) return "mobile";
  return /Mobi|Android|iPhone|iPad|iPod|Tablet|Silk|Kindle|Opera Mini/i.test(
    userAgent,
  )
    ? "mobile"
    : "desktop";
}
