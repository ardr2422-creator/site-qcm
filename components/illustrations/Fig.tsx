type Props = { className?: string };

const OUTLINE =
  "M0-34C-1-26-3-21-8-16-18-8-24 2-23 14-22 27-12 35 0 35 12 35 22 27 23 14 24 2 18-8 8-16 3-21 1-26 0-34Z";

/** Une figue entière et sa moitié ouverte. Dessin original. */
export function Fig({ className }: Props) {
  return (
    <svg
      viewBox="0 0 120 96"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Feuille */}
      <path
        d="M58 30C66 16 80 12 92 16 88 28 78 36 62 36Z"
        fill="#93a97c"
        stroke="#4f3b2e"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M62 34C70 27 80 21 90 17"
        fill="none"
        stroke="#4f3b2e"
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Figue entière */}
      <g transform="translate(40 52) rotate(-10)">
        <path d="M-2-40H2V-32H-2Z" fill="#778f60" stroke="#4f3b2e" strokeWidth="1.4" strokeLinejoin="round" />
        <path d={OUTLINE} fill="#6f2c5b" stroke="#4f3b2e" strokeWidth="1.8" strokeLinejoin="round" />
        <path
          d="M-13 2C-15 12-11 22-4 27"
          fill="none"
          stroke="#a85a90"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M0-22C3-12 4 4 2 28M-7-14C-10-4-11 8-8 22M8-12C13-2 15 10 12 22"
          fill="none"
          stroke="#5a2249"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>

      {/* Moitié ouverte */}
      <g transform="translate(84 58) rotate(12) scale(0.86)">
        <path d={OUTLINE} fill="#8a3f73" stroke="#4f3b2e" strokeWidth="2" strokeLinejoin="round" />
        <path
          d="M0-22C-1-17-3-14-6-11-13-5-17 3-16 13-15 22-8 28 0 28 8 28 15 22 16 13 17 3 13-5 6-11 3-14 1-17 0-22Z"
          fill="#f8eef4"
        />
        <path
          d="M0-8C-6-3-9 4-8 12-7 19-3 22 0 22 3 22 7 19 8 12 9 4 6-3 0-8Z"
          fill="#dfb9d0"
        />
        <g fill="#8a3f73">
          <circle cx="-3" cy="4" r="1.2" />
          <circle cx="3" cy="2" r="1.2" />
          <circle cx="0" cy="10" r="1.2" />
          <circle cx="-4" cy="14" r="1.2" />
          <circle cx="4" cy="14" r="1.2" />
          <circle cx="0" cy="-2" r="1.2" />
          <circle cx="0" cy="18" r="1.1" />
        </g>
      </g>
    </svg>
  );
}
