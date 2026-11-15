import type { Metadata } from "next";

import { Bridge } from "@/components/illustrations/Bridge";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 py-10">
      <div className="carte px-6 py-10 text-center sm:px-10">
        <Bridge className="mx-auto w-full max-w-[14rem]" />
        <p className="surtitre mt-6">Erreur 404</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-brun-900">
          Ce chemin ne mène nulle part
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-lg text-brun-700">
          La page demandée n’existe pas. Le jeu, lui, vous attend juste à côté.
        </p>
        <div className="mt-7">
          <ButtonLink href="/">Retour au jeu</ButtonLink>
        </div>
      </div>
    </main>
  );
}
