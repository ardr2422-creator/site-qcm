"use client";

import type { ReactNode } from "react";

import { formatNumber, formatPercent, plural } from "@/lib/format";
import type { CountRow, DashboardStats, QuestionStats } from "@/lib/stats";
import { typo } from "@/lib/typo";

import { ChartCard } from "./ChartCard";
import { BarList, ColumnChart, type BarListRow } from "./charts";
import { TimelineCard } from "./TimelineCard";

type Props = {
  stats: DashboardStats;
  /**
   * Version imprimable : largeurs fixes, pas d'éléments interactifs, et une
   * composition en trois pages A4 (synthèse, devinettes, public).
   */
  print?: boolean;
  /** Contenu ajouté à la fin de la dernière page imprimée (mots des participants). */
  printFooter?: ReactNode;
};

/**
 * Version imprimable : la feuille fait 664 px de large (A4 moins les marges).
 * Largeur intérieure d'une carte pleine largeur, et d'une carte en demi-largeur
 * (deux colonnes séparées de 12 px ; 16 px de marge intérieure, 1 px de bord).
 */
const PRINT_FULL = 664 - 2 * 17;
const PRINT_HALF = (664 - 12) / 2 - 2 * 17;

function SectionTitle({
  children,
  hint,
  compact,
}: {
  children: string;
  hint?: string;
  compact: boolean;
}) {
  return (
    <div className={`mb-3 break-after-avoid ${compact ? "mt-5" : "mt-9"}`}>
      <h2
        className={`font-serif font-semibold text-nuit-900 ${compact ? "text-lg" : "text-xl"}`}
      >
        {children}
      </h2>
      {hint ? <p className="mt-0.5 text-sm text-nuit-600">{hint}</p> : null}
    </div>
  );
}

const answersLabel = (count: number) =>
  `${formatNumber(count)} ${plural(count, "réponse", "réponses")}`;

function successRows(questions: QuestionStats[]): BarListRow[] {
  return [...questions]
    .sort((a, b) => (b.correctRate ?? -1) - (a.correctRate ?? -1))
    .map((q) => ({
      key: String(q.id),
      label: `Devinette ${q.number} · ${typo(q.correctLabel)}`,
      value: q.correctRate ?? 0,
      display: q.correctRate === null ? "—" : formatPercent(q.correctRate),
      detail:
        q.answered > 0
          ? `${formatNumber(q.correct)} ${plural(q.correct, "bonne réponse", "bonnes réponses")} sur ${formatNumber(q.answered)}`
          : "Aucune réponse pour l’instant",
    }));
}

function optionRows(question: QuestionStats): BarListRow[] {
  return question.options.map((option) => ({
    key: option.id,
    label: typo(option.label),
    value: option.share,
    display: formatPercent(option.share),
    detail: `${answersLabel(option.count)} sur ${formatNumber(question.answered)}${option.isCorrect ? " — bonne réponse" : ""}`,
    highlight: option.isCorrect,
    muted: !option.isCorrect,
  }));
}

function countRows(rows: CountRow[]): BarListRow[] {
  return rows.map((row) => ({
    key: row.label,
    label: typo(row.label),
    value: row.count,
    display: formatNumber(row.count),
    detail: `${formatPercent(row.share)} des participants`,
  }));
}

