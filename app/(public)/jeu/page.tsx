import type { Metadata } from "next";

import { GameScreen } from "@/components/quiz/GameScreen";

export const metadata: Metadata = {
  title: "Le jeu",
};

export default function GamePage() {
  return <GameScreen />;
}
