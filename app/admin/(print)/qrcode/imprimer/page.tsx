import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";

import { PrintButton } from "@/components/admin/PrintButton";
import { Logo } from "@/components/brand/Logo";
import {
  Flake,
  FrostFrieze,
  FrostStar,
  Snowflake,
  Sparkle,
} from "@/components/illustrations/Winter";
import { site } from "@/data/site";
import { requireAdmin } from "@/lib/server/admin-auth";
import { buildPlayUrl, getSiteUrl } from "@/lib/site-url";
import { typo } from "@/lib/typo";
import { cleanSource } from "@/lib/validation";

export const metadata: Metadata = { title: "Gabarit QR code" };
export const dynamic = "force-dynamic";

type Format = "a5" | "chevalet";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;


function QrBlock({ svg, size }: { svg: string; size: string }) {
  return (
    <div
      className="shrink-0 rounded-[4mm] border border-givre-400 bg-white p-[3mm] outline outline-1 outline-offset-[1.5mm] outline-givre-400"
      style={{ width: size, height: size }}
    >
      <div
        role="img"
        aria-label="QR code du jeu"
        className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
        // Balisage SVG produit par la bibliothèque `qrcode` à partir de l'adresse du site.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

/* ───────────────────── Flocons décoratifs des gabarits ───────────────────
   Positions en millimètres, choisies dans les marges : jamais sur le QR code
   (sa zone blanche doit rester libre pour la lecture) ni sur les textes, et
   toujours à 6 mm au moins des bords de la feuille, pour ne pas être coupées
   par l'imprimante.                                                         */

type Deco = { x: number; y: number; r: number; kind: "flocon" | "etoile" | "point"; tone?: "clair" | "vif" };

const TONES = { base: "#8fd2fb", clair: "#bde5fd", vif: "#38b6ff" } as const;

function SnowScatter({ width, height, items }: { width: number; height: number; items: Deco[] }) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      {items.map((d, i) => {
        const color = TONES[d.tone ?? "base"];
        if (d.kind === "flocon") {
          return <Flake key={i} x={d.x} y={d.y} r={d.r} color={color} width={Math.max(0.45, d.r * 0.14)} />;
        }
        if (d.kind === "etoile") return <Sparkle key={i} x={d.x} y={d.y} r={d.r} color={TONES[d.tone ?? "vif"]} />;
        return <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={color} />;
      })}
    </svg>
  );
}

/** A5 (148 × 210 mm) : marges de part et d'autre du logo, du QR code et de l'appel. */
const A5_FLAKES: Deco[] = [
  // en haut, de chaque côté du logo
  { x: 13, y: 21, r: 3.6, kind: "flocon" },
  { x: 20, y: 35, r: 1.2, kind: "point" },
  { x: 10, y: 46, r: 2, kind: "etoile" },
  { x: 138, y: 40, r: 3, kind: "flocon", tone: "clair" },
  { x: 130, y: 51, r: 1.2, kind: "point" },
  // à gauche du QR code
  { x: 13, y: 86, r: 4.6, kind: "flocon" },
  { x: 24, y: 101, r: 2.2, kind: "etoile" },
  { x: 11, y: 116, r: 3, kind: "flocon", tone: "clair" },
  { x: 25, y: 128, r: 1.2, kind: "point" },
  { x: 15, y: 144, r: 4.2, kind: "flocon" },
  // à droite du QR code
  { x: 136, y: 84, r: 3.2, kind: "flocon", tone: "clair" },
  { x: 125, y: 97, r: 1.3, kind: "point" },
  { x: 137, y: 111, r: 4.8, kind: "flocon" },
  { x: 125, y: 125, r: 2.4, kind: "etoile" },
  { x: 135, y: 141, r: 3, kind: "flocon", tone: "clair" },
  // de part et d'autre de « Scannez-moi pour jouer ! »
  { x: 11, y: 167, r: 2, kind: "etoile" },
  { x: 138, y: 166, r: 2.8, kind: "flocon" },
];

