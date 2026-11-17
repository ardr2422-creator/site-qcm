"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { TOTAL_QUESTIONS, questions } from "@/data/questions";
import {
  type Profile,
  answerQuestion,
  isGameComplete,
  startGame,
  useDone,
  useGame,
} from "@/lib/client/game";

import { AlreadyPlayed } from "./AlreadyPlayed";
import { ProfileStep } from "./ProfileStep";
import { QuestionView } from "./QuestionView";

/**
 * Question actuellement à l'écran pour une partie donnée. Tant que le
 * visiteur n'a pas cliqué sur « Question suivante », on reste sur la question
 * à laquelle il vient de répondre (pour afficher la correction et l'anecdote).
 */
type View = { sessionId: string; index: number };

function LoadingCard() {
  return (
    <div
      className="carte my-auto flex min-h-64 items-center justify-center px-6 py-10"
      role="status"
    >
      <p className="font-serif text-xl italic text-nuit-600">
        Le jeu se prépare…
      </p>
    </div>
  );
}

export function GameScreen() {
  const router = useRouter();
  const game = useGame();
  const done = useDone();
  const [view, setView] = useState<View | null>(null);
  // Passe à vrai dès que le visiteur agit sur cette page (démarrage, « suivant »).
  const [interacted, setInteracted] = useState(false);

  if (game === undefined || done === undefined) return <LoadingCard />;

  // Vue épinglée (correction en cours d'affichage), sinon : première question
  // sans réponse de la partie en cours.
  const current: View | null =
    game && view && view.sessionId === game.sessionId
      ? view
      : game && !isGameComplete(game)
        ? { sessionId: game.sessionId, index: game.answers.length }
        : null;

  if (game && current && current.index < TOTAL_QUESTIONS) {
    const question = questions[current.index];

    return (
      <QuestionView
        key={`${game.sessionId}-${question.id}`}
        question={question}
        index={current.index}
        total={TOTAL_QUESTIONS}
        order={game.optionOrder[String(question.id)]}
        answer={game.answers[current.index] ?? null}
        focusOnMount={interacted}
        onAnswer={(optionId) => {
          setView({ sessionId: game.sessionId, index: current.index });
          answerQuestion(question.id, optionId);
        }}
        onNext={() => {
          const nextIndex = current.index + 1;
          if (nextIndex >= TOTAL_QUESTIONS) {
            router.push("/resultat");
          } else {
            setInteracted(true);
            setView({ sessionId: game.sessionId, index: nextIndex });
          }
        }}
      />
    );
  }

  // Le jeu a déjà été terminé sur cet appareil.
  if (done) {
    return (
      <div className="carte my-auto animate-fade-up px-6 py-10 sm:px-10">
        <AlreadyPlayed done={done} lastGame={game} />
      </div>
    );
  }

  return (
    <ProfileStep
      onStart={(profile: Profile) => {
        setInteracted(true);
        startGame(profile);
      }}
    />
  );
}
