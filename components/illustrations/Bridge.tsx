type Props = { className?: string };

/**
 * Pont stylisé au-dessus de la Seine, avec un petit voilier (clin d'œil aux
 * régates). Dessin original, volontairement simple.
 */
export function Bridge({ className }: Props) {
  const arches = [0, 1, 2, 3].map((i) => 18 + i * 71);
  const posts = Array.from({ length: 21 }, (_, i) => 12 + i * 14.8);

  return (
    <svg
      viewBox="0 0 320 132"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Soleil couchant */}
      <circle cx="244" cy="30" r="17" fill="#f0dce8" />
      <circle cx="244" cy="30" r="11" fill="#dfb9d0" opacity="0.7" />

      {/* Garde-corps */}
      <g stroke="#4f3b2e" strokeLinecap="round">
        <path d="M6 43H314" strokeWidth="1.6" fill="none" />
        {posts.map((x) => (
          <path key={x} d={`M${x} 43V53`} strokeWidth="1.2" />
        ))}
      </g>

      {/* Tablier et arches */}
      <path
        fillRule="evenodd"
        fill="#e3d6bc"
        stroke="#4f3b2e"
        strokeWidth="1.8"
        strokeLinejoin="round"
        d={
          "M4 53H316V62H308V98H12V62H4Z " +
          arches
            .map((x) => `M${x + 5} 98V86A28 20 0 0 1 ${x + 61} 86V98Z`)
            .join(" ")
        }
      />
      <path d="M12 62H308" stroke="#4f3b2e" strokeWidth="1.2" fill="none" />

      {/* Reflets sous les arches */}
      {arches.map((x) => (
        <path
          key={x}
          d={`M${x + 5} 98V86A28 20 0 0 1 ${x + 61} 86V98Z`}
          fill="#cdd9bd"
          opacity="0.55"
        />
      ))}

      {/* La Seine */}
      <g fill="none" strokeLinecap="round" strokeWidth="2.2">
        <path
          d="M2 104q10-6 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 18 0"
          stroke="#778f60"
        />
        <path
          d="M12 115q10-6 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 16 0"
          stroke="#93a97c"
        />
        <path
          d="M2 126q10-6 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 18 0"
          stroke="#b0c29b"
        />
      </g>

      {/* Voilier */}
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M70 76V108" stroke="#4f3b2e" strokeWidth="1.6" />
        <path d="M72 78L88 104H72Z" fill="#fdfaf3" stroke="#4f3b2e" strokeWidth="1.4" />
        <path d="M68 84L57 104H68Z" fill="#f0dce8" stroke="#4f3b2e" strokeWidth="1.4" />
        <path
          d="M52 108H92L87 115H58Z"
          fill="#8a3f73"
          stroke="#4f3b2e"
          strokeWidth="1.4"
        />
      </g>
    </svg>
  );
}
