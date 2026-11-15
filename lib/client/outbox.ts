"use client";

import { useEffect } from "react";

import {
  STORAGE_KEYS,
  randomUuid,
  readStored,
  useStored,
  writeStored,
} from "./storage";

/**
 * File d'envoi vers l'API.
 *
 * Le jeu ne dépend jamais du réseau : chaque appel (création de partie,
 * réponse, fin de partie, avis) est d'abord posé dans cette file, conservée
 * sur le téléphone, puis envoyé dans l'ordre. En cas d'échec (4G capricieuse,
 * serveur indisponible), on réessaie en silence, de plus en plus espacé, et
 * la file reprend toute seule à la prochaine visite.
 */

export type OutboxItem = {
  id: string;
  path: string;
  body: unknown;
  attempts: number;
  createdAt: number;
};

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_ITEM_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** Nombre d'échecs consécutifs à partir duquel on prévient le visiteur. */
const STRUGGLING_AFTER_ATTEMPTS = 3;

let flushing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function readItems(): OutboxItem[] {
  const items = readStored<OutboxItem[]>(STORAGE_KEYS.outbox);
  return Array.isArray(items) ? items : [];
}

function writeItems(items: OutboxItem[]): void {
  writeStored(STORAGE_KEYS.outbox, items.length > 0 ? items : null);
}

export function enqueue(path: string, body: unknown): void {
  writeItems([
    ...readItems(),
    { id: randomUuid(), path, body, attempts: 0, createdAt: Date.now() },
  ]);
  void flush();
}

type SendResult = "sent" | "drop" | "retry";

async function send(item: OutboxItem): Promise<SendResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(item.path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item.body),
      keepalive: true,
      signal: controller.signal,
    });
    if (response.ok) return "sent";
    // Trop de requêtes ou délai dépassé : on retentera.
    if (response.status === 408 || response.status === 429) return "retry";
    // Autre erreur 4xx : la requête est refusée pour de bon, inutile d'insister.
    if (response.status >= 400 && response.status < 500) return "drop";
    return "retry";
  } catch {
    return "retry";
  } finally {
    clearTimeout(timeout);
  }
}

function retryDelay(attempts: number): number {
  return Math.min(30_000, 1_500 * 2 ** Math.min(attempts, 5));
}

/** Envoie tout ce qui peut l'être, dans l'ordre. Sans effet si déjà en cours. */
export async function flush(): Promise<void> {
  if (flushing || typeof window === "undefined") return;
  flushing = true;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  try {
    for (;;) {
      const item = readItems()[0];
      if (!item) break;

      if (Date.now() - item.createdAt > MAX_ITEM_AGE_MS) {
        writeItems(readItems().filter((i) => i.id !== item.id));
        continue;
      }

      const result = await send(item);

      if (result === "retry") {
        const attempts = item.attempts + 1;
        writeItems(
          readItems().map((i) => (i.id === item.id ? { ...i, attempts } : i)),
        );
        retryTimer = setTimeout(() => void flush(), retryDelay(attempts));
        break;
      }

      writeItems(readItems().filter((i) => i.id !== item.id));
    }
  } finally {
    flushing = false;
  }
}

/** À monter une fois : relance la file au chargement et au retour du réseau. */
export function useOutboxAutoFlush(): void {
  useEffect(() => {
    const kick = () => void flush();
    const onVisibility = () => {
      if (document.visibilityState === "visible") kick();
    };

    kick();
    window.addEventListener("online", kick);
    window.addEventListener("pageshow", kick);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("online", kick);
      window.removeEventListener("pageshow", kick);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}

export type OutboxStatus = {
  /** Nombre d'envois en attente. */
  pending: number;
  /** Vrai quand les envois échouent de façon répétée. */
  struggling: boolean;
};

export function useOutboxStatus(): OutboxStatus {
  const items = useStored<OutboxItem[]>(STORAGE_KEYS.outbox);
  const list = Array.isArray(items) ? items : [];
  return {
    pending: list.length,
    struggling: list.some((i) => i.attempts >= STRUGGLING_AFTER_ATTEMPTS),
  };
}
