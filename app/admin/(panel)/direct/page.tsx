import type { Metadata } from "next";
import Link from "next/link";

import { createLiveAction, deleteLiveAction } from "@/app/admin/direct/actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { formatDateTime } from "@/lib/dates";
import { LIVE_NAME_MAX } from "@/lib/live";
import { requireAdmin } from "@/lib/server/admin-auth";
import { listLiveGames, type LiveGameSummary } from "@/lib/server/live";
import { SupabaseConfigError } from "@/lib/server/supabase";
import { explainDatabaseError } from "@/lib/supabase-config";

export const metadata: Metadata = { title: "Partie en direct" };
export const dynamic = "force-dynamic";

const fieldClasses =
  "block h-12 w-full rounded-lg border border-nuit-500 bg-white px-3 text-nuit-900 placeholder:text-nuit-500 " +
  "focus:border-bleu-700 focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-ciel-500";

export default async function LiveGamesPage() {
  await requireAdmin();

  let games: LiveGameSummary[] | null = null;
  let loadError: unknown = null;
  try {
    games = await listLiveGames();
  } catch (error) {
    loadError = error;
    console.error("[admin] parties en direct :", error);
  }

  return (
    <>
      <h1 className="font-serif text-3xl font-semibold leading-tight text-nuit-900">
        Partie en direct
      </h1>
      <p className="mt-1 max-w-3xl text-nuit-700">
        Pour une démonstration ou un concours devant un public : chaque
        participant scanne le QR code, joue sous son nom, et le classement
        s’affiche sur votre écran. <strong>Ces parties ne comptent pas dans les
        statistiques</strong> et peuvent être supprimées à tout moment.
      </p>

      <section className="mt-6 rounded-2xl border border-givre-300 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-nuit-900">Nouvelle partie en direct</h2>
        <form action={createLiveAction} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="nom-partie" className="text-sm font-medium text-nuit-700">
              Nom affiché aux participants et sur l’écran
            </label>
            <input
              id="nom-partie"
              name="name"
              required
              maxLength={LIVE_NAME_MAX}
              placeholder="ex. : Démonstration aux élus"
              className={`mt-1 ${fieldClasses}`}
            />
          </div>
          <button
            type="submit"
            className="h-12 rounded-full bg-bleu-700 px-6 font-semibold text-white transition-colors hover:bg-bleu-800"
          >
            Créer et afficher l’écran
          </button>
        </form>
      </section>

      {loadError ? (
        <div role="alert" className="mt-6 rounded-2xl border border-erreur-600 bg-erreur-50 px-5 py-5 text-nuit-900">
          <h2 className="font-serif text-xl font-semibold text-erreur-800">
            Impossible de lire les parties en direct
          </h2>
          <p className="mt-2">
            {loadError instanceof SupabaseConfigError
              ? loadError.problems.map((p) => p.message).join(" ")
              : (explainDatabaseError(loadError) ??
                "Vérifiez que le fichier supabase/schema.sql a bien été exécuté dans Supabase (il peut être relancé sans risque).")}
          </p>
        </div>
      ) : null}

      {games && games.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-3 font-serif text-xl font-semibold text-nuit-900">Vos parties</h2>
          <ul className="flex flex-col gap-3">
            {games.map((game) => (
              <li
                key={game.id}
                className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-givre-300 bg-white px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold text-nuit-900">{game.name}</p>
                  <p className="text-sm text-nuit-600">
                    Code <strong className="font-mono tracking-wider text-nuit-800">{game.code}</strong> ·
                    créée le {formatDateTime(game.created_at)} ·{" "}
                    {game.closed_at ? "inscriptions closes" : "ouverte"}
                  </p>
                </div>
                <p className="text-sm text-nuit-700">
                  <strong className="text-lg text-nuit-900">{game.players}</strong>{" "}
                  {game.players > 1 ? "participants" : "participant"} ·{" "}
                  {game.finished} {game.finished > 1 ? "terminés" : "terminé"}
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/direct/${game.id}`}
                    className="inline-flex h-11 items-center rounded-full bg-bleu-700 px-5 font-semibold text-white transition-colors hover:bg-bleu-800"
                  >
                    Ouvrir l’écran
                  </Link>
                  <form action={deleteLiveAction}>
                    <input type="hidden" name="id" value={game.id} />
                    <ConfirmSubmit
                      message={`Supprimer « ${game.name} » et les résultats de ses ${game.players} participant(s) ? C’est définitif.`}
                      className="inline-flex h-11 items-center rounded-full border border-erreur-600 px-4 text-[0.9375rem] font-semibold text-erreur-800 transition-colors hover:bg-erreur-50"
                    >
                      Supprimer
                    </ConfirmSubmit>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : games ? (
        <p className="mt-6 rounded-2xl border border-givre-300 bg-white px-5 py-8 text-center text-nuit-700">
          Aucune partie en direct pour l’instant.
        </p>
      ) : null}

      <section className="mt-8 rounded-2xl border border-givre-300 bg-givre-50 px-5 py-5 text-[0.9375rem] text-nuit-800">
        <h2 className="text-base font-semibold text-nuit-900">Comment ça se passe</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Créez la partie : l’écran de classement s’ouvre avec un grand QR code.</li>
          <li>Projetez cet écran. Chaque participant scanne le QR code, saisit son nom et joue.</li>
          <li>Un seul téléphone pour tous ? En fin de partie, le bouton « Joueur suivant » relance pour la personne suivante.</li>
          <li>Les scores restent cachés pendant le jeu. Cliquez sur « Révéler le classement » pour afficher le podium : à score égal, le plus rapide gagne.</li>
        </ol>
      </section>
    </>
  );
}
