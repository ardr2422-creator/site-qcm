/**
 * ─────────────────────────────────────────────────────────────────────────
 *  LES DEVINETTES DU JEU
 * ─────────────────────────────────────────────────────────────────────────
 *  C'est LE fichier à modifier pour changer le contenu du quiz.
 *
 *  Pour chaque devinette :
 *   - `id`        : numéro de la question (1, 2, 3…). Ne pas le changer une
 *                   fois le jeu lancé : les réponses enregistrées s'y réfèrent.
 *   - `text`      : l'énoncé affiché au visiteur.
 *   - `options`   : les 4 réponses proposées. Mettre `correct: true` sur la
 *                   bonne réponse (une seule par question).
 *                   `id` est un identifiant court, sans espace ni accent ;
 *                   c'est lui qui est enregistré en base. Vous pouvez corriger
 *                   librement le `label` (le texte affiché), mais ne changez
 *                   pas un `id` après le lancement.
 *   - `anecdote`  : la petite phrase affichée après la réponse.
 *
 *  L'ordre d'affichage des réponses est mélangé à chaque partie : l'ordre
 *  dans ce fichier n'a donc aucune importance.
 *
 *  Les mauvaises réponses sont toutes des lieux ou des produits réels
 *  d'Argenteuil, vérifiés (document « mauvaises réponses vérifiées »).
 *  Un même lieu n'apparaît que dans une seule question.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type QuizOption = {
  id: string;
  label: string;
  correct?: boolean;
};

export type QuizQuestion = {
  id: number;
  text: string;
  options: QuizOption[];
  anecdote: string;
};

export const questions: QuizQuestion[] = [
  {
    id: 1,
    text: "Je relie deux rives au-dessus de la Seine. Un peintre impressionniste m'a immortalisé à plusieurs reprises en 1874. Qui suis-je ?",
    options: [
      { id: "pont-argenteuil", label: "Le pont d'Argenteuil", correct: true },
      { id: "viaduc-a15", label: "Le viaduc de l'A15" },
      { id: "chemin-halage", label: "Le chemin de halage" },
      { id: "plataneraie", label: "La Plataneraie" },
    ],
    anecdote:
      "Claude Monet, installé à Argenteuil de 1871 à 1878, a peint le pont plusieurs fois en 1874.",
  },
  {
    id: 2,
    text: "J'ai inspiré les peintres, les promeneurs et les amateurs de voile. Autrefois, les bateaux et les régates animaient mes eaux. Où êtes-vous ?",
    options: [
      { id: "quai-seine", label: "Le quai de Seine", correct: true },
      { id: "basilique-saint-denys", label: "La basilique Saint-Denys" },
      { id: "tour-billy", label: "La tour Billy" },
      { id: "abbaye-notre-dame", label: "L'abbaye Notre-Dame" },
    ],
    anecdote:
      "Au XIXe siècle, Argenteuil était un haut lieu de la voile et des régates, ce qui a attiré les impressionnistes.",
  },
  {
    id: 3,
    text: "Je prends de la hauteur au-dessus de la ville. Un moulin du XVIe siècle me coiffe, et 250 marches mènent à mon grand panorama. Quel lieu suis-je ?",
    options: [
      { id: "butte-orgemont", label: "La butte d'Orgemont", correct: true },
      { id: "coteaux", label: "Les Coteaux" },
      { id: "butte-chataigniers", label: "La butte des Châtaigniers" },
      { id: "val-notre-dame", label: "Le Val-Notre-Dame" },
    ],
    anecdote:
      "Le gypse extrait sur place servait à fabriquer le plâtre, une industrie importante de la région.",
  },
  {
    id: 4,
    text: "Mon nom évoque un arbre fruitier. Je rappelle, avec les espaces agricoles de la ville, un passé où la nature et les cultures faisaient partie du paysage. Quel parc suis-je ?",
    options: [
      { id: "parc-cerisier", label: "Le parc du Cerisier", correct: true },
      { id: "parc-champioux", label: "Le parc des Champioux" },
      { id: "parc-mirabeau", label: "Le parc Mirabeau" },
      { id: "parc-berges", label: "Le parc des Berges" },
    ],
    anecdote:
      "Argenteuil a longtemps été une ville de vergers, de vignes et de maraîchage.",
  },
  {
    id: 5,
    text: "L'une pousse sous la terre et a donné son nom à une variété réputée ; l'autre est un fruit doux et généreux. Toutes deux ont fait la renommée gourmande d'Argenteuil au XIXe siècle. Quels sont ces deux trésors ?",
    options: [
      {
        id: "asperge-figue",
        label: "L'asperge et la figue",
        correct: true,
      },
      { id: "cerises-lentilles", label: "Les cerises et les lentilles" },
      { id: "fraises-framboises", label: "Les fraises et les framboises" },
      { id: "vin-platre", label: "Le vin et le plâtre" },
    ],
    anecdote:
      "L'asperge d'Argenteuil était servie sur les grandes tables parisiennes, et la figue d'Argenteuil était aussi très réputée.",
  },
];

/* ───────────────────────── Outils (ne pas modifier) ───────────────────── */

export const TOTAL_QUESTIONS = questions.length;

export function getQuestion(id: number): QuizQuestion | undefined {
  return questions.find((q) => q.id === id);
}

export function getCorrectOption(question: QuizQuestion): QuizOption {
  // La présence d'une (seule) bonne réponse est vérifiée ci-dessous.
  return question.options.find((o) => o.correct) as QuizOption;
}

export function getOption(
  question: QuizQuestion,
  optionId: string,
): QuizOption | undefined {
  return question.options.find((o) => o.id === optionId);
}

export function isCorrectAnswer(questionId: number, optionId: string): boolean {
  const question = getQuestion(questionId);
  if (!question) return false;
  return getCorrectOption(question).id === optionId;
}

/**
 * Garde-fou : signale immédiatement (au démarrage et au build) une erreur de
 * saisie dans le tableau ci-dessus, plutôt qu'un bug discret pendant le jeu.
 */
function assertQuestionsAreValid(list: QuizQuestion[]): void {
  const ids = new Set<number>();
  for (const q of list) {
    if (!Number.isInteger(q.id) || q.id < 1) {
      throw new Error(`data/questions.ts : identifiant invalide (${q.id}).`);
    }
    if (ids.has(q.id)) {
      throw new Error(`data/questions.ts : la question ${q.id} est en double.`);
    }
    ids.add(q.id);

    const correctCount = q.options.filter((o) => o.correct).length;
    if (correctCount !== 1) {
      throw new Error(
        `data/questions.ts : la question ${q.id} doit avoir exactement une bonne réponse (${correctCount} trouvée(s)).`,
      );
    }
    const optionIds = new Set(q.options.map((o) => o.id));
    if (optionIds.size !== q.options.length) {
      throw new Error(
        `data/questions.ts : la question ${q.id} a deux réponses avec le même identifiant.`,
      );
    }
    for (const o of q.options) {
      if (!/^[a-z0-9-]{1,60}$/.test(o.id)) {
        throw new Error(
          `data/questions.ts : identifiant de réponse invalide « ${o.id} » (question ${q.id}). Lettres minuscules, chiffres et tirets uniquement.`,
        );
      }
    }
  }
}

assertQuestionsAreValid(questions);