/** Une face du chevalet (210 × 148,5 mm) : au-dessus et au-dessous des textes. */
const TENT_FLAKES: Deco[] = [
  // au-dessus du logo
  { x: 20, y: 17, r: 3, kind: "flocon" },
  { x: 36, y: 27, r: 1.3, kind: "point" },
  { x: 52, y: 15, r: 2.2, kind: "etoile" },
  { x: 72, y: 24, r: 3.6, kind: "flocon", tone: "clair" },
  { x: 92, y: 14, r: 1.2, kind: "point" },
  { x: 106, y: 24, r: 2.6, kind: "flocon" },
  // au-dessous du sous-titre
  { x: 20, y: 125, r: 4.4, kind: "flocon" },
  { x: 35, y: 137, r: 1.3, kind: "point" },
  { x: 47, y: 119, r: 2.4, kind: "etoile" },
  { x: 63, y: 131, r: 3.2, kind: "flocon", tone: "clair" },
  { x: 81, y: 121, r: 1.3, kind: "point" },
  { x: 95, y: 134, r: 4, kind: "flocon" },
  { x: 110, y: 120, r: 2, kind: "etoile" },
  // au-dessus et au-dessous de la colonne du QR code
  { x: 134, y: 14, r: 1.2, kind: "point" },
  { x: 152, y: 15, r: 2, kind: "etoile" },
  { x: 188, y: 15, r: 2.8, kind: "flocon", tone: "clair" },
  { x: 136, y: 137, r: 2.2, kind: "etoile" },
  { x: 190, y: 136, r: 3, kind: "flocon" },
];

/** Affichette A5 portrait : 148 × 210 mm. */
function PosterA5({ svg, displayUrl }: { svg: string; displayUrl: string }) {
  return (
    <div className="relative flex h-[210mm] w-[148mm] flex-col items-center overflow-hidden bg-givre-50 text-center">
      <SnowScatter width={148} height={210} items={A5_FLAKES} />
      <div className="bandeau-givre relative h-[5mm] w-full shrink-0" />
      <div className="relative flex w-full flex-1 flex-col items-center px-[12mm] pb-[7mm] pt-[9mm]">
        <h1>
          <Logo priority title={typo(site.title)} className="w-[96mm]" />
        </h1>
        <p className="mt-[4mm] text-[9pt] font-semibold uppercase tracking-[0.18em] text-bleu-700">
          {typo(site.eyebrow)}
        </p>
        <p className="mt-[1.5mm] text-balance font-serif text-[13pt] italic leading-snug text-ciel-600">
          {typo(site.tagline)}
        </p>

        <div className="my-auto flex flex-col items-center py-[5mm]">
          <QrBlock svg={svg} size="74mm" />
          <p className="mt-[7mm] font-serif text-[24pt] font-semibold leading-none text-ciel-600">
            {typo(site.qrCallToAction)}
          </p>
          <p className="mt-[3mm] text-[10.5pt] text-nuit-700">{typo(site.mention)}</p>
        </div>

        <div className="flex w-full items-end justify-between">
          <Snowflake className="h-[17mm] w-auto" />
          <div className="flex flex-col items-center">
            <FrostFrieze count={6} className="w-[50mm]" />
            <p className="mt-[1.5mm] text-[7.5pt] text-nuit-600">{displayUrl}</p>
          </div>
          <FrostStar className="h-[15mm] w-auto" />
        </div>
      </div>
    </div>
  );
}

