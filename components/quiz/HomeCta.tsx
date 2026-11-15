"use client";

import { TOTAL_QUESTIONS } from "@/data/questions";
import { site } from "@/data/site";
import { ArrowRight, ButtonLink } from "@/components/ui/Button";
import { isGameComplete, useDone, useGame } from "@/lib/client/game";

import { AlreadyPlayed } from "./AlreadyPlayed";

/**
 * Bouton principal de l'accueil. Il s'adapte à ce que l'appareil sait déjà :
 * première visite, partie en cours, ou jeu déjà terminé.
 * (Avant l'hydratation, on affiche le bouton par défaut : un simple lien.)
 */
export function HomeCta() {
  const game = useGame();
  const done = useDone();

  const inProgress = game && !isGameComplete(game);

  if (done && !inProgress) {
    return (
      <div className="animate-fade-in">
        <AlreadyPlayed done={done} lastGame={game ?? null} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <ButtonLink href="/jeu" className="w-full sm:w-auto sm:min-w-72">
        {inProgress ? "Reprendre le jeu" : "Commencer le jeu"}
        <ArrowRight />
      </ButtonLink>
      <p className="text-sm text-brun-600">
        {inProgress
          ? `Vous en étiez à la devinette ${Math.min(game.answers.length + 1, TOTAL_QUESTIONS)} sur ${TOTAL_QUESTIONS}`
          : site.mention}
      </p>
    </div>
  );
}
