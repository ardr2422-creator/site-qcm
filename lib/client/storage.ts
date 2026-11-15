"use client";

import { useSyncExternalStore } from "react";

/**
 * Petit magasin clé/valeur au-dessus de `localStorage`, lisible depuis React.
 *
 * - Si `localStorage` est indisponible (navigation privée stricte, certains
 *   navigateurs intégrés aux applis), on bascule sur la mémoire : le jeu
 *   fonctionne quand même, simplement sans souvenir d'une visite à l'autre.
 * - Les valeurs lues sont mises en cache pour rester stables entre deux
 *   rendus (exigence de `useSyncExternalStore`).
 */

export const STORAGE_KEYS = {
  game: "sga.game.v1",
  done: "sga.done.v1",
  outbox: "sga.outbox.v1",
  source: "sga.source.v1",
} as const;

const memory = new Map<string, string>();
let memoryOnly: boolean | null = null;

function isMemoryOnly(): boolean {
  if (memoryOnly !== null) return memoryOnly;
  try {
    const probe = "sga.probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    memoryOnly = false;
  } catch {
    memoryOnly = true;
  }
  return memoryOnly;
}

function readRaw(key: string): string | null {
  if (isMemoryOnly()) return memory.get(key) ?? null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function writeRaw(key: string, value: string | null): void {
  if (!isMemoryOnly()) {
    try {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
      return;
    } catch {
      // Quota dépassé ou stockage devenu indisponible : on continue en mémoire.
      memoryOnly = true;
    }
  }
  if (value === null) memory.delete(key);
  else memory.set(key, value);
}

const cache = new Map<string, { raw: string | null; value: unknown }>();
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function readStored<T>(key: string): T | null {
  const raw = readRaw(key);
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T | null;

  let value: T | null = null;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = null;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

export function writeStored<T>(key: string, value: T | null): void {
  writeRaw(key, value === null ? null : JSON.stringify(value));
  emit();
}

const getServerSnapshot = () => undefined;

/**
 * Valeur stockée, réactive.
 * `undefined` = pas encore lue (rendu serveur / hydratation) ; `null` = absente.
 */
export function useStored<T>(key: string): T | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => readStored<T>(key),
    getServerSnapshot,
  );
}

/** UUID v4, y compris hors contexte sécurisé (test en HTTP sur le réseau local). */
export function randomUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}
