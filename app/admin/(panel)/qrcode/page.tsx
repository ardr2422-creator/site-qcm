import type { Metadata } from "next";

import { QrGenerator } from "@/components/admin/QrGenerator";
import { requireAdmin } from "@/lib/server/admin-auth";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = { title: "QR codes" };

export default async function QrCodePage() {
  await requireAdmin();

  return (
    <>
      <h1 className="font-serif text-3xl font-semibold leading-tight text-nuit-900">
        QR codes
      </h1>
      <p className="mt-1 max-w-2xl text-nuit-700">
        Générez un QR code par support (table, affiche, menu…) : chacun mène au
        jeu, et les statistiques indiquent ensuite lequel a été scanné.
      </p>
      <div className="mt-6">
        <QrGenerator siteUrl={getSiteUrl()} />
      </div>
    </>
  );
}
