"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Asparagus } from "@/components/illustrations/Asparagus";
import { Fig } from "@/components/illustrations/Fig";
import { Ornament, Wave } from "@/components/illustrations/Wave";
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
        <p className="font-serif text-xl italic text-brun-600">
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
        <p
          className="mx-auto mt-4 flex h-36 w-36 flex-col items-center justify-center rounded-full border-2 border-figue-500 bg-figue-50 outline outline-1 outline-offset-4 outline-figue-200"
          aria-label={`Votre score : ${score} sur ${total}`}
        >
          <span className="font-serif text-6xl font-semibold leading-none text-figue-600" aria-hidden="true">
            {score}
            <span className="text-3xl text-figue-500">/{total}</span>
          </span>
        </p>
        <h1
          id="titre-resultat"
          className="mt-6 text-balance font-serif text-3xl font-semibold leading-tight text-brun-900"
        >
          {typo(scoreMessage(score, total))}
        </h1>
        <p className="mt-2 text-brun-700">
          {score === total
            ? "Un sans-faute : les trésors d’Argenteuil n’ont plus de secret pour vous."
            : `Vous avez trouvé ${score} ${score > 1 ? "bonnes réponses" : "bonne réponse"} sur ${total}.`}
        </p>
      </section>

      {/* Récapitulatif */}
      <section aria-labelledby="titre-recap" className="carte px-6 py-8 sm:px-10">
        <h2 id="titre-recap" className="font-serif text-2xl font-semibold text-brun-900">
          Les réponses
        </h2>
        <ol className="mt-4 flex flex-col divide-y divide-creme-300">
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
                  <p className="text-[0.9375rem] leading-snug text-brun-600">
                    <span className="sr-only">Devinette {index + 1} : </span>
                    {typo(question.text)}
                  </p>
                  <p className="mt-1.5 text-lg font-semibold leading-snug text-brun-900">
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
        <h2 id="titre-avis" className="font-serif text-2xl font-semibold text-brun-900">
          Votre avis
        </h2>
        <div className="mt-4">
          <FeedbackForm alreadySent={game.feedbackSent} />
        </div>
      </section>

      {/* Mot de la fin */}
      <section className="px-2 pb-2 pt-2 text-center">
        <Wave className="mx-auto max-w-[12rem]" />
        <p className="mx-auto mt-5 max-w-md text-balance font-serif text-xl italic leading-relaxed text-brun-800">
          {typo(site.closing)}
        </p>
        <div className="mt-5 flex items-end justify-center gap-5" aria-hidden="true">
          <Asparagus className="h-16 w-auto -rotate-6" />
          <Fig className="h-14 w-auto" />
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
