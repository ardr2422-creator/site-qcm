"use client";

import { useEffect } from "react";

import { Button, buttonClasses } from "@/components/ui/Button";

type Props = {
  error: Error & { digest?: string };
};

/** Filet de sécurité : une erreur inattendue ne laisse jamais un écran blanc. */
export default function GlobalError({ error }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // Un rechargement complet plutôt qu'un simple nouvel essai : la partie est
  // gardée sur l'appareil, et cela répare aussi le cas d'une page restée
  // ouverte pendant une mise à jour du site.
  const retry = () => window.location.reload();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 py-10">
      <div className="carte px-6 py-10 text-center sm:px-10" role="alert">
        <p className="surtitre">Petit contretemps</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-nuit-900">
          Quelque chose s’est mal passé
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-lg text-nuit-700">
          Rien n’est perdu : vos réponses sont gardées sur cet appareil.
          Réessayez dans un instant.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3">
          <Button onClick={retry}>Réessayer</Button>
          {/* Lien classique (rechargement complet), volontairement sans <Link>. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className={buttonClasses("quiet", "md")}>
            Retour à l’accueil
          </a>
        </div>
      </div>
    </main>
  );
}
