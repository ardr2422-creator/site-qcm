"use client";

import { useGame } from "@/lib/client/game";

/**
 * Affiche l'identifiant anonyme de la partie enregistrée sur cet appareil,
 * pour permettre une demande de suppression sans autre information.
 */
export function SessionIdNote() {
  const game = useGame();
  if (!game) return null;

  return (
    <p className="mt-3 rounded-xl border border-creme-300 bg-creme-100 px-4 py-3 text-[0.9375rem]">
      Identifiant anonyme de votre participation sur cet appareil :{" "}
      <code className="break-all font-mono text-sm text-brun-900">
        {game.sessionId}
      </code>
    </p>
  );
}
