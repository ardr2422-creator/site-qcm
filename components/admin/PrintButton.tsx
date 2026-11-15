"use client";

type Props = { label?: string };

/** Ouvre la boîte de dialogue d'impression du navigateur (ou « Enregistrer en PDF »). */
export function PrintButton({ label = "Imprimer / Enregistrer en PDF" }: Props) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-11 items-center rounded-full bg-asperge-700 px-6 font-semibold text-white transition-colors hover:bg-asperge-800"
    >
      {label}
    </button>
  );
}
