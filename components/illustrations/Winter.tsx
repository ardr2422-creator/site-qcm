/**
 * Dessins d'hiver : flocons et étoiles de givre, dans l'esprit du
 * « Royaume des Glaces ». Volontairement sans aucun lien avec les réponses
 * du quiz (ni pont, ni eau, ni fruit, ni légume).
 */

const C = {
  nuit: "#1c4a94",
  ciel: "#38b0f8",
  glace: "#8fd2fb",
  givre: "#d3eefd",
  halo: "#eef8ff",
} as const;

type Props = { className?: string };

/* ─────────────────────────────── Éléments ─────────────────────────────── */

/** Flocon à six branches, centré en (0, 0), de rayon `r`. */
function Flake({
  x,
  y,
  r,
  color,
  width = 2,
  rotate = 0,
}: {
  x: number;
  y: number;
  r: number;
  color: string;
  width?: number;
  rotate?: number;
}) {
  const arms = [0, 60, 120, 180, 240, 300];
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotate})`}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      {arms.map((angle) => (
        <g key={angle} transform={`rotate(${angle})`}>
          <path d={`M0 0V${-r}`} />
          <path d={`M0 ${-r * 0.5}L${r * 0.22} ${-r * 0.7}M0 ${-r * 0.5}L${-r * 0.22} ${-r * 0.7}`} />
          <path d={`M0 ${-r * 0.78}L${r * 0.14} ${-r * 0.92}M0 ${-r * 0.78}L${-r * 0.14} ${-r * 0.92}`} />
        </g>
      ))}
      <circle r={r * 0.12} fill={color} stroke="none" />
    </g>
  );
}

/** Étoile de givre à quatre pointes (scintillement), centrée en (0, 0). */
function Sparkle({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  const k = r * 0.16;
  return (
    <path
      transform={`translate(${x} ${y})`}
      fill={color}
      d={`M0 ${-r}C${k} ${-k} ${k} ${-k} ${r} 0C${k} ${k} ${k} ${k} 0 ${r}C${-k} ${k} ${-k} ${k} ${-r} 0C${-k} ${-k} ${-k} ${-k} 0 ${-r}Z`}
    />
  );
}

/* ─────────────────────────────── Compositions ─────────────────────────── */

/** Grande composition d'en-tête : un flocon central entouré d'étoiles. */
export function WinterHero({ className }: Props) {
  return (
    <svg viewBox="0 0 320 140" className={className} aria-hidden="true" focusable="false">
      <circle cx="160" cy="70" r="62" fill={C.halo} />
      <circle cx="160" cy="70" r="62" fill="none" stroke={C.givre} strokeWidth="1.5" />
      <Flake x={160} y={70} r={46} color={C.nuit} width={3} />
      <Sparkle x={236} y={34} r={17} color={C.ciel} />
      <Sparkle x={86} y={28} r={10} color={C.ciel} />
      <Sparkle x={262} y={96} r={7} color={C.glace} />
      <Flake x={70} y={98} r={17} color={C.glace} width={2} rotate={15} />
      <Flake x={250} y={64} r={9} color={C.glace} width={1.6} rotate={-10} />
      <Flake x={44} y={50} r={8} color={C.givre} width={1.6} />
      <circle cx="112" cy="122" r="2.5" fill={C.glace} />
      <circle cx="214" cy="118" r="3" fill={C.givre} />
      <circle cx="286" cy="40" r="2" fill={C.glace} />
      <circle cx="30" cy="96" r="2" fill={C.glace} />
    </svg>
  );
}

/** Flocon seul (décor de bas de page, supports imprimés). */
export function Snowflake({ className }: Props) {
  return (
    <svg viewBox="-50 -50 100 100" className={className} aria-hidden="true" focusable="false">
      <Flake x={0} y={0} r={44} color={C.nuit} width={4} />
    </svg>
  );
}

/** Étoile de givre seule, avec un petit éclat. */
export function FrostStar({ className }: Props) {
  return (
    <svg viewBox="-50 -50 100 100" className={className} aria-hidden="true" focusable="false">
      <Sparkle x={-4} y={4} r={40} color={C.ciel} />
      <Sparkle x={34} y={-32} r={11} color={C.glace} />
    </svg>
  );
}

/** Frise de petits flocons, répétée sur toute la largeur disponible. */
export function FrostFrieze({ className }: Props) {
  return (
    <svg
      className={className}
      width="100%"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id="frise-givre" width="44" height="18" patternUnits="userSpaceOnUse">
          <Flake x={11} y={9} r={6.5} color={C.glace} width={1.4} />
          <Sparkle x={33} y={9} r={4} color={C.ciel} />
        </pattern>
      </defs>
      <rect width="100%" height="18" fill="url(#frise-givre)" />
    </svg>
  );
}

/** Petit séparateur : filet, étoile, filet. */
export function Ornament({ className }: Props) {
  return (
    <svg viewBox="0 0 120 14" className={className} aria-hidden="true" focusable="false">
      <path d="M4 7H48M72 7H116" stroke="#8fa1b8" strokeWidth="1" strokeLinecap="round" />
      <Sparkle x={60} y={7} r={6.5} color={C.ciel} />
      <circle cx="51" cy="7" r="1.4" fill={C.glace} />
      <circle cx="69" cy="7" r="1.4" fill={C.glace} />
    </svg>
  );
}
