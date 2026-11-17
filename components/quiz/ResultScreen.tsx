"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  FrostFrieze,
  FrostStar,
  Ornament,
  Snowflake,
} from "@/components/illustrations/Winter";
import { Button, ButtonLink } from "@/components/ui/Button";
import {
  TOTAL_QUESTIONS,
  getCorrectOption,
  getOption,
  questions,
} from "@/data/questions";
import { scoreMessage, site } from "@/data/site";
import { gameScore, isGameComplete, startGame, useGame } from "@/lib/client/game";
import { typo } from "@/lib/typo";

import { FeedbackForm } from "./FeedbackForm";

export function ResultScreen() {
  const router = useRouter();
  const game = useGame();

  const ready = game !== undefined;
  const complete = game ? isGameComplete(game) : false;

  // Pas de partie terminée sur cet appareil : retour au jeu.
  useEffect(() => {
    if (ready && !complete) router.replace("/jeu");
  }, [ready, complete, router]);

  if (!game || !complete) {
    return (
      <div className="carte my-auto flex min-h-64 items-center justify-center px-6 py-10" role="status">
        <p className="font-serif text-xl italic text-nuit-600">
          Un instant…
        </p>
      </div>
    );
  }

  const score = gameScore(game);
  const total = TOTAL_QUESTIONS;

  const replay = () => {
    startGame({ firstName: game.firstName, district: game.district });
    router.push("/jeu");
  };

  // Partie en direct : écran de fin court. Pas de récapitulatif des bonnes
  // réponses (les autres joueurs sont peut-être encore en train de jouer),
  // pas d'avis.
  if (game.live) {
    return (
      <section
        aria-labelledby="titre-resultat"
        className="carte my-auto animate-fade-up px-6 pb-8 pt-9 text-center sm:px-10"
      >
        <p className="surtitre">{typo(game.live.title)}</p>
        <h1
          id="titre-resultat"
          className="mt-3 text-balance font-serif text-3xl font-semibold leading-tight text-nuit-900"
        >
          {game.firstName ? `Bravo ${game.firstName} !` : "Bravo !"}
        </h1>
        <div
          role="img"
          aria-label={`Votre score : ${score} sur ${total}`}
          className="mx-auto mt-6 flex h-36 w-36 flex-col items-center justify-center rounded-full border-2 border-ciel-500 bg-ciel-50 outline outline-1 outline-offset-4 outline-ciel-200"
        >
          <span className="font-serif text-6xl font-semibold leading-none text-ciel-600" aria-hidden="true">
            {score}
            <span className="text-3xl text-ciel-500">/{total}</span>
          </span>
        </div>
        <p className="mx-auto mt-6 max-w-sm text-lg text-nuit-700">
          Votre résultat est enregistré. Regardez l’écran de
          l’organisatrice pour découvrir le classement !
        </p>
        <FrostFrieze count={5} className="mx-auto mt-7 w-full max-w-[12rem]" />
      </section>
    );
  }

  return (
    <div className="flex animate-fade-up flex-col gap-6">
      {/* Score */}
      <section
        aria-labelledby="titre-resultat"
        className="carte px-6 pb-8 pt-9 text-center sm:px-10"
      >
        <p className="surtitre">
          {game.firstName ? `Bravo ${game.firstName} !` : "Votre résultat"}
        </p>
        <div
          role="img"
          aria-label={`Votre score : ${score} sur ${total}`}
          className="mx-auto mt-4 flex h-36 w-36 flex-col items-center justify-center rounded-full border-2 border-ciel-500 bg-ciel-50 outline outline-1 outline-offset-4 outline-ciel-200"
        >
          <span className="font-serif text-6xl font-semibold leading-none text-ciel-600" aria-hidden="true">
            {score}
            <span className="text-3xl text-ciel-500">/{total}</span>
          </span>
        </div>
        <h1
          id="titre-resultat"
          className="mt-6 text-balance font-serif text-3xl font-semibold leading-tight text-nuit-900"
        >
          {typo(scoreMessage(score, total))}
        </h1>
        <p className="mt-2 text-nuit-700">
          {score === total
            ? "Un sans-faute : les trésors d’Argenteuil n’ont plus de secret pour vous."
            : `Vous avez trouvé ${score} ${score > 1 ? "bonnes réponses" : "bonne réponse"} sur ${total}.`}
        </p>
      </section>

      {/* Récapitulatif */}
      <section aria-labelledby="titre-recap" className="carte px-6 py-8 sm:px-10">
        <h2 id="titre-recap" className="font-serif text-2xl font-semibold text-nuit-900">
          Les réponses
        </h2>
        <ol className="mt-4 flex flex-col divide-y divide-givre-300">
          {questions.map((question, index) => {
            const answer = game.answers[index];
            const correct = getCorrectOption(question);
            const picked = answer ? getOption(question, answer.optionId) : undefined;
            const isRight = answer?.correct ?? false;

            return (
              <li key={question.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-serif text-lg font-semibold ${
                    isRight
                      ? "bg-succes-100 text-succes-800"
                      : "bg-erreur-100 text-erreur-800"
                  }`}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] leading-snug text-nuit-600">
                    <span className="sr-only">Devinette {index + 1} : </span>
                    {typo(question.text)}
                  </p>
                  <p className="mt-1.5 text-lg font-semibold leading-snug text-nuit-900">
                    {typo(correct.label)}
                  </p>
                  <p
                    className={`mt-0.5 text-[0.9375rem] font-medium ${
                      isRight ? "text-succes-800" : "text-erreur-800"
                    }`}
                  >
                    {isRight
                      ? "✓ Vous aviez trouvé"
                      : `✗ Votre réponse : ${picked ? typo(picked.label) : "—"}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Avis */}
      <section aria-labelledby="titre-avis" className="carte px-6 py-8 sm:px-10">
        <h2 id="titre-avis" className="font-serif text-2xl font-semibold text-nuit-900">
          Votre avis
        </h2>
        <div className="mt-4">
          <FeedbackForm alreadySent={game.feedbackSent} />
        </div>
      </section>

      {/* Mot de la fin */}
      <section className="rounded-3xl bg-givre-100/85 px-2 pb-3 pt-3 text-center">
        <FrostFrieze count={5} className="mx-auto w-full max-w-[12rem]" />
        <p className="mx-auto mt-5 max-w-md text-balance font-serif text-xl italic leading-relaxed text-nuit-800">
          {typo(site.closing)}
        </p>
        <div className="mt-5 flex items-end justify-center gap-5" aria-hidden="true">
          <Snowflake className="h-14 w-auto" />
          <FrostStar className="h-11 w-auto" />
        </div>
        <Ornament className="mx-auto mt-6 h-3 w-28" />
        <div className="mt-5 flex flex-col items-center gap-2">
          <Button variant="quiet" size="md" onClick={replay}>
            Rejouer pour le plaisir
          </Button>
          <ButtonLink href="/" variant="quiet" size="md">
            Retour à l’accueil
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