/** Une face du chevalet : 210 × 148,5 mm (demi-A4, en largeur). */
function TentFace({ svg, displayUrl }: { svg: string; displayUrl: string }) {
  return (
    <div className="relative flex h-[148.5mm] w-[210mm] flex-col overflow-hidden bg-givre-50">
      <SnowScatter width={210} height={148.5} items={TENT_FLAKES} />
      <div className="bandeau-givre relative h-[5mm] w-full shrink-0" />
      <div className="relative flex flex-1 items-center gap-[10mm] px-[14mm] pb-[6mm] pt-[4mm]">
        <div className="flex min-w-0 flex-1 flex-col">
          <h1>
            <Logo priority title={typo(site.title)} className="w-[92mm]" />
          </h1>
          <p className="mt-[6mm] text-[9pt] font-semibold uppercase tracking-[0.18em] text-bleu-700">
            {typo(site.eyebrow)}
          </p>
          <p className="mt-[1.5mm] text-balance font-serif text-[12.5pt] italic leading-snug text-ciel-600">
            {typo(site.tagline)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center text-center">
          <QrBlock svg={svg} size="72mm" />
          <p className="mt-[6mm] font-serif text-[20pt] font-semibold leading-none text-ciel-600">
            {typo(site.qrCallToAction)}
          </p>
          <p className="mt-[2.5mm] text-[9.5pt] text-nuit-700">{typo(site.mention)}</p>
          <p className="mt-[1mm] text-[7.5pt] text-nuit-600">{displayUrl}</p>
        </div>
      </div>
    </div>
  );
}

export default async function QrPrintPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;

  const format: Format = first(params.format) === "chevalet" ? "chevalet" : "a5";
  const source = cleanSource(first(params.src));
  const baseUrl = getSiteUrl();
  const playUrl = buildPlayUrl(baseUrl, source);
  const displayUrl = baseUrl.replace(/^https?:\/\//, "");

  const svg = await QRCode.toString(playUrl, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "Q",
    color: { dark: "#122038", light: "#ffffff" },
  });

  const query = (target: Format) =>
    `/admin/qrcode/imprimer?format=${target}${source ? `&src=${encodeURIComponent(source)}` : ""}`;

  const tabClasses = (active: boolean) =>
    `rounded-full px-4 py-2 text-[0.9375rem] font-semibold transition-colors ${
      active ? "bg-bleu-700 text-white" : "text-nuit-700 hover:bg-givre-200"
    }`;

  return (
    <>
      <style>{`
        @page { size: ${format === "a5" ? "A5" : "A4"} portrait; margin: 0; }
        @media print {
          html, body { background: #fff !important; }
          .feuille { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <header className="sticky top-0 z-10 border-b border-givre-400 bg-givre-50 print:hidden">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/admin/qrcode"
            className="text-[0.9375rem] font-medium text-nuit-700 underline decoration-nuit-400 underline-offset-4 hover:text-ciel-600"
          >
            ← Retour aux QR codes
          </Link>
          <nav aria-label="Format du gabarit" className="flex gap-1">
            <Link
              href={query("a5")}
              aria-current={format === "a5" ? "page" : undefined}
              className={tabClasses(format === "a5")}
            >
              Affichette A5
            </Link>
            <Link
              href={query("chevalet")}
              aria-current={format === "chevalet" ? "page" : undefined}
              className={tabClasses(format === "chevalet")}
            >
              Chevalet de table
            </Link>
          </nav>
          <PrintButton label="Imprimer" />
        </div>
        <p className="mx-auto max-w-4xl px-4 pb-3 text-sm text-nuit-600">
          {format === "a5"
            ? "Papier A5, marges « Aucune », et cochez « Graphiques d’arrière-plan » pour garder les couleurs."
            : "Papier A4, marges « Aucune », « Graphiques d’arrière-plan » coché. Pliez ensuite la feuille en deux sur le trait : les deux faces se lisent à l’endroit."}
          {source ? ` Source encodée : ${source}.` : " Aucune source encodée."}
        </p>
      </header>

      <main className="overflow-x-auto px-4 py-8 print:p-0">
        <div className="feuille mx-auto w-fit shadow-2xl print:shadow-none">
          {format === "a5" ? (
            <PosterA5 svg={svg} displayUrl={displayUrl} />
          ) : (
            <div className="relative h-[297mm] w-[210mm] overflow-hidden bg-givre-50">
              {/* Face arrière, tête en bas : elle se lit à l'endroit une fois la feuille pliée. */}
              <div className="rotate-180" aria-hidden="true">
                <TentFace svg={svg} displayUrl={displayUrl} />
              </div>
              <TentFace svg={svg} displayUrl={displayUrl} />
              <div
                className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-nuit-400"
                aria-hidden="true"
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
