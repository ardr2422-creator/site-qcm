"use client";

import { useMemo, useState } from "react";

import { formatDateTime } from "@/lib/dates";
import { formatNumber, plural } from "@/lib/format";
import type { FeedbackEntry } from "@/lib/stats";
import { typo } from "@/lib/typo";

const PAGE_SIZE = 20;

/** Minuscules sans accents, pour une recherche tolérante. */
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function Stars({ rating }: { rating: number }) {
  return (
    <span
      role="img"
      aria-label={`Note : ${rating} sur 5`}
      className="inline-flex shrink-0 gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <svg
          key={value}
          viewBox="0 0 24 24"
          width="16"
          height="16"
          aria-hidden="true"
          className={value <= rating ? "fill-or-500" : "fill-creme-300"}
        >
          <path d="M12 2.8l2.83 5.74 6.33.92-4.58 4.46 1.08 6.3L12 17.25l-5.66 2.97 1.08-6.3-4.58-4.46 6.33-.92z" />
        </svg>
      ))}
    </span>
  );
}

export function FeedbackList({ entries }: { entries: FeedbackEntry[] }) {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const needle = fold(query.trim());
    if (!needle) return entries;
    return entries.filter((entry) =>
      fold(
        [entry.comment, entry.firstName, entry.district, entry.source]
          .filter(Boolean)
          .join(" "),
      ).includes(needle),
    );
  }, [entries, query]);

  const shown = filtered.slice(0, visible);

  return (
    <section
      aria-labelledby="titre-avis"
      className="rounded-2xl border border-creme-300 bg-[#fffdf8] p-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h3 id="titre-avis" className="text-base font-semibold text-brun-900">
            Commentaires des participants
          </h3>
          <p className="mt-0.5 text-sm text-brun-600" role="status">
            {query.trim()
              ? `${formatNumber(filtered.length)} ${plural(filtered.length, "résultat", "résultats")} sur ${formatNumber(entries.length)}`
              : `${formatNumber(entries.length)} ${plural(entries.length, "commentaire", "commentaires")}, du plus récent au plus ancien`}
          </p>
        </div>
        <div className="w-full sm:w-72">
          <label htmlFor="recherche-avis" className="sr-only">
            Rechercher dans les commentaires
          </label>
          <input
            id="recherche-avis"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder="Rechercher un mot, un prénom, un quartier…"
            className="block h-11 w-full rounded-lg border border-brun-500 bg-white px-3 text-brun-900 placeholder:text-brun-500 focus:border-asperge-700 focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-figue-500"
          />
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="mt-5 rounded-xl bg-creme-100 px-4 py-6 text-center text-brun-700">
          Aucun commentaire pour l’instant.
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-5 rounded-xl bg-creme-100 px-4 py-6 text-center text-brun-700">
          Aucun commentaire ne correspond à « {query.trim()} ».
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-creme-300">
          {shown.map((entry) => (
            <li key={entry.sessionId} className="py-4 first:pt-1 last:pb-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-brun-600">
                {entry.rating !== null ? (
                  <Stars rating={entry.rating} />
                ) : (
                  <span className="italic">Sans note</span>
                )}
                <span className="font-semibold text-brun-900">
                  {entry.firstName ?? "Anonyme"}
                </span>
                {entry.district ? <span>· {typo(entry.district)}</span> : null}
                {entry.source ? <span>· {entry.source}</span> : null}
                {entry.score !== null ? <span>· score {entry.score}</span> : null}
                <time dateTime={entry.createdAt} className="sm:ml-auto">
                  {formatDateTime(entry.createdAt)}
                </time>
              </div>
              <p className="mt-1.5 whitespace-pre-line break-words text-brun-900">
                {typo(entry.comment)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {filtered.length > visible ? (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setVisible((count) => count + PAGE_SIZE)}
            className="rounded-full border border-brun-500 px-5 py-2 text-[0.9375rem] font-semibold text-brun-800 transition-colors hover:bg-creme-200"
          >
            Afficher {Math.min(PAGE_SIZE, filtered.length - visible)} commentaires de plus
          </button>
        </div>
      ) : null}
    </section>
  );
}
