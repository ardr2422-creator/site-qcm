"use client";

import { useEffect } from "react";

import { captureSourceFromUrl } from "@/lib/client/game";
import { useOutboxAutoFlush, useOutboxStatus } from "@/lib/client/outbox";

/**
 * Monté une fois sur toutes les pages publiques :
 *  - mémorise le paramètre `?src=` de l'URL d'arrivée ;
 *  - relance la file d'envoi (réponses en attente d'une visite précédente) ;
 *  - affiche un message uniquement si les envois échouent de façon répétée.
 */
export function ClientRuntime() {
  useOutboxAutoFlush();

  useEffect(() => {
    captureSourceFromUrl();
  }, []);

  const { struggling } = useOutboxStatus();
  if (!struggling) return null;

  // Volontairement placé dans le flux de la page, en bas : un bandeau flottant
  // pourrait recouvrir un bouton ou décaler une réponse au moment du clic.
  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-3 print:hidden">
      <p
        role="status"
        className="animate-fade-in rounded-2xl border border-givre-400 bg-givre-50 px-4 py-3 text-center text-[0.9375rem] text-nuit-700"
      >
        <strong className="font-semibold text-nuit-900">Connexion instable.</strong>{" "}
        Pas d’inquiétude : vos réponses sont gardées sur cet appareil et seront
        envoyées automatiquement dès que le réseau reviendra.
      </p>
    </div>
  );
}
