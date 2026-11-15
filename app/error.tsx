"use client";

import { useEffect } from "react";

import { Button, ButtonLink } from "@/components/ui/Button";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Filet de sécurité : une erreur inattendue ne laisse jamais un écran blanc. */
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 py-10">
      <div className="carte px-6 py-10 text-center sm:px-10" role="alert">
        <p className="surtitre">Petit contretemps</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-brun-900">
          Quelque chose s’est mal passé
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-lg text-brun-700">
          Rien n’est perdu : vos réponses sont gardées sur cet appareil.
          Réessayez dans un instant.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3">
          <Button onClick={reset}>Réessayer</Button>
          <ButtonLink href="/" variant="quiet" size="md">
            Retour à l’accueil
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
