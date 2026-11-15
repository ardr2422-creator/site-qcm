import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/LoginForm";
import { site } from "@/data/site";
import { safeAdminRedirect } from "@/lib/auth";
import { isAdmin } from "@/lib/server/admin-auth";
import { typo } from "@/lib/typo";

export const metadata: Metadata = {
  title: "Connexion organisateur",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = safeAdminRedirect(rawNext);

  if (await isAdmin()) redirect(next);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="carte px-7 py-9">
          <p className="surtitre">Espace organisateur</p>
          <h1 className="mt-2 font-serif text-2xl font-semibold leading-tight text-brun-900">
            {typo(site.title)}
          </h1>
          <p className="mt-2 text-[0.9375rem] text-brun-700">
            Statistiques, avis des participants et QR codes du jeu.
          </p>
          <LoginForm next={next} />
        </div>
        <p className="mt-5 text-center text-sm">
          <Link
            href="/"
            className="text-brun-700 underline decoration-brun-400 underline-offset-4 hover:text-figue-600"
          >
            ← Retour au jeu
          </Link>
        </p>
      </div>
    </main>
  );
}
