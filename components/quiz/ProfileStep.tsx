"use client";

import { useState, type FormEvent } from "react";

import { ArrowRight, Button } from "@/components/ui/Button";
import {
  DISTRICT_NO_ANSWER_LABEL,
  DISTRICT_OTHER,
  districts,
} from "@/data/districts";
import type { Profile } from "@/lib/client/game";
import { FIRST_NAME_MAX } from "@/lib/validation";
import { typo } from "@/lib/typo";

type Props = {
  onStart: (profile: Profile) => void;
};

const fieldClasses =
  "mt-2 block w-full rounded-xl border-2 border-nuit-500 bg-white px-4 py-3 text-lg text-nuit-900 " +
  "placeholder:text-nuit-500 focus:border-bleu-700 focus:outline-none focus-visible:outline-3 " +
  "focus-visible:outline-offset-2 focus-visible:outline-ciel-500";

/** Écran « prénom et quartier » : tout est facultatif, on peut passer. */
export function ProfileStep({ onStart }: Props) {
  const [firstName, setFirstName] = useState("");
  const [district, setDistrict] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onStart({ firstName, district });
  };

  return (
    <section
      aria-labelledby="titre-profil"
      className="carte my-auto animate-fade-up px-6 py-8 sm:px-10 sm:py-10"
    >
      <p className="surtitre">Avant de commencer</p>
      <h1
        id="titre-profil"
        className="mt-2 font-serif text-3xl font-semibold leading-tight text-nuit-900"
      >
        Faisons connaissance
      </h1>
      <p className="mt-3 text-nuit-700">
        Ces deux informations sont <strong>facultatives</strong> et servent
        uniquement aux statistiques du jeu.
      </p>

      <form onSubmit={submit} className="mt-7 flex flex-col gap-6" noValidate>
        <div>
          <label htmlFor="prenom" className="text-lg font-semibold text-nuit-900">
            Votre prénom{" "}
            <span className="font-normal text-nuit-600">(facultatif)</span>
          </label>
          <input
            id="prenom"
            name="prenom"
            type="text"
            autoComplete="given-name"
            autoCapitalize="words"
            maxLength={FIRST_NAME_MAX}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className={fieldClasses}
          />
        </div>

        <div>
          <label htmlFor="quartier" className="text-lg font-semibold text-nuit-900">
            Votre quartier{" "}
            <span className="font-normal text-nuit-600">(facultatif)</span>
          </label>
          <select
            id="quartier"
            name="quartier"
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
            className={`${fieldClasses} appearance-none bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2020%2020%22%20fill=%22none%22%20stroke=%22%2331435c%22%20stroke-width=%222%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22><path%20d=%22M5%208l5%205%205-5%22/></svg>')] bg-[length:1.25rem] bg-[right_1rem_center] bg-no-repeat pr-12`}
          >
            <option value="">Choisir dans la liste…</option>
            {districts.map((name) => (
              <option key={name} value={name}>
                {typo(name)}
              </option>
            ))}
            <option value={DISTRICT_OTHER}>{DISTRICT_OTHER}</option>
            <option value="aucun">{DISTRICT_NO_ANSWER_LABEL}</option>
          </select>
        </div>

        <div className="mt-1 flex flex-col items-center gap-4">
          <Button type="submit" className="w-full">
            C’est parti
            <ArrowRight />
          </Button>
          <Button
            variant="quiet"
            size="md"
            onClick={() => onStart({ firstName: null, district: null })}
          >
            Passer cette étape
          </Button>
        </div>
      </form>
    </section>
  );
}
