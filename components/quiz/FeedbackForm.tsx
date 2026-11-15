"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { sendFeedback } from "@/lib/client/game";
import { COMMENT_MAX } from "@/lib/validation";

const RATING_LABELS = [
  "1 étoile sur 5 : pas du tout",
  "2 étoiles sur 5 : un peu",
  "3 étoiles sur 5 : moyennement",
  "4 étoiles sur 5 : beaucoup",
  "5 étoiles sur 5 : énormément",
];

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="40"
      height="40"
      aria-hidden="true"
      focusable="false"
      className={`transition-colors duration-150 ${
        filled ? "fill-or-500 stroke-or-600" : "fill-creme-50 stroke-brun-500"
      }`}
      strokeWidth="1.6"
      strokeLinejoin="round"
    >
      <path d="M12 2.8l2.83 5.74 6.33.92-4.58 4.46 1.08 6.3L12 17.25l-5.66 2.97 1.08-6.3-4.58-4.46 6.33-.92z" />
    </svg>
  );
}

type Props = {
  /** Vrai si un avis a déjà été envoyé pour cette partie. */
  alreadySent: boolean;
};

/** « Votre avis » : note de 1 à 5 étoiles et mot libre, tous deux facultatifs. */
export function FeedbackForm({ alreadySent }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (alreadySent) {
    return (
      <div
        role="status"
        className="animate-fade-up rounded-2xl border border-succes-600 bg-succes-50 px-5 py-6 text-center"
      >
        <p className="font-serif text-2xl font-semibold text-succes-800">
          Merci pour votre avis !
        </p>
        <p className="mt-1 text-brun-700">
          Il nous aidera à imaginer la suite.
        </p>
      </div>
    );
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = comment.trim();
    if (rating === null && !text) {
      setError("Choisissez une note ou écrivez un petit mot avant d’envoyer.");
      return;
    }
    setError(null);
    sendFeedback(rating, text || null);
  };

  const shown = hovered ?? rating ?? 0;
  const length = Array.from(comment).length;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <fieldset>
        <legend className="text-lg font-semibold text-brun-900">
          Avez-vous aimé ce jeu ?{" "}
          <span className="font-normal text-brun-600">(facultatif)</span>
        </legend>
        <div
          className="mt-2 flex justify-center gap-1 sm:justify-start"
          onPointerLeave={() => setHovered(null)}
        >
          {RATING_LABELS.map((label, index) => {
            const value = index + 1;
            return (
              <label
                key={value}
                className="cursor-pointer rounded-full p-1.5 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-0 has-[:focus-visible]:outline-figue-500"
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setHovered(value);
                }}
              >
                <input
                  type="radio"
                  name="note"
                  value={value}
                  checked={rating === value}
                  onChange={() => {
                    setRating(value);
                    setError(null);
                  }}
                  className="sr-only"
                />
                <span className="sr-only">{label}</span>
                <Star filled={value <= shown} />
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="commentaire" className="text-lg font-semibold text-brun-900">
          Un mot, une idée, un souvenir d’Argenteuil à partager ?{" "}
          <span className="font-normal text-brun-600">(facultatif)</span>
        </label>
        <textarea
          id="commentaire"
          name="commentaire"
          rows={4}
          maxLength={COMMENT_MAX}
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
            setError(null);
          }}
          aria-describedby="commentaire-compteur"
          className="mt-2 block w-full resize-y rounded-xl border-2 border-brun-500 bg-white px-4 py-3 text-lg text-brun-900 focus:border-asperge-700 focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-figue-500"
        />
        <p
          id="commentaire-compteur"
          className="mt-1 text-right text-sm tabular-nums text-brun-600"
        >
          {length} / {COMMENT_MAX} caractères
        </p>
      </div>

      {error ? (
        <p role="alert" className="-mt-2 font-medium text-erreur-800">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="secondary" className="w-full sm:w-auto sm:self-start">
        Envoyer mon avis
      </Button>
    </form>
  );
}
