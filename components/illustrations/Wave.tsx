"use client";

import { useId } from "react";

type Props = { className?: string; tone?: "sauge" | "figue" };

const tones = {
  sauge: ["#93a97c", "#cdd9bd"],
  figue: ["#a85a90", "#dfb9d0"],
} as const;

/** Frise « vague de Seine », répétée sur toute la largeur disponible. */
export function Wave({ className, tone = "sauge" }: Props) {
  // useId peut contenir des caractères non valides dans une référence url(#…).
  const id = `vague-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [front, back] = tones[tone];

  return (
    <svg
      className={className}
      width="100%"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={id} width="40" height="18" patternUnits="userSpaceOnUse">
          <path
            d="M-10 7q10-7 20 0t20 0 20 0"
            fill="none"
            stroke={front}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M-20 14q10-7 20 0t20 0 20 0 20 0"
            fill="none"
            stroke={back}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </pattern>
      </defs>
      <rect width="100%" height="18" fill={`url(#${id})`} />
    </svg>
  );
}

/** Petit séparateur : filet, losange, filet. */
export function Ornament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 12"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 6H48M72 6H116" stroke="#a8957f" strokeWidth="1" strokeLinecap="round" />
      <path d="M60 1L65 6 60 11 55 6Z" fill="#8a3f73" />
      <circle cx="51" cy="6" r="1.4" fill="#93a97c" />
      <circle cx="69" cy="6" r="1.4" fill="#93a97c" />
    </svg>
  );
}
