import type { Metadata } from "next";

import { ResultScreen } from "@/components/quiz/ResultScreen";

export const metadata: Metadata = {
  title: "Votre résultat",
};

export default function ResultPage() {
  return <ResultScreen />;
}
