import type { Metadata } from "next";

import { requireAdmin } from "@/lib/server/admin-auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Pages destinées à l'impression : pas de menu, fond neutre à l'écran. */
export default async function PrintLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return <div className="min-h-dvh bg-creme-200 text-base print:bg-white">{children}</div>;
}
