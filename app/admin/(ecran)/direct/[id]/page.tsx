import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { LiveBoard } from "@/components/admin/LiveBoard";
import { liveJoinUrl } from "@/lib/live";
import { requireAdmin } from "@/lib/server/admin-auth";
import { getLiveBoard } from "@/lib/server/live";
import { getSiteUrl } from "@/lib/site-url";
import { isUuid } from "@/lib/validation";

export const metadata: Metadata = { title: "Classement en direct" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function LiveScreenPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const board = await getLiveBoard(id);
  if (!board) notFound();

  const joinUrl = liveJoinUrl(getSiteUrl(), board.game.code);
  const qrSvg = await QRCode.toString(joinUrl, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "Q",
    color: { dark: "#122038", light: "#ffffff" },
  });

  return <LiveBoard initial={board} joinUrl={joinUrl} qrSvg={qrSvg} />;
}
