import type { CSSProperties } from "react";

import { Flake } from "./Winter";

/**
 * Chute de neige décorative, très légère, derrière le contenu des pages
 * publiques.
 *
 * - Animation 100 % CSS (aucun script) : chute lente et balancement doux.
 * - Placée derrière le texte et les boutons : elle ne gêne ni la lecture ni
 *   les clics, et n'est jamais annoncée aux lecteurs d'écran.
 * - Moins de flocons sur téléphone ; désactivée quand l'appareil demande de
 *   réduire les animations, et à l'impression (voir globals.css).
 */

const COLORS = ["#8fd2fb", "#5cc0f9", "#38b6ff", "#a6dcfb"] as const;
const COUNT = 36;

/** Hasard reproductible : les mêmes flocons à chaque affichage. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Item = {
  left: number;
  size: number;
  dot: boolean;
  color: string;
  opacity: number;
  fall: number;
  delay: number;
  sway: number;
  swayDelay: number;
  amplitude: number;
  mobile: boolean;
};

const random = seeded(2026);
const ITEMS: Item[] = Array.from({ length: COUNT }, (_, i) => {
  const dot = i % 3 === 2;
  const size = dot ? 3.5 + random() * 3.5 : 11 + random() * 10;
  const fall = 18 + random() * 14 - size * 0.25; // les gros tombent un peu plus vite
  return {
    // Réparti sur toute la largeur, sans paquets
    left: ((i + 0.15 + random() * 0.7) / COUNT) * 100,
    size,
    dot,
    color: COLORS[Math.floor(random() * COLORS.length)],
    opacity: 0.55 + random() * 0.35,
    fall,
    // Délai négatif : la neige est déjà en train de tomber à l'ouverture
    delay: random() * fall,
    sway: 3.5 + random() * 3.5,
    swayDelay: random() * 4,
    amplitude: 6 + random() * 16,
    // Un flocon sur trois reste masqué sur téléphone
    mobile: i % 3 !== 1,
  };
});

const round = (n: number) => Math.round(n * 100) / 100;

export function Snowfall() {
  return (
    <div className="neige" aria-hidden="true">
      <svg width="0" height="0" className="absolute">
        <symbol id="neige-flocon" viewBox="-10 -10 20 20">
          <Flake x={0} y={0} r={9} color="currentColor" width={1.7} />
        </symbol>
      </svg>
      {ITEMS.map((item, i) => (
        <span
          key={i}
          className={`neige-flocon${item.mobile ? "" : " max-sm:hidden"}`}
          style={{
            left: `${round(item.left)}%`,
            animationDuration: `${round(item.fall)}s`,
            animationDelay: `-${round(item.delay)}s`,
          }}
        >
          <span
            style={
              {
                animationDuration: `${round(item.sway)}s`,
                animationDelay: `-${round(item.swayDelay)}s`,
                "--balance": `${round(item.amplitude)}px`,
                color: item.color,
                opacity: round(item.opacity),
              } as CSSProperties
            }
          >
            {item.dot ? (
              <svg width={round(item.size)} height={round(item.size)} viewBox="0 0 10 10">
                <circle cx="5" cy="5" r="5" fill="currentColor" />
              </svg>
            ) : (
              <svg width={round(item.size)} height={round(item.size)}>
                <use href="#neige-flocon" />
              </svg>
            )}
          </span>
        </span>
      ))}
    </div>
  );
}
