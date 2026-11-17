"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Logo } from "@/components/brand/Logo";
import { ArrowRight, Button, ButtonLink } from "@/components/ui/Button";
import { PLAYER_NAME_MAX } from "@/lib/live";
import { isGameComplete, startGame, useGame } from "@/lib/client/game";
import { typo } from "@/lib/typo";

type Status =
  | { kind: "loading" }
  | { kind: "open"; title: string; code: string }
  | { kind: "closed"; title: string }
  | { kind: "missing" }
  | { kind: "offline" };

const fieldClasses =
  "mt-2 block w-full rounded-xl border-2 border-nuit-500 bg-white px-4 py-3 text-lg text-nuit-900 " +
  "placeholder:text-nuit-500 focus:border-bleu-700 focus:outline-none focus-visible:outline-3 " +
  "focus-visible:outline-offset-2 focus-visible:outline-ciel-500";

/**
 * Arrivée dans une partie en direct (QR code affiché par l'organisatrice) :
 * on vérifie le code, le joueur saisit son nom, puis le jeu commence.
 */
export function LiveJoin({ code }: { code: string }) {
  const router = useRouter();
  const game = useGame();
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const response = await fetch(`/api/direct/${encodeURIComponent(code)}`, { cache: "no-store" });
        const data = (await response.json()) as { ok: boolean; name?: string; code?: string; open?: boolean };
        if (cancelled) return;
        if (!data.ok || !data.name || !data.code) setStatus({ kind: "missing" });
        else if (!data.open) setStatus({ kind: "closed", title: data.name });
        else setStatus({ kind: "open", title: data.name, code: data.code });
      } catch {
        if (!cancelled) setStatus({ kind: "offline" });
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, [code]);

  // Partie en direct commencée sur ce téléphone et pas encore finie : on propose de la reprendre.
  const unfinished =
    game && game.live && game.live.code === code.toUpperCase() && !isGameComplete(game) ? game : null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status.kind !== "open") return;
    const cleaned = name.trim();
    if (!cleaned) {
      setError("Indiquez votre nom : il s’affichera au classement.");
      return;
    }
    startGame({ firstName: cleaned, district: null }, { code: status.code, title: status.title });
    router.push("/jeu");
  };

  return (
    <section
      aria-labelledby="titre-direct"
      className="carte my-auto animate-fade-up px-6 py-8 text-center sm:px-10 sm:py-10"
    >
      <Logo priority title="" className="mx-auto w-full max-w-[15rem]" />
      <p className="surtitre mt-6">Partie en direct</p>

      {status.kind === "loading" ? (
        <p className="mt-4 font-serif text-xl italic text-nuit-600" role="status">
          Un instant…
        </p>
      ) : null}

      {status.kind === "missing" || status.kind === "closed" || status.kind === "offline" ? (
        <div role="alert">
          <h1 id="titre-direct" className="mt-2 font-serif text-2xl font-semibold leading-tight text-nuit-900">
            {status.kind === "closed"
              ? `« ${typo(status.title)} » est terminée`
              : status.kind === "offline"
                ? "Connexion impossible"
                : "Partie introuvable"}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-lg text-nuit-700">
            {status.kind === "offline"
              ? "Vérifiez votre connexion, puis rechargez la page."
              : status.kind === "closed"
                ? "Les inscriptions à cette partie sont closes. Vous pouvez tout de même jouer en solo."
                : "Ce code ne correspond à aucune partie en cours. Vous pouvez tout de même jouer en solo."}
          </p>
          <div className="mt-6">
            <ButtonLink href="/" variant="secondary" size="md">
              Jouer en solo
            </ButtonLink>
          </div>
        </div>
      ) : null}

      {status.kind === "open" ? (
        <>
          <h1 id="titre-direct" className="mt-2 text-balance font-serif text-3xl font-semibold leading-tight text-nuit-900">
            {typo(status.title)}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-nuit-700">
            Cinq devinettes, et votre score s’affiche sur l’écran de
            l’organisatrice. À égalité, le plus rapide l’emporte !
          </p>

          {unfinished ? (
            <div className="mt-6 rounded-2xl border border-givre-300 bg-givre-100 px-4 py-4">
              <p className="text-nuit-800">
                Partie en cours pour <strong>{unfinished.firstName}</strong>.
              </p>
              <Button size="md" className="mt-3" onClick={() => router.push("/jeu")}>
                Reprendre
              </Button>
            </div>
          ) : null}

          <form onSubmit={submit} className="mt-7 flex flex-col gap-5 text-left" noValidate>
            <div>
              <label htmlFor="nom-joueur" className="text-lg font-semibold text-nuit-900">
                {unfinished ? "Nouveau joueur : votre nom" : "Votre nom"}
              </label>
              <p id="nom-aide" className="text-[0.9375rem] text-nuit-600">
                Il s’affichera sur l’écran de classement.
              </p>
              <input
                id="nom-joueur"
                name="nom"
                type="text"
                autoComplete="name"
                autoCapitalize="words"
                maxLength={PLAYER_NAME_MAX}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError(null);
                }}
                aria-describedby={error ? "nom-aide nom-erreur" : "nom-aide"}
                aria-invalid={error ? true : undefined}
                className={fieldClasses}
              />
              {error ? (
                <p id="nom-erreur" role="alert" className="mt-2 font-medium text-erreur-800">
                  {error}
                </p>
              ) : null}
            </div>
            <Button type="submit" className="w-full">
              Je joue
              <ArrowRight />
            </Button>
          </form>
        </>
      ) : null}
    </section>
  );
}
