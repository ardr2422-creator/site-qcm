/** Types des lignes lues en base (voir supabase/schema.sql). */

export type DeviceType = "mobile" | "desktop";

export type AnswerRecord = {
  question_id: number;
  selected_option: string;
  is_correct: boolean;
  answered_at: string;
};

export type FeedbackRecord = {
  rating: number | null;
  comment: string | null;
  created_at: string;
};

/** Une partie, avec ses réponses et son éventuel avis. */
export type SessionRecord = {
  id: string;
  created_at: string;
  completed_at: string | null;
  first_name: string | null;
  district: string | null;
  source: string | null;
  score: number | null;
  replay: boolean;
  user_agent_type: DeviceType;
  answers: AnswerRecord[];
  feedback: FeedbackRecord | null;
};
