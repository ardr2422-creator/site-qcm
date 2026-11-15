type Props = { className?: string };

function Spear({ transform }: { transform?: string }) {
  return (
    <g transform={transform}>
      {/* Tige blanche, comme la belle d'Argenteuil */}
      <path
        d="M-7 62L-7.5-28C-7.5-42-4-54 0-64 4-54 7.5-42 7.5-28L7 62Z"
        fill="#fdfaf3"
        stroke="#4f3b2e"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Pointe rosée */}
      <path
        d="M-7.4-30C-7.4-43-4-54 0-64 4-54 7.4-43 7.4-30 4-36 2-38 0-38-2-38-4-36-7.4-30Z"
        fill="#dfb9d0"
        stroke="#4f3b2e"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M0-62C-2-54-3-48-3-42 -1-46 1-46 3-42 3-48 2-54 0-62Z"
        fill="#a85a90"
      />
      {/* Écailles */}
      <g fill="none" stroke="#778f60" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-4-14L0-22 4-14" />
        <path d="M-4 8L0 0 4 8" />
        <path d="M-4 30L0 22 4 30" />
      </g>
    </g>
  );
}

/** Botte de trois asperges d'Argenteuil nouées d'un ruban. Dessin original. */
export function Asparagus({ className }: Props) {
  return (
    <svg
      viewBox="0 0 96 144"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <Spear transform="translate(30 78) rotate(-9)" />
      <Spear transform="translate(66 78) rotate(9)" />
      <Spear transform="translate(48 72)" />
      {/* Ruban */}
      <path
        d="M19 96C30 101 66 101 77 96L78 107C66 112 30 112 18 107Z"
        fill="#8a3f73"
        stroke="#4f3b2e"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M24 102C36 105 60 105 72 102"
        fill="none"
        stroke="#f0dce8"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}
