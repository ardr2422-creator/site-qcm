-- ════════════════════════════════════════════════════════════════════════
--  Le Royaume des Glaces d'Argenteuil — schéma de la base de données
-- ════════════════════════════════════════════════════════════════════════
--  À coller tel quel dans Supabase : SQL Editor → New query → Run.
--  Le script peut être relancé sans risque (il ne supprime aucune donnée).
--
--  Sécurité : la RLS est activée sur toutes les tables, sans aucune policy.
--  Les clés publiques (anon / authenticated) ne peuvent donc rien lire ni
--  écrire. Tout passe par les routes API du site, côté serveur, avec la
--  clé « service role » (qui contourne la RLS).
-- ════════════════════════════════════════════════════════════════════════

-- ── Parties ───────────────────────────────────────────────────────────────
create table if not exists public.sessions (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  completed_at    timestamptz,
  first_name      text check (char_length(first_name) <= 40),
  district        text check (char_length(district) <= 60),
  source          text check (char_length(source) <= 40),
  score           smallint check (score >= 0),
  replay          boolean not null default false,
  user_agent_type text not null default 'mobile'
                  check (user_agent_type in ('mobile', 'desktop'))
);

comment on table public.sessions is
  'Une ligne par partie démarrée (identifiant anonyme généré sur le téléphone).';
comment on column public.sessions.source is
  'Origine du scan, transmise par le paramètre d''URL ?src= (table, affiche, menu…).';
comment on column public.sessions.replay is
  'true = partie rejouée « pour le plaisir », exclue des statistiques principales.';
comment on column public.sessions.score is
  'Score calculé côté serveur à la fin de la partie (jamais envoyé par le client).';

create index if not exists sessions_created_at_idx
  on public.sessions (created_at);

-- ── Réponses (enregistrées une par une, dès le clic) ──────────────────────
create table if not exists public.answers (
  id              bigint generated always as identity primary key,
  session_id      uuid not null references public.sessions (id) on delete cascade,
  question_id     integer not null,
  selected_option text not null check (char_length(selected_option) <= 80),
  is_correct      boolean not null,
  answered_at     timestamptz not null default now(),
  constraint answers_session_question_key unique (session_id, question_id)
);

comment on table public.answers is
  'Une ligne par réponse. La contrainte unique empêche de répondre deux fois à la même question.';
comment on column public.answers.selected_option is
  'Identifiant de la réponse choisie, tel que défini dans data/questions.ts.';

-- ── Avis laissés en fin de partie ─────────────────────────────────────────
create table if not exists public.feedback (
  id         bigint generated always as identity primary key,
  session_id uuid not null references public.sessions (id) on delete cascade,
  rating     smallint check (rating between 1 and 5),
  comment    text check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  constraint feedback_session_key unique (session_id),
  constraint feedback_not_empty check (rating is not null or comment is not null)
);

comment on table public.feedback is
  'Avis facultatif : une note de 1 à 5 et/ou un commentaire libre. Un seul avis par partie.';

-- ── Sécurité : RLS activée partout, aucune policy publique ───────────────
alter table public.sessions enable row level security;
alter table public.answers  enable row level security;
alter table public.feedback enable row level security;

-- Ceinture et bretelles : on retire aussi les droits des rôles publics,
-- et on s'assure que le rôle serveur (service_role) a bien accès aux tables.
do $$
declare
  role_name text;
begin
  foreach role_name in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = role_name) then
      execute format(
        'revoke all on table public.sessions, public.answers, public.feedback from %I',
        role_name
      );
    end if;
  end loop;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant usage on schema public to service_role;
    grant all on table public.sessions, public.answers, public.feedback to service_role;
  end if;
end
$$;
