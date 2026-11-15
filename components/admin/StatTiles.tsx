import { formatAverage, formatNumber, formatPercent, plural } from "@/lib/format";
import type { Totals } from "@/lib/stats";

type TileProps = {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  compact: boolean;
};

function Tile({ label, value, unit, hint, compact }: TileProps) {
  return (
    <div
      className={`break-inside-avoid border border-creme-300 bg-[#fffdf8] ${
        compact ? "rounded-lg px-3 py-3" : "rounded-2xl px-5 py-4"
      }`}
    >
      <dt
        className={`font-medium leading-snug text-brun-600 ${compact ? "text-xs" : "text-sm"}`}
      >
        {label}
      </dt>
      <dd className="mt-1.5">
        <span
          className={`font-semibold leading-none tracking-tight text-brun-900 ${
            compact ? "text-2xl" : "text-[2rem]"
          }`}
        >
          {value}
        </span>
        {unit ? (
          <span
            className={`ml-1 font-medium text-brun-600 ${compact ? "text-sm" : "text-lg"}`}
          >
            {unit}
          </span>
        ) : null}
        {hint ? (
          <span
            className={`mt-1.5 block leading-snug text-brun-600 ${compact ? "text-xs" : "text-sm"}`}
          >
            {hint}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

/** Les chiffres clés, en haut du tableau de bord. */
export function StatTiles({
  totals,
  compact = false,
}: {
  totals: Totals;
  /** Version imprimable : cinq tuiles serrées sur une ligne. */
  compact?: boolean;
}) {
  return (
    <dl
      className={
        compact
          ? "grid grid-cols-5 gap-2"
          : "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      }
    >
      <Tile
        compact={compact}
        label="Participants"
        value={formatNumber(totals.started)}
        hint={plural(totals.started, "partie démarrée", "parties démarrées")}
      />
      <Tile
        compact={compact}
        label="Parties terminées"
        value={formatNumber(totals.completed)}
        hint={
          totals.completionRate === null
            ? "Taux de complétion : —"
            : `Taux de complétion : ${formatPercent(totals.completionRate)}`
        }
      />
      <Tile
        compact={compact}
        label="Score moyen"
        value={formatAverage(totals.averageScore)}
        unit={`/ ${totals.totalQuestions}`}
        hint="Sur les parties terminées"
      />
      <Tile
        compact={compact}
        label="Note moyenne du jeu"
        value={formatAverage(totals.averageRating)}
        unit="/ 5"
        hint={`${formatNumber(totals.ratingCount)} ${plural(totals.ratingCount, "note", "notes")}`}
      />
      <Tile
        compact={compact}
        label="Commentaires"
        value={formatNumber(totals.commentCount)}
        hint={plural(totals.commentCount, "mot laissé", "mots laissés")}
      />
    </dl>
  );
}
