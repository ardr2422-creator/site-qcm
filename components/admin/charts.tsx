"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Graphiques du tableau de bord (Recharts).
 *
 * Parti pris : des graphiques sobres, d'une seule teinte (bleu profond),
 * avec les valeurs écrites en clair. Une couleur n'apparaît en plus que
 * pour mettre un élément en évidence (la bonne réponse d'une devinette).
 * Chaque graphique est doublé d'un tableau de données dépliable.
 */

export const CHART_COLORS = {
  /** Série principale — bleu profond (contraste 6,8:1 sur le fond blanc des cartes). */
  series: "#2259ad",
  /** Éléments de second plan (réponses incorrectes) : toujours accompagnés de leur valeur écrite. */
  muted: "#a9b9cc",
  grid: "#e3ebf4",
  /** Rail clair derrière les barres horizontales (repère des 100 %). */
  track: "#edf2f8",
  axis: "#475a73",
  ink: "#122038",
  hover: "rgba(34, 89, 173, 0.07)",
} as const;

const FONT_SIZE = 13;

/* ─────────────────────────── Mesure du conteneur ──────────────────────── */

type MeasuredProps = {
  height: number;
  /** Largeur imposée (version imprimable) ; sinon celle du conteneur. */
  fixedWidth?: number;
  children: (width: number) => ReactNode;
};

/**
 * Donne au graphique la largeur exacte de son conteneur. Réserver la hauteur
 * dès le premier rendu évite tout saut de mise en page.
 */
function Measured({ height, fixedWidth, children }: MeasuredProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState(0);

  useEffect(() => {
    if (fixedWidth) return;
    const element = ref.current;
    if (!element) return;
    const update = () => setMeasured(Math.floor(element.getBoundingClientRect().width));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [fixedWidth]);

  const width = fixedWidth ?? measured;

  return (
    <div ref={ref} style={{ height, width: fixedWidth ?? "100%" }}>
      {width > 0 ? children(width) : null}
    </div>
  );
}

/* ─────────────────────────────── Infobulle ────────────────────────────── */

type TooltipRow = { title: string; value: string; detail?: string };

function TooltipCard({ title, value, detail }: TooltipRow) {
  return (
    <div className="max-w-64 rounded-lg border border-givre-300 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="text-base font-semibold leading-tight text-nuit-900">{value}</p>
      <p className="mt-0.5 leading-snug text-nuit-700">{title}</p>
      {detail ? <p className="mt-0.5 leading-snug text-nuit-600">{detail}</p> : null}
    </div>
  );
}

type RechartsTooltipProps<Row> = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: Row }>;
};

/* ───────────────────────── Barres horizontales ────────────────────────── */

export type BarListRow = {
  key: string;
  label: string;
  /** Longueur de la barre. */
  value: number;
  /** Valeur écrite à droite, déjà mise en forme (« 62 % », « 24 »…). */
  display: string;
  /** Précision affichée dans l'infobulle. */
  detail?: string;
  /** Mise en évidence (libellé en gras précédé d'une coche). */
  highlight?: boolean;
  /** Barre en couleur de second plan. */
  muted?: boolean;
};

type BarListProps = {
  rows: BarListRow[];
  /** Valeur correspondant à une barre pleine (100 pour des pourcentages). */
  max?: number;
  fixedWidth?: number;
  /** Lignes resserrées (version imprimable). */
  dense?: boolean;
  ariaLabel: string;
};

/** Hauteur d'une ligne : libellé au-dessus, barre centrée en dessous. */
const ROW_HEIGHT = 46;
const ROW_HEIGHT_DENSE = 38;
const BAR_SIZE = 12;
const BAR_SIZE_DENSE = 9;
/** Marge haute, pour que le premier libellé ne soit pas rogné. */
const LIST_TOP = 6;

type LabelContentProps = {
  x?: number | string;
  y?: number | string;
  index?: number;
};

/**
 * Liste de barres horizontales : le libellé et la valeur sont écrits sur une
 * ligne au-dessus de chaque barre. Les libellés longs restent donc lisibles,
 * y compris sur un téléphone.
 */
