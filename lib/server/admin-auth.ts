import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth";

/** Vrai si la requête en cours porte un cookie de session organisateur valide. */
export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifyAdminToken(jar.get(ADMIN_COOKIE)?.value);
}

/**
 * À appeler en tête des pages de l'espace organisateur. Le middleware filtre
 * déjà les accès ; cette seconde vérification évite qu'une erreur de
 * configuration du middleware n'expose les données.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
