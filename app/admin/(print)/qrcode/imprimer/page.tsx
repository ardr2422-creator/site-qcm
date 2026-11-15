import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";

import { PrintButton } from "@/components/admin/PrintButton";
import { Asparagus } from "@/components/illustrations/Asparagus";
import { Bridge } from "@/components/illustrations/Bridge";
import { Fig } from "@/components/illustrations/Fig";
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
      className="shrink-0 rounded-[4mm] border border-creme-400 bg-white p-[3mm] outline outline-1 outline-offset-[1.5mm] outline-creme-400"
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

/** Affichette A5 portrait : 148 × 210 mm. */
function PosterA5({ svg, displayUrl }: { svg: string; displayUrl: string }) {
  return (
    <div className="relative flex h-[210mm] w-[148mm] flex-col items-center overflow-hidden bg-creme-50 text-center">
      <div className="nappe h-[5mm] w-full shrink-0" />
      <div className="flex w-full flex-1 flex-col items-center px-[12mm] pb-[7mm] pt-[9mm]">
        <p className="text-[9pt] font-semibold uppercase tracking-[0.18em] text-asperge-700">
          {typo(site.eyebrow)}
        </p>
        <h1 className="mt-[3mm] text-balance font-serif text-[27pt] font-semibold leading-[1.08] tracking-tight text-brun-900">
          {typo(site.title)}
        </h1>
        <p className="mt-[3mm] text-balance font-serif text-[13pt] italic leading-snug text-figue-600">
          {typo(site.tagline)}
        </p>

        <div className="my-auto flex flex-col items-center py-[5mm]">
          <QrBlock svg={svg} size="74mm" />
          <p className="mt-[7mm] font-serif text-[24pt] font-semibold leading-none text-figue-600">
            {typo(site.qrCallToAction)}
          </p>
          <p className="mt-[3mm] text-[10.5pt] text-brun-700">{typo(site.mention)}</p>
        </div>

        <div className="flex w-full items-end justify-between">
          <Asparagus className="h-[21mm] w-auto -rotate-6" />
          <div className="flex flex-col items-center">
            <Bridge className="w-[50mm]" />
            <p className="mt-[1.5mm] text-[7.5pt] text-brun-600">{displayUrl}</p>
          </div>
          <Fig className="h-[17mm] w-auto" />
        </div>
      </div>
    </div>
  );
}

/** Une face du chevalet : 210 × 148,5 mm (demi-A4, en largeur). */
function TentFace({ svg, displayUrl }: { svg: string; displayUrl: string }) {
  return (
    <div className="flex h-[148.5mm] w-[210mm] flex-col overflow-hidden bg-creme-50">
      <div className="nappe h-[5mm] w-full shrink-0" />
      <div className="flex flex-1 items-center gap-[10mm] px-[14mm] pb-[6mm] pt-[4mm]">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-[9pt] font-semibold uppercase tracking-[0.18em] text-asperge-700">
            {typo(site.eyebrow)}
          </p>
          <h1 className="mt-[3mm] text-balance font-serif text-[25pt] font-semibold leading-[1.08] tracking-tight text-brun-900">
            {typo(site.title)}
          </h1>
          <p className="mt-[3mm] text-balance font-serif text-[12.5pt] italic leading-snug text-figue-600">
            {typo(site.tagline)}
          </p>
          <div className="mt-[7mm] flex items-end gap-[5mm]">
            <Asparagus className="h-[19mm] w-auto -rotate-6" />
            <Fig className="h-[15mm] w-auto" />
            <Bridge className="w-[42mm]" />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center text-center">
          <QrBlock svg={svg} size="72mm" />
          <p className="mt-[6mm] font-serif text-[20pt] font-semibold leading-none text-figue-600">
            {typo(site.qrCallToAction)}
          </p>
          <p className="mt-[2.5mm] text-[9.5pt] text-brun-700">{typo(site.mention)}</p>
          <p className="mt-[1mm] text-[7.5pt] text-brun-600">{displayUrl}</p>
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
    color: { dark: "#2e1f16", light: "#ffffff" },
  });

  const query = (target: Format) =>
    `/admin/qrcode/imprimer?format=${target}${source ? `&src=${encodeURIComponent(source)}` : ""}`;

  const tabClasses = (active: boolean) =>
    `rounded-full px-4 py-2 text-[0.9375rem] font-semibold transition-colors ${
      active ? "bg-asperge-700 text-white" : "text-brun-700 hover:bg-creme-200"
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

      <header className="sticky top-0 z-10 border-b border-creme-400 bg-creme-50 print:hidden">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/admin/qrcode"
            className="text-[0.9375rem] font-medium text-brun-700 underline decoration-brun-400 underline-offset-4 hover:text-figue-600"
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
        <p className="mx-auto max-w-4xl px-4 pb-3 text-sm text-brun-600">
          {format === "a5"
            ? "Papier A5, marges « Aucune », et cochez « Graphiques d’arrière-plan » pour garder le fond crème."
            : "Papier A4, marges « Aucune », « Graphiques d’arrière-plan » coché. Pliez ensuite la feuille en deux sur le trait : les deux faces se lisent à l’endroit."}
          {source ? ` Source encodée : ${source}.` : " Aucune source encodée."}
        </p>
      </header>

      <main className="overflow-x-auto px-4 py-8 print:p-0">
        <div className="feuille mx-auto w-fit shadow-2xl print:shadow-none">
          {format === "a5" ? (
            <PosterA5 svg={svg} displayUrl={displayUrl} />
          ) : (
            <div className="relative h-[297mm] w-[210mm] overflow-hidden bg-creme-50">
              {/* Face arrière, tête en bas : elle se lit à l'endroit une fois la feuille pliée. */}
              <div className="rotate-180" aria-hidden="true">
                <TentFace svg={svg} displayUrl={displayUrl} />
              </div>
              <TentFace svg={svg} displayUrl={displayUrl} />
              <div
                className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-brun-400"
                aria-hidden="true"
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
