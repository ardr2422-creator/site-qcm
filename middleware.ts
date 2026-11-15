import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth";

/**
 * Protège tout l'espace organisateur (/admin et /api/admin) :
 * sans cookie de session valide, on renvoie vers la page de connexion.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const authenticated =
    pathname === "/admin/login" ||
    (await verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value));

  if (!authenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, error: "Non autorisé." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    if (pathname !== "/admin") {
      loginUrl.searchParams.set("next", `${pathname}${search}`);
    }
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
