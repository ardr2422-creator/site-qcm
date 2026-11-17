"use client";

import { useState } from "react";

import { formatNumber, plural } from "@/lib/format";
import type { DashboardStats, TimePoint } from "@/lib/stats";

import { ChartCard } from "./ChartCard";
import { ColumnChart, type ColumnPoint } from "./charts";

type Mode = "hour" | "day";

type Props = {
  timeline: DashboardStats["timeline"];
  fixedWidth?: number;
  height?: number;
  /** Version imprimable : pas de sélecteur, vue par défaut uniquement. */
  print?: boolean;
};

const toPoints = (points: TimePoint[]): ColumnPoint[] =>
  points.map((point) => ({
    key: point.key,
    label: point.label,
    fullLabel: point.fullLabel,
    value: point.count,
    display: `${formatNumber(point.count)} ${plural(point.count, "participant", "participants")}`,
  }));

/** Participations dans le temps, par heure ou par jour. */
export function TimelineCard({ timeline, fixedWidth, height = 250, print = false }: Props) {
  const [mode, setMode] = useState<Mode>(timeline.defaultMode);
  const points = mode === "hour" ? timeline.hourly : timeline.daily;

  const selector = print ? null : (
    <div
      role="group"
      aria-label="Regrouper les participations"
      className="inline-flex rounded-full border border-givre-400 bg-givre-100 p-0.5 text-sm font-semibold"
    >
      {(
        [
          ["hour", "Par heure"],
          ["day", "Par jour"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => setMode(value)}
          className={`rounded-full px-3.5 py-1.5 transition-colors ${
            mode === value
              ? "bg-bleu-700 text-white"
              : "text-nuit-700 hover:text-nuit-900"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard
      compact={print}
      title="Participations dans le temps"
      subtitle={
        mode === "day"
          ? "Parties démarrées, jour par jour"
          : timeline.hourlyKind === "profile"
            ? "Parties démarrées selon l’heure de la journée, tous jours confondus"
            : "Parties démarrées, heure par heure (heure de Paris)"
      }
      action={selector}
      table={{
        columns: [mode === "hour" ? "Créneau" : "Jour", "Participants"],
        rows: points.map((point) => [point.fullLabel, point.count]),
      }}
    >
      <ColumnChart
        data={toPoints(points)}
        fixedWidth={fixedWidth}
        height={height}
        showValues={points.length <= 14}
        ariaLabel={`Participations ${mode === "hour" ? "par heure" : "par jour"}`}
      />
    </ChartCard>
  );
}
