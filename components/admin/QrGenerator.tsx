"use client";

import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

import { defaultSources } from "@/data/site";
import { buildPlayUrl } from "@/lib/site-url";
import { cleanSource } from "@/lib/validation";

type Props = {
  /** Adresse publique du jeu (https://qcm-argenteuil.vercel.app par défaut). */
  siteUrl: string;
};

const CUSTOM = "__autre";
const NONE = "__aucune";

/** Réglages communs : brun très foncé sur blanc, correction d'erreur élevée. */
const QR_OPTIONS = {
  errorCorrectionLevel: "Q",
  color: { dark: "#122038", light: "#ffffff" },
} as const;

const PNG_SIZE = 2048;

const actionClasses =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

function download(href: string, filename: string): void {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function QrGenerator({ siteUrl }: Props) {
  const [choice, setChoice] = useState<string>(defaultSources[0].id);
  const [custom, setCustom] = useState("");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const source =
    choice === NONE ? null : choice === CUSTOM ? cleanSource(custom) : choice;
  const url = useMemo(() => buildPlayUrl(siteUrl, source), [siteUrl, source]);
  const fileBase = `qr-royaume-des-glaces${source ? `-${source}` : ""}`;

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(url, { ...QR_OPTIONS, type: "svg", margin: 2 })
      .then((markup) => {
        if (cancelled) return;
        setSvg(markup);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de générer le QR code pour cette adresse.");
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const downloadPng = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        ...QR_OPTIONS,
        width: PNG_SIZE,
        margin: 4,
      });
      download(dataUrl, `${fileBase}.png`);
    } catch {
      setError("Le téléchargement du PNG a échoué.");
    }
  };

  const downloadSvg = async () => {
    try {
      const markup = await QRCode.toString(url, {
        ...QR_OPTIONS,
        type: "svg",
        margin: 4,
        width: 1024,
      });
      const blobUrl = URL.createObjectURL(
        new Blob([markup], { type: "image/svg+xml;charset=utf-8" }),
      );
      download(blobUrl, `${fileBase}.svg`);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      setError("Le téléchargement du SVG a échoué.");
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const printQuery = (format: string) =>
    `/admin/qrcode/imprimer?format=${format}${source ? `&src=${encodeURIComponent(source)}` : ""}`;

  const options = [
    ...defaultSources.map((item) => ({ value: item.id as string, label: item.label })),
    { value: CUSTOM, label: "Autre…" },
    { value: NONE, label: "Sans source" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      {/* Réglages */}
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-givre-300 bg-white p-5 sm:p-6">
          <fieldset>
            <legend className="text-base font-semibold text-nuit-900">
              Où ce QR code sera-t-il placé ?
            </legend>
            <p className="mt-1 text-sm text-nuit-600">
              Le support est ajouté à l’adresse (<code>?src=…</code>) : vous
              saurez ainsi d’où viennent les participants.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {options.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-full border-2 px-4 py-2 text-[0.9375rem] font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ciel-500 ${
                    choice === option.value
                      ? "border-bleu-700 bg-bleu-700 text-white"
                      : "border-nuit-500 bg-white text-nuit-800 hover:border-bleu-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="source"
                    value={option.value}
                    checked={choice === option.value}
                    onChange={() => setChoice(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          {choice === CUSTOM ? (
            <div className="mt-4">
              <label htmlFor="source-libre" className="text-sm font-medium text-nuit-700">
                Nom du support
              </label>
              <input
                id="source-libre"
                type="text"
                value={custom}
                onChange={(event) => setCustom(event.target.value)}
                placeholder="ex. : marché, table 12, flyer"
                maxLength={40}
                className="mt-1 block h-11 w-full max-w-sm rounded-lg border border-nuit-500 bg-white px-3 text-nuit-900 placeholder:text-nuit-500 focus:border-bleu-700 focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-ciel-500"
              />
              <p className="mt-1 text-sm text-nuit-600">
                {source
                  ? `Enregistré sous : ${source}`
                  : "Lettres, chiffres et tirets ; les espaces et accents sont convertis."}
              </p>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-givre-300 bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-nuit-900">Adresse encodée</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <code className="min-w-0 flex-1 break-all rounded-lg bg-givre-100 px-3 py-2.5 font-mono text-sm text-nuit-900">
              {url}
            </code>
            <button
              type="button"
              onClick={copyUrl}
              className="h-11 rounded-full border border-nuit-500 px-4 text-[0.9375rem] font-semibold text-nuit-800 transition-colors hover:bg-givre-200 disabled:opacity-60"
            >
              {copied ? "Copié ✓" : "Copier"}
            </button>
          </div>
          <p className="sr-only" role="status">
            {copied ? "Adresse copiée dans le presse-papiers." : ""}
          </p>
          <p className="mt-3 text-sm text-nuit-600">
            Le QR code mène toujours à l’adresse publique du jeu, même quand
            cette page est ouverte ailleurs.
          </p>
        </section>

        <section className="rounded-2xl border border-givre-300 bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-nuit-900">Gabarits prêts à imprimer</h2>
          <p className="mt-1 text-sm text-nuit-600">
            Le titre du jeu, le QR code au centre et « Scannez-moi pour jouer ! ».
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={printQuery("a5")}
              target="_blank"
              rel="noopener"
              className={`${actionClasses} border-2 border-bleu-700 bg-white text-bleu-800 hover:bg-glace-100`}
            >
              Affichette A5
            </a>
            <a
              href={printQuery("chevalet")}
              target="_blank"
              rel="noopener"
              className={`${actionClasses} border-2 border-bleu-700 bg-white text-bleu-800 hover:bg-glace-100`}
            >
              Chevalet de table (A4 plié)
            </a>
          </div>
        </section>
      </div>

      {/* Aperçu et téléchargements */}
      <section
        aria-labelledby="titre-apercu"
        className="rounded-2xl border border-givre-300 bg-white p-5 sm:p-6"
      >
        <h2 id="titre-apercu" className="text-base font-semibold text-nuit-900">
          Aperçu
        </h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-givre-300 bg-white p-2">
          {svg ? (
            <div
              role="img"
              aria-label={`QR code vers ${url}`}
              className="aspect-square w-full [&>svg]:h-full [&>svg]:w-full"
              // Balisage SVG produit par la bibliothèque `qrcode` à partir de notre propre adresse.
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center text-nuit-600">
              Génération…
            </div>
          )}
        </div>

        {error ? (
          <p role="alert" className="mt-3 text-sm font-medium text-erreur-800">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={downloadPng}
            className={`${actionClasses} bg-bleu-700 text-white hover:bg-bleu-800`}
          >
            Télécharger PNG (haute résolution)
          </button>
          <button
            type="button"
            onClick={downloadSvg}
            className={`${actionClasses} border-2 border-bleu-700 bg-white text-bleu-800 hover:bg-glace-100`}
          >
            Télécharger SVG
          </button>
        </div>
        <p className="mt-3 text-sm text-nuit-600">
          PNG de {PNG_SIZE} × {PNG_SIZE} px, pour une impression nette jusqu’au
          format affiche. Le SVG est vectoriel : il s’agrandit sans perte.
        </p>
      </section>
    </div>
  );
}