export function BarList({ rows, max, fixedWidth, dense = false, ariaLabel }: BarListProps) {
  const rowHeight = dense ? ROW_HEIGHT_DENSE : ROW_HEIGHT;
  const fontSize = dense ? 12 : FONT_SIZE;
  const height = rows.length * rowHeight + LIST_TOP;
  const domainMax = max ?? Math.max(1, ...rows.map((row) => row.value));

  return (
    <Measured height={height} fixedWidth={fixedWidth}>
      {(width) => {
        const renderRowLabel = (props: LabelContentProps): ReactElement | null => {
          const row = props.index !== undefined ? rows[props.index] : undefined;
          if (!row) return null;
          const x = Number(props.x ?? 0);
          // Ligne de base du texte, juste au-dessus de la barre.
          const y = Number(props.y ?? 0) - (dense ? 6 : 8);
          // Largeur disponible pour le libellé, valeur de droite déduite.
          const valueWidth = row.display.length * (fontSize * 0.56) + 12;
          const maxChars = Math.max(8, Math.floor((width - valueWidth) / (fontSize * 0.51)));
          const text = `${row.highlight ? "✓ " : ""}${row.label}`;
          const shown =
            text.length > maxChars ? `${text.slice(0, maxChars - 1).trimEnd()}…` : text;

          return (
            <g>
              <text
                x={x}
                y={y}
                fontSize={fontSize}
                fontWeight={row.highlight ? 700 : 500}
                fill={CHART_COLORS.ink}
              >
                {shown}
              </text>
              <text
                x={width}
                y={y}
                textAnchor="end"
                fontSize={fontSize}
                fontWeight={600}
                fill={CHART_COLORS.ink}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {row.display}
              </text>
            </g>
          );
        };

        return (
          <BarChart
            layout="vertical"
            width={width}
            height={height}
            data={rows}
            margin={{ top: LIST_TOP, right: 0, bottom: 0, left: 0 }}
            barCategoryGap={0}
            accessibilityLayer
            role="img"
            aria-label={ariaLabel}
          >
            <XAxis type="number" hide domain={[0, domainMax]} />
            <YAxis type="category" dataKey="key" hide />
            <Tooltip
              cursor={{ fill: CHART_COLORS.hover }}
              isAnimationActive={false}
              content={({ active, payload }: RechartsTooltipProps<BarListRow>) => {
                const row = payload?.[0]?.payload;
                return active && row ? (
                  <TooltipCard title={row.label} value={row.display} detail={row.detail} />
                ) : null;
              }}
            />
            <Bar
              dataKey="value"
              barSize={dense ? BAR_SIZE_DENSE : BAR_SIZE}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
              background={{ fill: CHART_COLORS.track, radius: 4 }}
            >
              {rows.map((row) => (
                <Cell
                  key={row.key}
                  fill={row.muted ? CHART_COLORS.muted : CHART_COLORS.series}
                />
              ))}
              <LabelList content={renderRowLabel} />
            </Bar>
          </BarChart>
        );
      }}
    </Measured>
  );
}

/* ────────────────────────── Barres verticales ─────────────────────────── */

export type ColumnPoint = {
  key: string;
  /** Libellé court sous la barre. */
  label: string;
  /** Libellé complet (infobulle). */
  fullLabel?: string;
  value: number;
  /** Texte de l'infobulle (« 12 participants »). */
  display: string;
  detail?: string;
};

type ColumnChartProps = {
  data: ColumnPoint[];
  height?: number;
  fixedWidth?: number;
  ariaLabel: string;
  /** Écrit la valeur au-dessus de chaque barre (à réserver aux séries courtes). */
  showValues?: boolean;
};

export function ColumnChart({
  data,
  height = 250,
  fixedWidth,
  ariaLabel,
  showValues = false,
}: ColumnChartProps) {
  const labels = new Map(data.map((point) => [point.key, point.label]));

  return (
    <Measured height={height} fixedWidth={fixedWidth}>
      {(width) => (
        <BarChart
          width={width}
          height={height}
          data={data}
          margin={{ top: 22, right: 6, bottom: 0, left: 0 }}
          barCategoryGap="18%"
          accessibilityLayer
          role="img"
          aria-label={ariaLabel}
        >
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="key"
            tickFormatter={(key: string) => labels.get(key) ?? key}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grid }}
            tick={{ fontSize: 12, fill: CHART_COLORS.axis }}
            interval="preserveStartEnd"
            minTickGap={14}
            tickMargin={6}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={34}
            tick={{ fontSize: 12, fill: CHART_COLORS.axis }}
          />
          <Tooltip
            cursor={{ fill: CHART_COLORS.hover }}
            isAnimationActive={false}
            content={({ active, payload }: RechartsTooltipProps<ColumnPoint>) => {
              const point = payload?.[0]?.payload;
              return active && point ? (
                <TooltipCard
                  title={point.fullLabel ?? point.label}
                  value={point.display}
                  detail={point.detail}
                />
              ) : null;
            }}
          />
          <Bar
            dataKey="value"
            fill={CHART_COLORS.series}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            isAnimationActive={false}
          >
            {showValues ? (
              <LabelList
                dataKey="value"
                position="top"
                offset={6}
                fontSize={FONT_SIZE}
                fontWeight={600}
                fill={CHART_COLORS.ink}
              />
            ) : null}
          </Bar>
        </BarChart>
      )}
    </Measured>
  );
}
