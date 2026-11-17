import type { Metadata } from "next";

import { Snowfall } from "@/components/illustrations/Snowfall";
import { requireAdmin } from "@/lib/server/admin-auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Écran à projeter (classement en direct) : plein écran, sans menu, avec la neige. */
export default async function ScreenLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return (
    <div className="relative min-h-dvh overflow-hidden bg-givre-100">
      <Snowfall />
      <div className="bandeau-givre relative z-10 h-3" aria-hidden="true" />
      <main className="relative z-10">{children}</main>
    </div>
  );
}
