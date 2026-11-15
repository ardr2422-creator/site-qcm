/**
 * npm run reset — vide entièrement la base (parties, réponses, avis).
 * À lancer avant le vrai lancement, après les démonstrations.
 *
 *   npm run reset            → demande une confirmation
 *   npm run reset -- --yes   → sans confirmation (scripts automatiques)
 *
 * ⚠ Opération irréversible : pensez à exporter les CSV avant si besoin.
 */

import { createInterface } from "node:readline/promises";

import { countRows, describeTarget, getScriptClient } from "./_client.ts";

const CONFIRMATION_WORD = "SUPPRIMER";

async function main(): Promise<void> {
  const supabase = getScriptClient();
  const skipPrompt = process.argv.includes("--yes");

  const [sessions, answers, feedback] = await Promise.all([
    countRows(supabase, "sessions"),
    countRows(supabase, "answers"),
    countRows(supabase, "feedback"),
  ]);

  console.log(
    `\nBase ciblée : ${describeTarget()}\n` +
      `Contenu actuel : ${sessions} partie(s), ${answers} réponse(s), ${feedback} avis.`,
  );

  if (sessions + answers + feedback === 0) {
    console.log("\n✓ La base est déjà vide, rien à faire.\n");
    return;
  }

  if (!skipPrompt) {
    if (!process.stdin.isTTY) {
      console.error(
        "\n✗ Confirmation impossible dans ce terminal. Relancez avec : npm run reset -- --yes\n",
      );
      process.exit(1);
    }
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await prompt.question(
      `\n⚠ Tout va être supprimé définitivement.\nTapez ${CONFIRMATION_WORD} pour confirmer : `,
    );
    prompt.close();
    if (answer.trim() !== CONFIRMATION_WORD) {
      console.log("\nAnnulé : rien n'a été supprimé.\n");
      return;
    }
  }

  // Les réponses et les avis sont supprimés en cascade avec leur partie ;
  // on les efface malgré tout explicitement, par sécurité.
  for (const table of ["feedback", "answers", "sessions"] as const) {
    const { error } = await supabase.from(table).delete().not("id", "is", null);
    if (error) throw new Error(`Suppression dans « ${table} » : ${error.message}`);
  }

  const remaining = await countRows(supabase, "sessions");
  if (remaining > 0) {
    throw new Error(`${remaining} partie(s) n'ont pas pu être supprimées.`);
  }

  console.log("\n✓ Base vidée. Le jeu est prêt pour le vrai lancement.\n");
}

main().catch((error: unknown) => {
  console.error(`\n✗ ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
