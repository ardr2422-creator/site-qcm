import type { Metadata } from "next";

import { LiveJoin } from "@/components/quiz/LiveJoin";

export const metadata: Metadata = {
  title: "Partie en direct",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ code: string }> };

export default async function LiveJoinPage({ params }: Props) {
  const { code } = await params;
  return <LiveJoin code={code} />;
}
