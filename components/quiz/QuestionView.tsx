"use client";

import { useEffect, useRef } from "react";

import { ArrowRight, Button } from "@/components/ui/Button";
import {
  type QuizQuestion,
  getCorrectOption,
  getOption,
} from "@/data/questions";
import type { LocalAnswer } from "@/lib/client/game";
import { typo } from "@/lib/typo";

import { Progress } from "./Progress";

type Props = {
  question: QuizQuestion;
  /** Position de la question dans le jeu (à partir de 0). */
  index: number;
  total: number;
  /** Identifiants des réponses, dans l'ordre mélangé pour cette partie. */
  order: string[];
  /** Réponse déjà donnée à cette question, le cas échéant. */
  answer: LocalAnswer | null;
  /** Vrai si l'on arrive ici après une action du visiteur (et non au chargement). */
  focusOnMount: boolean;
  onAnswer: (optionId: string) => void;
  onNext: () => void;
};

type OptionState = "idle" | "correct" | "wrong" | "muted";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

const optionClasses: Record<OptionState, string> = {
  idle:
    "border-nuit-500 bg-givre-50 text-nuit-900 hover:border-bleu-700 hover:bg-glace-50 active:bg-glace-100",
  correct: "border-succes-600 bg-succes-100 text-succes-800",
  wrong: "border-erreur-600 bg-erreur-100 text-erreur-800",
  muted: "border-givre-300 bg-givre-50 text-nuit-600",
};

const badgeClasses: Record<OptionState, string> = {
  idle: "border-nuit-500 bg-white text-nuit-700",
  correct: "border-succes-600 bg-succes-600 text-white",
  wrong: "border-erreur-600 bg-erreur-600 text-white",
  muted: "border-givre-400 bg-givre-100 text-nuit-600",
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />
    </svg>
  );
}

export function QuestionView({
  question,
  index,
  total,
  order,
  answer,
  focusOnMount,
  onAnswer,
  onNext,
}: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const correctOption = getCorrectOption(question);
  const answered = answer !== null;
  const isLast = index === total - 1;

  // Nouvelle question (le composant est recréé à chaque question) : on remonte
  // en haut et on place le focus sur l'énoncé, pour les lecteurs d'écran et la
  // navigation clavier. Rien de tout cela au simple chargement de la page.
  useEffect(() => {
    if (!focusOnMount) return;
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [focusOnMount]);

  // Réponse donnée : on amène l'anecdote et le bouton « suivant » à l'écran.
  useEffect(() => {
    if (!answered) return;
    nextRef.current?.focus({ preventScroll: true });
    revealRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [answered]);

  const stateOf = (optionId: string): OptionState => {
    if (!answer) return "idle";
    if (optionId === correctOption.id) return "correct";
    if (optionId === answer.optionId) return "wrong";
    return "muted";
  };

  return (
    // Fond très légèrement opaque : la neige s'estompe derrière le texte.
    <section
      aria-labelledby="enonce"
      className="-mx-3 animate-fade-up rounded-3xl bg-givre-100/85 px-3 py-3"
    >
      <Progress current={index + 1} total={total} />

      <h1
        id="enonce"
        ref={headingRef}
        tabIndex={-1}
        className="mt-6 text-pretty font-serif text-[1.5rem] font-medium leading-snug text-nuit-900 outline-none sm:text-[1.75rem]"
      >
        {typo(question.text)}
      </h1>

      <ul className="mt-6 flex flex-col gap-3">
        {order.map((optionId, position) => {
          const option = getOption(question, optionId);
          if (!option) return null;
          const state = stateOf(optionId);
          const picked = answer?.optionId === optionId;

          return (
            <li key={optionId}>
              <button
                type="button"
                disabled={answered}
                onClick={() => onAnswer(optionId)}
                className={`flex min-h-16 w-full items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left text-lg font-medium leading-snug transition-colors duration-200 ${optionClasses[state]}`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-base font-semibold transition-colors duration-200 ${badgeClasses[state]}`}
                  aria-hidden="true"
                >
                  {state === "correct" ? (
                    <CheckIcon />
                  ) : state === "wrong" ? (
                    <CrossIcon />
                  ) : (
                    LETTERS[position]
                  )}
                </span>
                <span className="flex-1">
                  {typo(option.label)}
                  {answered && (picked || state === "correct") ? (
                    <span className="mt-0.5 block text-sm font-semibold">
                      {picked && state === "correct"
                        ? "Votre réponse — bonne réponse"
                        : picked
                          ? "Votre réponse"
                          : "La bonne réponse"}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Annonce pour les lecteurs d'écran */}
      <p className="sr-only" role="status" aria-live="polite">
        {answer
          ? answer.correct
            ? `Bonne réponse ! ${typo(question.anecdote)}`
            : `Ce n’est pas la bonne réponse. La bonne réponse était : ${typo(correctOption.label)}. ${typo(question.anecdote)}`
          : ""}
      </p>

      {answer ? (
        <div ref={revealRef} className="animate-fade-up scroll-mb-6 pt-5">
          <div
            className={`rounded-2xl border-l-4 px-5 py-4 ${
              answer.correct
                ? "border-succes-600 bg-succes-50"
                : "border-ciel-500 bg-ciel-50"
            }`}
          >
            <p className="font-serif text-xl font-semibold text-nuit-900">
              {answer.correct ? "Bonne réponse !" : "Pas tout à fait…"}
            </p>
            {!answer.correct ? (
              <p className="mt-1 text-nuit-800">
                Il s’agissait de :{" "}
                <strong>{typo(correctOption.label)}</strong>.
              </p>
            ) : null}
            <p className="surtitre mt-4">Le saviez-vous ?</p>
            <p className="mt-1 text-nuit-800">{typo(question.anecdote)}</p>
          </div>

          <Button ref={nextRef} onClick={onNext} className="mt-5 w-full">
            {isLast ? "Voir mon résultat" : "Question suivante"}
            <ArrowRight />
          </Button>
        </div>
      ) : null}
    </section>
  );
}
