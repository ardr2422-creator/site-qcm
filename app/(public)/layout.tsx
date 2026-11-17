import Link from "next/link";

import { ClientRuntime } from "@/components/quiz/ClientRuntime";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-bleu-700 focus:px-5 focus:py-3 focus:font-semibold focus:text-white"
      >
        Aller au contenu
      </a>

      <div className="bandeau-givre h-3 shrink-0" aria-hidden="true" />

      <main
        id="contenu"
        className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-5 sm:py-10"
      >
        {children}
      </main>

      <ClientRuntime />

      <footer className="px-4 pb-6 pt-2 text-center text-sm text-nuit-600">
        <p>
          Jeu gratuit et anonyme ·{" "}
          <Link
            href="/confidentialite"
            className="font-medium text-nuit-700 underline decoration-nuit-400 underline-offset-4 hover:text-ciel-600"
          >
            Confidentialité
          </Link>
        </p>
      </footer>
    </div>
  );
}
