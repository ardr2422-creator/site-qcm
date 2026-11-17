import type { Metadata } from "next";
import Link from "next/link";

import { logoutAction } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { site } from "@/data/site";
import { requireAdmin } from "@/lib/server/admin-auth";
import { typo } from "@/lib/typo";

export const metadata: Metadata = {
  title: { default: "Espace organisateur", template: "%s · Espace organisateur" },
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();

  return (
    <div className="min-h-dvh bg-givre-100 text-base">
      <header className="border-b border-givre-300 bg-givre-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link href="/admin" className="mr-auto min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-bleu-700">
              Espace organisateur
            </span>
            <span className="block truncate font-serif text-lg font-semibold leading-tight text-nuit-900">
              {typo(site.title)}
            </span>
          </Link>
          <AdminNav />
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full border border-nuit-500 px-4 py-2 text-[0.9375rem] font-semibold text-nuit-700 transition-colors hover:bg-givre-200 hover:text-nuit-900"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
