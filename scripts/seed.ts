/**
 * npm run seed — injecte de fausses participations réalistes, pour que le
 * tableau de bord soit parlant pendant une démonstration.
 *
 *   npm run seed              → 80 participations (+ quelques parties rejouées)
 *   npm run seed -- --count 150
 *   npm run seed -- --force   → autorise l'ajout dans une base non vide
 *
 * Avant le vrai lancement, videz tout avec : npm run reset
 */

import { districts, DISTRICT_OTHER } from "../data/districts.ts";
import { getCorrectOption, questions } from "../data/questions.ts";
import { countRows, describeTarget, getScriptClient } from "./_client.ts";

/* ─────────────────────────── Hasard reproductible ─────────────────────── */

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(1874); // 1874 : l'année où Monet peint le pont.

const chance = (probability: number) => random() < probability;
const between = (min: number, max: number) => min + random() * (max - min);
const pick = <T,>(items: readonly T[]): T => items[Math.floor(random() * items.length)];

function weighted<T>(entries: readonly (readonly [T, number])[]): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let cursor = random() * total;
  for (const [value, weight] of entries) {
    cursor -= weight;
    if (cursor <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

function uuid(): string {
  const hex = Array.from({ length: 32 }, () => Math.floor(random() * 16).toString(16));
  hex[12] = "4";
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const s = hex.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

/* ───────────────────────────── Ingrédients ────────────────────────────── */

const FIRST_NAMES = [
  "Marie", "Fatima", "Jean", "Mohamed", "Sophie", "Karim", "Nathalie", "Pierre",
  "Aïcha", "Michel", "Camille", "Youssef", "Isabelle", "Thomas", "Leïla", "Philippe",
  "Julie", "Mamadou", "Catherine", "Nicolas", "Inès", "Bernard", "Sarah", "Olivier",
  "Aminata", "Françoise", "Mehdi", "Chantal", "Lucas", "Nadia", "Daniel", "Emma",
  "Rachid", "Monique", "Hugo", "Samira", "Gérard", "Léa", "Abdel", "Martine",
];

/** Commentaires enthousiastes (plutôt associés aux notes de 4 ou 5). */
const WARM_COMMENTS = [
  "Très joli jeu, j'ai appris des choses sur ma ville !",
  "Je ne savais pas que Monet avait vécu ici aussi longtemps.",
  "Ma grand-mère cultivait des asperges du côté des Coteaux, ça m'a rappelé des souvenirs.",
  "Super idée, à refaire avec d'autres questions sur les quartiers.",
  "Simple et agréable, parfait en attendant le dessert.",
  "On devrait proposer ça dans les écoles d'Argenteuil.",
  "J'habite ici depuis 30 ans et j'ai quand même fait une erreur !",
  "La butte d'Orgemont, quelle vue… Merci de la mettre à l'honneur.",
  "Les enfants ont adoré chercher les réponses avec nous.",
  "Bravo pour l'initiative, c'est une belle façon de parler du patrimoine.",
  "Je me souviens des régates sur la Seine racontées par mon père.",
  "Facile à utiliser, même pour moi qui ne suis pas à l'aise avec le téléphone.",
  "J'ai découvert le parc du Cerisier grâce à ce jeu, j'irai m'y promener.",
  "Ça donne envie d'en savoir plus sur l'histoire de la ville.",
  "Belle surprise sur la table, merci à l'équipe.",
  "Les anecdotes après chaque question sont une très bonne idée.",
  "On a joué en famille, 4 sur 5 pour tout le monde.",
  "Mes parents étaient maraîchers au Val-Notre-Dame, merci pour ce clin d'œil.",
  "Rapide, sympa et instructif.",
];

/** Idées et réserves (plutôt associées aux notes de 3 ou moins). */
const MIXED_COMMENTS = [
  "Un peu court, on en redemande !",
  "Il faudrait un marché avec de vraies asperges d'Argenteuil.",
  "Pourquoi pas une question sur la basilique et la Sainte Tunique ?",
  "Les figues d'Argenteuil, on en trouve encore ?",
  "Très bien fait, mais une version plus longue serait top.",
  "J'aurais aimé des photos anciennes avec les réponses.",
  "À quand une balade guidée sur les traces des impressionnistes ?",
  "Les questions sont un peu longues à lire sur un petit écran.",
  "Dommage qu'il n'y ait que cinq devinettes.",
  "Un peu facile pour les Argenteuillais de longue date.",
];

/** Difficulté de chaque devinette (probabilité de bonne réponse d'un joueur moyen). */
const BASE_SUCCESS: Record<number, number> = { 1: 0.86, 2: 0.7, 3: 0.63, 4: 0.52, 5: 0.8 };

/** Les mauvaises réponses ne sont pas choisies au hasard : certaines piègent plus. */
const WRONG_WEIGHTS: Record<number, Record<string, number>> = {
  1: { "pont-bezons": 55, "pont-neuilly": 25, "pont-saint-ouen": 20 },
  2: { "berges-marne": 45, "bord-oise": 40, "canal-saint-martin": 15 },
  3: { "butte-sannois": 55, "mont-valerien": 25, "butte-montmartre": 20 },
  4: { "parc-pommiers": 40, "parc-poirier": 40, "parc-olivier": 20 },
  5: { "pomme-de-terre-cerise": 45, "navet-poire": 30, "carotte-raisin": 25 },
};

const DISTRICT_WEIGHTS: readonly (readonly [string | null, number])[] = [
  [districts[0], 22],
  [districts[3], 14],
  [districts[4], 12],
  [districts[2], 12],
  [districts[1], 10],
  [districts[5], 10],
  [DISTRICT_OTHER, 8],
  [null, 12],
];

type Slot = {
  /** Nombre de jours avant aujourd'hui. */
  daysAgo: number;
  /** Plage horaire (heures UTC décimales). */
  fromHour: number;
  toHour: number;
  /** Part des participations. */
  share: number;
  sources: readonly (readonly [string | null, number])[];
};

const EVENT_SOURCES = [["table", 60], ["menu", 30], ["affiche", 10]] as const;
const DAILY_SOURCES = [["affiche", 45], ["table", 25], ["menu", 20], [null, 10]] as const;

/** Une grande soirée de lancement il y a trois jours, puis un fil de visites. */
const SLOTS: Slot[] = [
  { daysAgo: 4, fromHour: 13, toHour: 17, share: 0.07, sources: DAILY_SOURCES },
  { daysAgo: 3, fromHour: 17.5, toHour: 21.5, share: 0.56, sources: EVENT_SOURCES },
  { daysAgo: 2, fromHour: 11, toHour: 13.5, share: 0.11, sources: DAILY_SOURCES },
  { daysAgo: 1, fromHour: 11, toHour: 13.5, share: 0.08, sources: DAILY_SOURCES },
  { daysAgo: 1, fromHour: 18, toHour: 20.5, share: 0.09, sources: EVENT_SOURCES },
  { daysAgo: 0, fromHour: 7, toHour: 20, share: 0.09, sources: DAILY_SOURCES },
];

/* ───────────────────────────── Génération ─────────────────────────────── */

type SessionRow = {
  id: string;
  created_at: string;
  completed_at: string | null;
  first_name: string | null;
  district: string | null;
  source: string | null;
  score: number | null;
  replay: boolean;
  user_agent_type: "mobile" | "desktop";
};
type AnswerRow = {
  session_id: string;
  question_id: number;
  selected_option: string;
  is_correct: boolean;
  answered_at: string;
};
type FeedbackRow = {
  session_id: string;
  rating: number | null;
  comment: string | null;
  created_at: string;
};

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

function startTime(slot: Slot): number {
  const midnightUtc = Math.floor(now / DAY) * DAY - slot.daysAgo * DAY;
  // Les soirées se remplissent progressivement : plus de monde au milieu.
  const position = (random() + random()) / 2;
  let time = midnightUtc + (slot.fromHour + position * (slot.toHour - slot.fromHour)) * 3600_000;
  // Jamais dans le futur : on ramène les horaires d'aujourd'hui avant maintenant.
  if (time > now - 10 * 60_000) time = now - between(15, 6 * 60) * 60_000;
  return time;
}

const remainingWarm = [...WARM_COMMENTS];
const remainingMixed = [...MIXED_COMMENTS];

/** Tire un commentaire accordé à la note, sans répétition tant que possible. */
function takeComment(rating: number | null): string {
  const mixed = rating !== null ? rating <= 3 : chance(0.5);
  const pool = mixed ? remainingMixed : remainingWarm;
  if (pool.length === 0) pool.push(...(mixed ? MIXED_COMMENTS : WARM_COMMENTS));
  return pool.splice(Math.floor(random() * pool.length), 1)[0];
}

function generate(count: number, replays: number) {
  const sessions: SessionRow[] = [];
  const answers: AnswerRow[] = [];
  const feedback: FeedbackRow[] = [];

  const slotEntries = SLOTS.map((slot) => [slot, slot.share] as const);

  for (let i = 0; i < count + replays; i += 1) {
    const replay = i >= count;
    const slot = weighted(slotEntries);
    const id = uuid();
    const createdAt = startTime(slot);

    // Niveau de connaissance du joueur, entre −1 (débutant) et +1 (expert).
    const skill = between(-1, 1) * 0.9 + (replay ? 0.8 : 0);

    // Abandon : la plupart vont au bout, quelques-uns s'arrêtent en chemin.
    const answeredCount =
      replay || chance(0.85)
        ? questions.length
        : weighted([[0, 3], [1, 4], [2, 3], [3, 2], [4, 2]] as const);

    let clock = createdAt + between(6, 20) * 1000;
    let score = 0;
    questions.slice(0, answeredCount).forEach((question) => {
      const probability = Math.min(
        0.98,
        Math.max(0.08, (BASE_SUCCESS[question.id] ?? 0.65) + skill * 0.2),
      );
      const correct = getCorrectOption(question);
      const isCorrect = chance(probability);
      const wrongOptions = question.options.filter((o) => o.id !== correct.id);
      const selected = isCorrect
        ? correct.id
        : weighted(
            wrongOptions.map(
              (o) => [o.id, WRONG_WEIGHTS[question.id]?.[o.id] ?? 1] as const,
            ),
          );

      clock += between(7, 28) * 1000;
      if (isCorrect) score += 1;
      answers.push({
        session_id: id,
        question_id: question.id,
        selected_option: selected,
        is_correct: isCorrect,
        answered_at: new Date(clock).toISOString(),
      });
    });

    const completed = answeredCount === questions.length;

    sessions.push({
      id,
      created_at: new Date(createdAt).toISOString(),
      completed_at: completed ? new Date(clock + 800).toISOString() : null,
      first_name: chance(0.55) ? pick(FIRST_NAMES) : null,
      district: weighted(DISTRICT_WEIGHTS),
      source: weighted(slot.sources),
      score: completed ? score : null,
      replay,
      user_agent_type: chance(0.93) ? "mobile" : "desktop",
    });

    // Avis : un peu plus de la moitié des joueurs qui terminent laissent une note.
    if (completed && !replay) {
      const rates = chance(0.58);
      const comments = rates ? chance(0.45) : chance(0.06);
      if (rates || comments) {
        // Les joueurs qui ont bien réussi notent un peu plus généreusement.
        const rating = rates
          ? weighted(
              score >= 4
                ? ([[5, 62], [4, 32], [3, 6]] as const)
                : ([[5, 44], [4, 40], [3, 13], [2, 3]] as const),
            )
          : null;
        feedback.push({
          session_id: id,
          rating,
          comment: comments ? takeComment(rating) : null,
          created_at: new Date(clock + between(15, 90) * 1000).toISOString(),
        });
      }
    }
  }

  return { sessions, answers, feedback };
}

/* ─────────────────────────────── Exécution ────────────────────────────── */

function readCount(): number {
  const index = process.argv.indexOf("--count");
  const value = index >= 0 ? Number(process.argv[index + 1]) : 80;
  if (!Number.isInteger(value) || value < 1 || value > 5000) {
    console.error("✗ --count attend un nombre entier entre 1 et 5000.");
    process.exit(1);
  }
  return value;
}

async function insertInBatches<T extends object>(
  table: string,
  rows: T[],
  supabase: ReturnType<typeof getScriptClient>,
): Promise<void> {
  const BATCH = 500;
  for (let offset = 0; offset < rows.length; offset += BATCH) {
    const { error } = await supabase.from(table).insert(rows.slice(offset, offset + BATCH));
    if (error) throw new Error(`Insertion dans « ${table} » : ${error.message}`);
  }
}

async function main(): Promise<void> {
  const supabase = getScriptClient();
  const count = readCount();
  const force = process.argv.includes("--force");

  console.log(`\nBase ciblée : ${describeTarget()}`);

  const existing = await countRows(supabase, "sessions");
  if (existing > 0 && !force) {
    console.error(
      `\n✗ La base contient déjà ${existing} partie(s). Pour ne pas mélanger de fausses données à de vraies participations, rien n'a été ajouté.\n` +
        "  → Videz d'abord la base (npm run reset), ou ajoutez quand même avec : npm run seed -- --force\n",
    );
    process.exit(1);
  }

  const replays = Math.max(2, Math.round(count * 0.075));
  const { sessions, answers, feedback } = generate(count, replays);

  await insertInBatches("sessions", sessions, supabase);
  await insertInBatches("answers", answers, supabase);
  await insertInBatches("feedback", feedback, supabase);

  const completed = sessions.filter((s) => !s.replay && s.completed_at).length;
  console.log(
    `\n✓ Données de démonstration ajoutées :\n` +
      `  • ${count} participations (dont ${completed} terminées)\n` +
      `  • ${replays} parties rejouées (exclues des statistiques principales)\n` +
      `  • ${answers.length} réponses\n` +
      `  • ${feedback.length} avis, dont ${feedback.filter((f) => f.comment).length} commentaires\n\n` +
      "Ouvrez /admin pour voir le tableau de bord. Avant le vrai lancement : npm run reset\n",
  );
}

main().catch((error: unknown) => {
  console.error(`\n✗ ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
