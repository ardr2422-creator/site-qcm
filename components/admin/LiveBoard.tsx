"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { closeLiveAction, reopenLiveAction } from "@/app/admin/direct/actions";
import { Logo } from "@/components/brand/Logo";
import { TOTAL_QUESTIONS } from "@/data/questions";
import { formatDuration, type LivePlayer } from "@/lib/live";
import type { LiveBoard as Board } from "@/lib/server/live";

type Props = {
  initial: Board;
  joinUrl: string;
  /** QR code (SVG) vers la page d'inscription de la partie. */
  qrSvg: string;
};

const REFRESH_MS = 3000;

/* ─────────────────────────────── Petits éléments ──────────────────────── */

const MEDALS: Record<number, { ring: string; fill: string; label: string }> = {
  1: { ring: "border-or-500", fill: "bg-[#fbe7b5] text-nuit-900", label: "1er" },
  2: { ring: "border-[#9aa8b8]", fill: "bg-[#e3e9f0] text-nuit-900", label: "2e" },
  3: { ring: "border-[#c08457]", fill: "bg-[#f2dcc8] text-nuit-900", label: "3e" },
};

function RankBadge({ rank }: { rank: number }) {
  const medal = MEDALS[rank];
  return (
    <span
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 font-serif text-2xl font-semibold ${
        medal ? `${medal.ring} ${medal.fill}` : "border-givre-300 bg-white text-nuit-700"
      }`}
    >
      {medal ? medal.label : `${rank}e`}
    </span>
  );
}

function Progress({ answered }: { answered: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => (
        <span
          key={i}
          className={`h-3 w-8 rounded-full ${i < answered ? "bg-bleu-600" : "bg-givre-300"}`}
        />
      ))}
    </div>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 48 48" width="56" height="56" aria-hidden="true" focusable="false">
      <path d="M14 6h20v12a10 10 0 0 1-20 0z" fill="#e2b13c" stroke="#9a6412" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 10H7v3a8 8 0 0 0 8 8M34 10h7v3a8 8 0 0 1-8 8" fill="none" stroke="#9a6412" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M21 28h6l1 7h-8z" fill="#e2b13c" stroke="#9a6412" strokeWidth="2" strokeLinejoin="round" />
      <rect x="14" y="35" width="20" height="6" rx="2" fill="#1c4a94" />
      <path d="M24 11l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#fff8e1" />
    </svg>
  );
}

/* ─────────────────────────────── Écran ────────────────────────────────── */

export function LiveBoard({ initial, joinUrl, qrSvg }: Props) {
  const [board, setBoard] = useState<Board>(initial);
  const [revealed, setRevealed] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setRefreshing(true);
    try {
      const response = await fetch(`/api/admin/direct/${initial.game.id}`, { cache: "no-store" });
      if (response.status === 401) {
        setProblem("Session expirée : reconnectez-vous à l’espace organisateur.");
        return;
      }
      const data = (await response.json()) as { ok: boolean } & Board;
      if (data.ok) {
        setBoard({ game: data.game, players: data.players, generatedAt: data.generatedAt });
        setProblem(null);
      } else {
        setProblem("Classement momentanément indisponible, nouvel essai dans un instant.");
      }
    } catch {
      setProblem("Connexion perdue, nouvel essai dans un instant.");
    } finally {
      busy.current = false;
      setRefreshing(false);
    }
  }, [initial.game.id]);

  useEffect(() => {
    const timer = window.setInterval(() => void refresh(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const { game, players } = board;
  const open = game.closed_at === null;
  const finished = players.filter((p) => p.finished);
  const winners = finished.filter((p) => p.rank === 1);
  const displayUrl = joinUrl.replace(/^https?:\/\//, "");

  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const controlClasses =
    "inline-flex h-11 items-center rounded-full border border-nuit-500 bg-white px-4 text-[0.9375rem] font-semibold text-nuit-800 transition-colors hover:bg-givre-200";

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-0.75rem)] max-w-[1500px] flex-col px-5 py-5 lg:px-10">
      {/* Barre de commandes (discrète, pour l'organisatrice) */}
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin/direct" className="mr-auto text-[0.9375rem] font-medium text-nuit-700 underline decoration-nuit-400 underline-offset-4 hover:text-ciel-600">
          ← Parties en direct
        </Link>
        <button type="button" onClick={fullscreen} className={controlClasses}>
          Plein écran
        </button>
        <form action={open ? closeLiveAction : reopenLiveAction}>
          <input type="hidden" name="id" value={game.id} />
          <button type="submit" className={controlClasses}>
            {open ? "Clore les inscriptions" : "Rouvrir les inscriptions"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setRevealed((value) => !value)}
          aria-pressed={revealed}
          className="inline-flex h-11 items-center rounded-full bg-bleu-700 px-6 font-semibold text-white transition-colors hover:bg-bleu-800"
        >
          {revealed ? "Masquer les scores" : "Révéler le classement"}
        </button>
      </div>

      {/* En-tête */}
      <header className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="surtitre text-base">Partie en direct</p>
          <h1 className="mt-1 text-balance font-serif text-4xl font-semibold leading-tight text-nuit-900 lg:text-5xl">
            {game.name}
          </h1>
        </div>
        <Logo priority title="" className="h-20 w-auto lg:h-24" />
      </header>

      <div className={`mt-8 grid flex-1 gap-8 ${open ? "lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]" : ""}`}>
        {/* Pour rejoindre */}
        {open ? (
          <aside className="flex flex-col items-center rounded-3xl border border-givre-300 bg-white/90 p-6 text-center">
            <p className="font-serif text-2xl font-semibold text-nuit-900">Scannez pour jouer</p>
            <div
              role="img"
              aria-label={`QR code vers ${displayUrl}`}
              className="mt-4 aspect-square w-full max-w-[18rem] rounded-2xl border border-givre-300 bg-white p-2 [&>svg]:h-full [&>svg]:w-full"
              // Balisage SVG produit par la bibliothèque `qrcode` à partir de l'adresse du site.
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="mt-4 text-nuit-700">ou rendez-vous sur</p>
            {/* Adresse sur deux lignes, sans jamais couper le code */}
            <p className="font-semibold text-nuit-900">
              <span className="block">{displayUrl.split("/direct/")[0]}</span>
              <span className="block whitespace-nowrap">/direct/{game.code}</span>
            </p>
            <p className="mt-3 text-nuit-700">
              Code de la partie
              <span className="mt-1 block font-mono text-4xl font-bold tracking-[0.25em] text-bleu-700">{game.code}</span>
            </p>
            <button type="button" onClick={copy} className="mt-4 text-sm font-medium text-nuit-600 underline underline-offset-4 hover:text-ciel-600">
              {copied ? "Lien copié ✓" : "Copier le lien"}
            </button>
          </aside>
        ) : null}

        {/* Participants / classement */}
        <section aria-labelledby="titre-classement" aria-live="polite" className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="titre-classement" className="font-serif text-3xl font-semibold text-nuit-900">
              {revealed ? "Classement" : "Participants"}
            </h2>
            <p className="text-lg text-nuit-700">
              {players.length} {players.length > 1 ? "participants" : "participant"} · {finished.length}{" "}
              {finished.length > 1 ? "ont terminé" : "a terminé"}
              {!open ? " · inscriptions closes" : ""}
            </p>
          </div>

          {problem ? (
            <p role="status" className="mt-3 rounded-xl border border-or-500 bg-[#fdf6e7] px-4 py-2 text-nuit-800">
              {problem}
            </p>
          ) : null}

          {players.length === 0 ? (
            <p className="mt-6 rounded-3xl border border-dashed border-givre-400 bg-white/80 px-6 py-16 text-center text-2xl text-nuit-600">
              En attente des premiers participants…
            </p>
          ) : revealed ? (
            <RevealedList players={players} winners={winners} />
          ) : (
            <ul className={`mt-5 grid gap-3 ${players.length > 6 ? "xl:grid-cols-2" : ""}`}>
              {players.map((player) => (
                <li
                  key={player.id}
                  className="flex animate-fade-in items-center gap-5 rounded-2xl border border-givre-300 bg-white/90 px-5 py-4"
                >
                  <p className="min-w-0 flex-1 truncate text-2xl font-semibold text-nuit-900">{player.name}</p>
                  {player.finished ? (
                    <span className="rounded-full bg-succes-100 px-4 py-1.5 text-lg font-semibold text-succes-800">
                      ✓ Terminé
                    </span>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      <Progress answered={player.answered} />
                      <span className="text-sm text-nuit-600">
                        {player.answered}/{TOTAL_QUESTIONS} devinettes
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-sm text-nuit-600" aria-hidden="true">
            {refreshing ? "Mise à jour…" : "Mise à jour automatique toutes les 3 secondes"}
          </p>
        </section>
      </div>
    </div>
  );
}

function RevealedList({ players, winners }: { players: LivePlayer[]; winners: LivePlayer[] }) {
  const ranked = players.filter((p) => p.finished);
  const playing = players.filter((p) => !p.finished);

  return (
    <div className="mt-5">
      {winners.length > 0 ? (
        <div className="flex animate-fade-up items-center gap-5 rounded-3xl border-2 border-or-500 bg-[#fff8e6] px-6 py-5">
          <TrophyIcon />
          <div className="min-w-0">
            <p className="text-lg font-semibold uppercase tracking-[0.14em] text-or-600">
              {winners.length > 1 ? "Vainqueurs ex æquo" : "Vainqueur"}
            </p>
            <p className="truncate font-serif text-4xl font-semibold text-nuit-900">
              {winners.map((w) => w.name).join(" & ")}
            </p>
            <p className="text-xl text-nuit-700">
              {winners[0].score}/{TOTAL_QUESTIONS} en {formatDuration(winners[0].durationMs)}
            </p>
          </div>
        </div>
      ) : (
        <p className="rounded-3xl border border-givre-300 bg-white/90 px-6 py-5 text-xl text-nuit-700">
          Personne n’a encore terminé.
        </p>
      )}

      <ol className="mt-4 flex flex-col gap-3">
        {ranked.map((player, index) => (
          <li
            key={player.id}
            style={{ animationDelay: `${index * 120}ms` }}
            className="flex animate-fade-up items-center gap-5 rounded-2xl border border-givre-300 bg-white/90 px-5 py-3"
          >
            <RankBadge rank={player.rank as number} />
            <p className="min-w-0 flex-1 truncate text-2xl font-semibold text-nuit-900">{player.name}</p>
            <p className="font-serif text-3xl font-semibold text-ciel-600">
              {player.score}
              <span className="text-xl text-nuit-500">/{TOTAL_QUESTIONS}</span>
            </p>
            <p className="w-32 text-right text-lg tabular-nums text-nuit-600">{formatDuration(player.durationMs)}</p>
          </li>
        ))}
      </ol>

      {playing.length > 0 ? (
        <p className="mt-4 text-lg text-nuit-700">
          Encore en jeu : {playing.map((p) => `${p.name} (${p.answered}/${TOTAL_QUESTIONS})`).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
