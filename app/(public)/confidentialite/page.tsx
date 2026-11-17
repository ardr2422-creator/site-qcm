import type { Metadata } from "next";

import { SessionIdNote } from "@/components/quiz/SessionIdNote";
import { ButtonLink } from "@/components/ui/Button";
import { privacy, site } from "@/data/site";
import { typo } from "@/lib/typo";

export const metadata: Metadata = {
  title: "Confidentialité",
  description:
    "Quelles données le jeu enregistre, pourquoi, et pendant combien de temps.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-serif text-xl font-semibold text-nuit-900">{title}</h2>
      <div className="mt-2 flex flex-col gap-3 text-nuit-800">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  const months = privacy.retentionMonths;

  return (
    <article className="carte animate-fade-up px-6 py-8 sm:px-10 sm:py-10">
      <p className="surtitre">{typo(site.title)}</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-nuit-900">
        Confidentialité
      </h1>
      <p className="mt-4 text-lg text-nuit-800">
        Ce jeu est <strong>anonyme</strong>. Aucune information n’est
        obligatoire, aucun compte n’est créé et rien ne permet de vous
        identifier.
      </p>

      <Section title="Ce que nous enregistrons">
        <ul className="list-disc space-y-2 pl-5 marker:text-ciel-500">
          <li>vos réponses aux devinettes et votre score ;</li>
          <li>
            votre prénom et votre quartier, <strong>seulement si vous choisissez
            de les indiquer</strong> ;
          </li>
          <li>votre note et votre commentaire, si vous laissez un avis ;</li>
          <li>
            la date de participation, le type d’appareil (téléphone ou
            ordinateur) et le support scanné (table, affiche, menu…).
          </li>
        </ul>
        <p>
          Le jeu n’enregistre <strong>ni votre adresse IP, ni votre nom, ni
          votre adresse e-mail</strong>.
        </p>
      </Section>

      <Section title="À quoi cela sert">
        <p>
          Uniquement à établir les <strong>statistiques du jeu</strong> : nombre
          de participants, devinettes les mieux connues, avis des joueurs. Ces
          données ne sont ni vendues, ni transmises à des tiers, ni utilisées à
          des fins publicitaires.
        </p>
      </Section>

      <Section title="Cookies et suivi">
        <p>
          Le site n’utilise <strong>aucun cookie de suivi</strong> ni outil de
          mesure d’audience tiers. Un identifiant anonyme, tiré au hasard, est
          simplement conservé dans votre navigateur pour retenir votre partie
          et éviter les doublons.
        </p>
      </Section>

      <Section title="Durée de conservation">
        <p>
          Les données sont conservées{" "}
          <strong>
            {months} mois au maximum
          </strong>{" "}
          après la fin de l’opération, puis supprimées.
          {privacy.hostedInEU
            ? " Elles sont hébergées dans l’Union européenne."
            : null}
        </p>
      </Section>

      <Section title="Vos droits et contact">
        <p>
          Vous pouvez demander l’accès à vos données ou leur suppression à tout
          moment
          {privacy.contactEmail ? (
            <>
              {" "}
              en écrivant à{" "}
              <a
                href={`mailto:${privacy.contactEmail}`}
                className="font-semibold text-ciel-600 underline underline-offset-4"
              >
                {privacy.contactEmail}
              </a>
              .
            </>
          ) : (
            <> en vous adressant à {typo(privacy.organizer)}.</>
          )}{" "}
          Pour effacer la trace du jeu sur votre appareil, il suffit de vider
          les données de navigation de ce site.
        </p>
        <SessionIdNote />
      </Section>

      <div className="mt-9">
        <ButtonLink href="/" variant="secondary" size="md">
          Retour au jeu
        </ButtonLink>
      </div>
    </article>
  );
}
