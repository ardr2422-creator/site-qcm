"use client";

import { useRouter } from "next/navigation";

import { Button, ButtonLink } from "@/components/ui/Button";
import {
  type DoneRecord,
  type LocalGame,
  isGameComplete,
  startGame,
} from "@/lib/client/game";

type Props = {
  done: DoneRecord;
  /** Dernière partie connue sur cet appareil (pour reprendre prénom et quartier). */
  lastGame: LocalGame | null;
};

/** « Vous avez déjà participé, merci ! » — avec le score et le lien pour rejouer. */
export function AlreadyPlayed({ done, lastGame }: Props) {
  const router = useRouter();

  const replay = () => {
    // La partie est marquée « rejouée » automatiquement (voir startGame).
    startGame({
      firstName: lastGame?.firstName ?? null,
      district: lastGame?.district ?? null,
    });
    router.push("/jeu");
  };

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div>
        <p className="font-serif text-2xl font-semibold text-brun-900">
          Vous avez déjà participé, merci !
        </p>
        <p className="mt-2 text-lg text-brun-700">
          Votre score :{" "}
          <strong className="font-serif text-2xl font-semibold text-figue-600">
            {done.score}/{done.total}
          </strong>
        </p>
      </div>

      {lastGame && isGameComplete(lastGame) ? (
        <ButtonLink href="/resultat" variant="secondary" className="w-full sm:w-auto">
          Revoir mon résultat
        </ButtonLink>
      ) : null}

      <Button variant="quiet" size="md" onClick={replay}>
        Rejouer pour le plaisir
      </Button>
    </div>
  );
}
