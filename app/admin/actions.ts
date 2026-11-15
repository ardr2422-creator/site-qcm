"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminToken,
  getAdminPassword,
  passwordMatches,
  safeAdminRedirect,
} from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/server/rate-limit";

export type LoginState = { error: string | null };

/** Connexion à l'espace organisateur. */
export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const ip = getClientIp(await headers());
  const limited = rateLimit(`admin-login:${ip}`, 8, 5 * 60_000);
  if (!limited.ok) {
    const minutes = Math.ceil(limited.retryAfter / 60);
    return {
      error: `Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.`,
    };
  }

  if (!getAdminPassword()) {
    return {
      error:
        "L’espace organisateur n’est pas configuré : la variable ADMIN_PASSWORD est manquante.",
    };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || !(await passwordMatches(password))) {
    return { error: "Mot de passe incorrect." };
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, await createAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  const next = formData.get("next");
  redirect(safeAdminRedirect(typeof next === "string" ? next : null));
}

/** Déconnexion. */
export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