export function DashboardCharts({ stats, print = false, printFooter }: Props) {
  const full = print ? PRINT_FULL : undefined;
  const half = print ? PRINT_HALF : undefined;
  const { questions, totals } = stats;
  const completedLabel = `${formatNumber(totals.completed)} ${plural(totals.completed, "partie terminée", "parties terminées")}`;
  const columnHeight = print ? 170 : 250;

  /* ── Taux de bonnes réponses ── */
  const successCard = (
    <ChartCard
      compact={print}
      title="Taux de bonnes réponses par devinette"
      subtitle="De la plus facile à la plus difficile"
      table={{
        columns: ["Devinette", "Réponses", "Bonnes réponses", "Taux"],
        rows: successRows(questions).map((row) => {
          const q = questions.find((item) => String(item.id) === row.key) as QuestionStats;
          return [row.label, q.answered, q.correct, row.display];
        }),
      }}
    >
      <BarList
        rows={successRows(questions)}
        max={100}
        fixedWidth={full}
        dense={print}
        ariaLabel="Taux de bonnes réponses par devinette"
      />
    </ChartCard>
  );

  /* ── Répartition des réponses, devinette par devinette ── */
  const optionCards = questions.map((question, index) => {
    // À l'impression (deux colonnes), une dernière carte isolée prend toute la largeur.
    const alone = print && index === questions.length - 1 && questions.length % 2 === 1;
    return (
      <ChartCard
        key={question.id}
        compact={print}
        className={alone ? "col-span-2" : ""}
        title={
          print
            ? `Devinette ${question.number}`
            : `Devinette ${question.number} — répartition des réponses`
        }
        subtitle={
          <>
            <span className="line-clamp-2" title={typo(question.text)}>
              {typo(question.text)}
            </span>
            <span className="mt-1 block font-medium text-nuit-700">
              {question.correctRate === null
                ? "Aucune réponse pour l’instant"
                : `${formatPercent(question.correctRate)} de bonnes réponses · ${answersLabel(question.answered)}`}
            </span>
          </>
        }
        table={{
          columns: ["Réponse proposée", "Réponses", "Part"],
          rows: question.options.map((option) => [
            `${option.isCorrect ? "✓ " : ""}${typo(option.label)}`,
            option.count,
            formatPercent(option.share),
          ]),
        }}
      >
        <BarList
          rows={optionRows(question)}
          max={100}
          fixedWidth={alone ? full : half}
          dense={print}
          ariaLabel={`Répartition des réponses à la devinette ${question.number}`}
        />
      </ChartCard>
    );
  });

  /* ── Scores et fréquentation ── */
  const scoreCard = (
    <ChartCard
      compact={print}
      title="Distribution des scores"
      subtitle={`Nombre de participants par score · ${completedLabel}`}
      table={{
        columns: ["Score", "Participants", "Part"],
        rows: stats.scoreDistribution.map((row) => [
          `${row.score} / ${totals.totalQuestions}`,
          row.count,
          formatPercent(row.share),
        ]),
      }}
    >
      <ColumnChart
        data={stats.scoreDistribution.map((row) => ({
          key: String(row.score),
          label: `${row.score}/${totals.totalQuestions}`,
          fullLabel: `Score de ${row.score} sur ${totals.totalQuestions}`,
          value: row.count,
          display: `${formatNumber(row.count)} ${plural(row.count, "participant", "participants")}`,
          detail: `${formatPercent(row.share)} des parties terminées`,
        }))}
        fixedWidth={half}
        height={columnHeight}
        showValues
        ariaLabel="Distribution des scores"
      />
    </ChartCard>
  );

  const timelineCard = (
    <TimelineCard
      timeline={stats.timeline}
      fixedWidth={half}
      height={columnHeight}
      print={print}
    />
  );

  /* ── Parcours et public ── */
  const funnelCard = (
    <ChartCard
      compact={print}
      title="Entonnoir d’abandon"
      subtitle="Combien de participants ont répondu à chaque devinette"
      table={{
        columns: ["Étape", "Participants", "Part des parties démarrées"],
        rows: stats.funnel.map((step) => [step.label, step.count, formatPercent(step.share)]),
      }}
    >
      <BarList
        rows={stats.funnel.map((step) => ({
          key: step.label,
          label: step.label,
          value: step.count,
          display: `${formatNumber(step.count)} · ${formatPercent(step.share)}`,
          detail: `${formatPercent(step.share)} des parties démarrées`,
        }))}
        max={Math.max(1, totals.started)}
        fixedWidth={half}
        dense={print}
        ariaLabel="Entonnoir d’abandon"
      />
    </ChartCard>
  );

  const districtCard = (
    <ChartCard
      compact={print}
      title="Répartition par quartier"
      subtitle="Quartier indiqué par les participants"
      table={{
        columns: ["Quartier", "Participants", "Part"],
        rows: stats.districts.map((row) => [typo(row.label), row.count, formatPercent(row.share)]),
      }}
    >
      <BarList
        rows={countRows(stats.districts)}
        fixedWidth={half}
        dense={print}
        ariaLabel="Répartition des participants par quartier"
      />
    </ChartCard>
  );

  const sourceCard = (
    <ChartCard
      compact={print}
      title="Répartition par source"
      subtitle="Support scanné (paramètre ?src= du QR code)"
      table={{
        columns: ["Source", "Participants", "Part"],
        rows: stats.sources.map((row) => [row.label, row.count, formatPercent(row.share)]),
      }}
    >
      <BarList
        rows={countRows(stats.sources)}
        fixedWidth={half}
        dense={print}
        ariaLabel="Répartition des participants par source"
      />
    </ChartCard>
  );

  /* ── Version imprimable : trois pages composées ── */
  if (print) {
    return (
      <div>
        {/* Page 1 — synthèse (à la suite des chiffres clés) */}
        <SectionTitle compact hint="De la devinette la mieux connue à la moins connue.">
          Ce que les participants connaissent de leur ville
        </SectionTitle>
        {successCard}
        <SectionTitle compact>Scores et fréquentation</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {scoreCard}
          {timelineCard}
        </div>

        {/* Page 2 — le détail des réponses */}
        <div className="break-before-page">
          <SectionTitle
            compact
            hint="Pour chaque devinette, la part des participants ayant choisi chaque réponse (✓ = bonne réponse)."
          >
            Les réponses, devinette par devinette
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">{optionCards}</div>
        </div>

        {/* Page 3 — parcours, public et mots des participants */}
        <div className="break-before-page">
          <SectionTitle compact>Parcours et public</SectionTitle>
          <div className="grid grid-cols-2 items-start gap-3">
            <div className="flex flex-col gap-3">
              {funnelCard}
              {sourceCard}
            </div>
            {districtCard}
          </div>
          {printFooter}
        </div>
      </div>
    );
  }

  /* ── Tableau de bord ── */
  return (
    <div>
      <div className="mb-3">
        <h2 className="font-serif text-xl font-semibold text-nuit-900">Les devinettes</h2>
        <p className="mt-0.5 text-sm text-nuit-600">
          Ce que les participants connaissent — ou pas — de leur ville.
        </p>
      </div>
      {successCard}
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{optionCards}</div>

      <SectionTitle compact={false}>Scores et fréquentation</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        {scoreCard}
        {timelineCard}
      </div>

      <SectionTitle compact={false}>Parcours et public</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-3">
        {funnelCard}
        {districtCard}
        {sourceCard}
      </div>
    </div>
  );
}
