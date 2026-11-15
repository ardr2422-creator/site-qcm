import type { ReactNode } from "react";

export type TableData = {
  columns: string[];
  rows: (string | number)[][];
};

type Props = {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Données du graphique, proposées dans un tableau dépliable. */
  table?: TableData;
  /** Contrôle affiché à droite du titre (sélecteur heure / jour…). */
  action?: ReactNode;
  className?: string;
  /** Niveau du titre : 3 dans le tableau de bord (sous un h2). */
  headingLevel?: 2 | 3;
  /** Version imprimable : marges réduites, pas de tableau dépliable. */
  compact?: boolean;
};

/** Carte blanche contenant un graphique, son titre et son tableau de données. */
export function ChartCard({
  title,
  subtitle,
  children,
  table,
  action,
  className = "",
  headingLevel = 3,
  compact = false,
}: Props) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <section
      className={`min-w-0 break-inside-avoid border border-creme-300 bg-[#fffdf8] ${
        compact ? "rounded-lg p-4" : "rounded-2xl p-5"
      } ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <Heading className="text-base font-semibold leading-snug text-brun-900">
            {title}
          </Heading>
          {subtitle ? (
            <p className="mt-0.5 text-sm leading-snug text-brun-600">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>

      <div className="mt-4">{children}</div>

      {table && table.rows.length > 0 && !compact ? (
        <details className="group mt-3 text-sm print:hidden">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md py-1 font-medium text-brun-600 hover:text-brun-900 [&::-webkit-details-marker]:hidden">
            <svg
              viewBox="0 0 12 12"
              width="12"
              height="12"
              aria-hidden="true"
              className="transition-transform group-open:rotate-90"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4.5 2.5L8 6l-3.5 3.5" />
            </svg>
            Voir les données
          </summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-left tabular-nums">
              <thead>
                <tr className="border-b border-creme-300 text-brun-600">
                  {table.columns.map((column, index) => (
                    <th
                      key={column}
                      scope="col"
                      className={`py-1.5 pr-3 font-medium ${index > 0 ? "text-right" : ""}`}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-creme-200 last:border-0">
                    {row.map((cell, index) =>
                      index === 0 ? (
                        <th
                          key={index}
                          scope="row"
                          className="py-1.5 pr-3 font-normal text-brun-900"
                        >
                          {cell}
                        </th>
                      ) : (
                        <td key={index} className="py-1.5 pr-3 text-right text-brun-900">
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </section>
  );
}
