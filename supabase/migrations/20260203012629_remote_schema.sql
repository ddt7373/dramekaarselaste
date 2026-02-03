drop extension if exists "pg_net";

alter table "public"."gebruikers" drop constraint "gebruikers_id_fkey";

alter table "public"."gebruikers" drop constraint "gebruikers_rol_check";


  create table "public"."besoekpunte" (
    "id" uuid not null default gen_random_uuid(),
    "naam" text not null,
    "beskrywing" text,
    "adres" text,
    "wyk_id" uuid,
    "gemeente_id" uuid,
    "latitude" double precision,
    "longitude" double precision,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."besoekpunte" enable row level security;


  create table "public"."betalings" (
    "id" uuid not null default gen_random_uuid(),
    "gebruiker_id" uuid,
    "bedrag" numeric(10,2) not null,
    "tipe" text not null,
    "beskrywing" text,
    "status" text default 'hangende'::text,
    "betaal_datum" timestamp with time zone,
    "yoco_checkout_id" text,
    "gemeente_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."betalings" enable row level security;


  create table "public"."boodskap_ontvangers" (
    "id" uuid not null default gen_random_uuid(),
    "boodskap_id" uuid,
    "ontvanger_id" uuid,
    "ontvanger_naam" text not null,
    "gelees_op" timestamp with time zone,
    "verwyder_op" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."boodskap_ontvangers" enable row level security;


  create table "public"."boodskappe" (
    "id" uuid not null default gen_random_uuid(),
    "sender_id" uuid,
    "sender_naam" text not null,
    "onderwerp" text not null,
    "inhoud" text not null,
    "gemeente_id" uuid,
    "is_groep_boodskap" boolean default false,
    "groep_tipe" text,
    "groep_id" uuid,
    "groep_rol" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."boodskappe" enable row level security;


  create table "public"."dagstukkies" (
    "id" uuid not null default gen_random_uuid(),
    "erediens_id" uuid,
    "dag" text not null,
    "titel" text not null,
    "inhoud" text not null,
    "skrifverwysing" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."dagstukkies" enable row level security;


  create table "public"."dokument_kategoriee" (
    "id" uuid not null default gen_random_uuid(),
    "gemeente_id" uuid not null,
    "naam" text not null,
    "beskrywing" text,
    "is_stelsel" boolean default false,
    "aktief" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "opgelaai_deur" uuid
      );


alter table "public"."dokument_kategoriee" enable row level security;


  create table "public"."dokumente" (
    "id" uuid not null default gen_random_uuid(),
    "gemeente_id" uuid not null,
    "titel" text not null,
    "beskrywing" text,
    "kategorie" text not null,
    "file_path" text not null,
    "file_name" text not null,
    "file_type" text,
    "file_size" integer,
    "is_publiek" boolean default false,
    "lidmaat_id" uuid,
    "lidmaat_naam" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "opgelaai_deur" uuid
      );


alter table "public"."dokumente" enable row level security;


  create table "public"."erediens_info" (
    "id" uuid not null default gen_random_uuid(),
    "gemeente_id" uuid,
    "sondag_datum" date not null,
    "tema" text,
    "skriflesing" text,
    "preek_opsomming" text,
    "created_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."erediens_info" enable row level security;


  create table "public"."eredienste" (
    "id" uuid not null default gen_random_uuid(),
    "gemeente_id" uuid not null,
    "datum" date not null,
    "tyd" text,
    "tema" text,
    "skriflesing" text,
    "preek_opsomming" text,
    "liturgie_punte" jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."eredienste" enable row level security;


  create table "public"."geloofsonderrig_ai_logs" (
    "id" uuid not null default gen_random_uuid(),
    "leerder_id" uuid,
    "les_id" uuid,
    "user_message" text not null,
    "ai_response" text not null,
    "kgvw_scores" jsonb default '{"kennis": 0, "waardes": 0, "gesindheid": 0, "vaardigheid": 0}'::jsonb,
    "analise_opsomming" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."geloofsonderrig_ai_logs" enable row level security;


  create table "public"."geloofsonderrig_files" (
    "id" uuid not null default gen_random_uuid(),
    "file_name" text not null,
    "mime_type" text not null,
    "file_data" text not null,
    "size_bytes" bigint,
    "uploaded_by" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."geloofsonderrig_files" enable row level security;


  create table "public"."geloofsonderrig_grade" (
    "id" uuid not null default gen_random_uuid(),
    "naam" text not null,
    "volgorde" integer not null default 0,
    "aktief" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."geloofsonderrig_grade" enable row level security;


  create table "public"."geloofsonderrig_klas_leerders" (
    "id" uuid not null default gen_random_uuid(),
    "klas_id" uuid,
    "leerder_id" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."geloofsonderrig_klas_leerders" enable row level security;


  create table "public"."geloofsonderrig_klasse" (
    "id" uuid not null default gen_random_uuid(),
    "mentor_id" uuid,
    "gemeente_id" uuid,
    "naam" text not null,
    "beskrywing" text,
    "kode" text,
    "graad_id" uuid,
    "aktief" boolean default true,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."geloofsonderrig_klasse" enable row level security;


  create table "public"."geloofsonderrig_lesse" (
    "id" uuid not null default gen_random_uuid(),
    "onderwerp_id" uuid,
    "titel" text not null,
    "inhoud" text,
    "skrifverwysing" text,
    "video_url" text,
    "file_url" text,
    "file_type" text,
    "file_name" text,
    "volgorde" integer default 0,
    "aktief" boolean default true,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."geloofsonderrig_lesse" enable row level security;


  create table "public"."geloofsonderrig_onderwerpe" (
    "id" uuid not null default gen_random_uuid(),
    "titel" text not null,
    "beskrywing" text,
    "ikoon" text,
    "kleur" text,
    "graad_id" uuid,
    "volgorde" integer default 0,
    "aktief" boolean default true,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."geloofsonderrig_onderwerpe" enable row level security;


  create table "public"."geloofsonderrig_prente" (
    "id" uuid not null default gen_random_uuid(),
    "leerder_id" uuid,
    "les_id" uuid,
    "prompt" text,
    "image_url" text,
    "betekenis" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."geloofsonderrig_prente" enable row level security;


  create table "public"."geloofsonderrig_punte" (
    "id" uuid not null default gen_random_uuid(),
    "leerder_id" uuid not null,
    "aksie_tipe" text not null,
    "punte" integer not null default 0,
    "les_id" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."geloofsonderrig_punte" enable row level security;


  create table "public"."geloofsonderrig_vordering" (
    "id" uuid not null default gen_random_uuid(),
    "leerder_id" uuid,
    "les_id" uuid,
    "onderwerp_id" uuid,
    "voltooi" boolean default false,
    "persentasie" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "quiz_score" integer default 0,
    "quiz_total" integer default 5,
    "verse_completed" integer default 0,
    "verse_total" integer default 5,
    "visualiserings_count" integer default 0
      );


alter table "public"."geloofsonderrig_vordering" enable row level security;


  create table "public"."geloofsonderrig_vrae" (
    "id" uuid not null default gen_random_uuid(),
    "les_id" uuid,
    "vraag" text not null,
    "wenk" text,
    "volgorde" integer default 0,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."geloofsonderrig_vrae" enable row level security;


  create table "public"."gemeente_program" (
    "id" uuid not null default gen_random_uuid(),
    "titel" text not null,
    "beskrywing" text,
    "datum" timestamp with time zone not null,
    "tyd" text,
    "plek" text,
    "tipe" text not null,
    "gemeente_id" uuid,
    "created_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."gemeente_program" enable row level security;


  create table "public"."kk_lesson_attempts" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "lesson_id" uuid,
    "variant_type" text,
    "time_selected" integer,
    "challenge_mode" boolean default false,
    "score_percent" numeric default 0,
    "hints_used" integer default 0,
    "time_spent_seconds" integer default 0,
    "questions_answered" integer default 0,
    "questions_correct" integer default 0,
    "completed_at" timestamp with time zone default now()
      );


alter table "public"."kk_lesson_attempts" enable row level security;


  create table "public"."kk_lesson_variants" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "lesson_id" uuid,
    "variant_type" text not null,
    "hook_text" text,
    "story_text" text,
    "explanation_points" text[] default '{}'::text[],
    "parent_prompt" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."kk_lesson_variants" enable row level security;


  create table "public"."kk_lessons" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "title" text not null,
    "passage_reference" text,
    "theme_tags" text[] default '{}'::text[],
    "age_band" text default '6-11'::text,
    "difficulty" integer default 1,
    "summary" text,
    "core_truths" text[] default '{}'::text[],
    "status" text default 'DRAFT'::text,
    "created_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."kk_lessons" enable row level security;


  create table "public"."kk_questions" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "lesson_id" uuid,
    "question_type" text default 'MULTIPLE_CHOICE'::text,
    "question_text" text not null,
    "options" text[] default '{}'::text[],
    "correct_answer" text,
    "correct_answers" text[] default '{}'::text[],
    "skill_tag" text default 'Feite'::text,
    "difficulty" integer default 1,
    "hint_text" text,
    "explanation" text,
    "variant_type" text default 'STANDARD'::text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."kk_questions" enable row level security;


  create table "public"."kk_user_progress" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "total_lessons_completed" integer default 0,
    "total_time_spent_seconds" integer default 0,
    "current_streak" integer default 0,
    "longest_streak" integer default 0,
    "last_lesson_date" date,
    "average_score" numeric default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."kk_user_progress" enable row level security;


  create table "public"."krisis_verslae" (
    "id" uuid not null default gen_random_uuid(),
    "gebruiker_id" uuid,
    "ingedien_deur" uuid,
    "tipe" text not null,
    "beskrywing" text not null,
    "prioriteit" text default 'normaal'::text,
    "status" text default 'ingedien'::text,
    "notas" text,
    "gemeente_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."krisis_verslae" enable row level security;


  create table "public"."lidmaat_verhoudings" (
    "id" uuid not null default gen_random_uuid(),
    "lidmaat_id" uuid,
    "verwante_id" uuid,
    "verhouding_tipe" text not null,
    "verhouding_beskrywing" text,
    "gemeente_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."lidmaat_verhoudings" enable row level security;


  create table "public"."lms_kursusse" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "titel" text not null,
    "beskrywing" text,
    "kort_beskrywing" text,
    "kategorie" text default 'Bybelstudie'::text,
    "vlak" text default 'beginner'::text,
    "prys" numeric default 0,
    "is_gratis" boolean default true,
    "duur_minute" integer default 60,
    "foto_url" text,
    "video_voorskou_url" text,
    "vereistes" text,
    "wat_jy_sal_leer" text[] default '{}'::text[],
    "geskep_deur" uuid,
    "is_vbo_geskik" boolean default false,
    "vbo_krediete" integer default 0,
    "is_missionaal" boolean default false,
    "is_gepubliseer" boolean default false,
    "is_aktief" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."lms_kursusse" enable row level security;


  create table "public"."lms_lesse" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "module_id" uuid,
    "titel" text not null,
    "tipe" text default 'teks'::text,
    "inhoud" text,
    "video_url" text,
    "duur_minute" integer default 10,
    "bylaes" jsonb default '[]'::jsonb,
    "volgorde" integer default 0,
    "is_aktief" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "kursus_id" uuid,
    "slaag_persentasie" integer default 70
      );


alter table "public"."lms_lesse" enable row level security;


  create table "public"."lms_modules" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "kursus_id" uuid,
    "titel" text not null,
    "beskrywing" text,
    "volgorde" integer default 0,
    "is_aktief" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."lms_modules" enable row level security;


  create table "public"."lms_questions" (
    "id" uuid not null default gen_random_uuid(),
    "les_id" uuid not null,
    "vraag_teks" text not null,
    "vraag_tipe" text default 'mcq'::text,
    "opsies" jsonb default '{}'::jsonb,
    "korrekte_antwoord" text,
    "punte" integer default 1,
    "volgorde" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."lms_questions" enable row level security;


  create table "public"."lms_quiz_attempts" (
    "id" uuid not null default gen_random_uuid(),
    "les_id" uuid not null,
    "gebruiker_id" uuid not null,
    "telling" integer default 0,
    "maksimum_punte" integer default 0,
    "persentasie" numeric default 0,
    "geslaag" boolean default false,
    "antwoorde" jsonb default '{}'::jsonb,
    "voltooi_op" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
      );


alter table "public"."lms_quiz_attempts" enable row level security;


  create table "public"."lms_registrasies" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "kursus_id" uuid,
    "gebruiker_id" uuid,
    "status" text default 'in_progress'::text,
    "progress" integer default 0,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "betaling_status" text default 'gratis'::text,
    "betaling_bedrag" numeric default 0,
    "begin_datum" timestamp with time zone default now()
      );


alter table "public"."lms_registrasies" enable row level security;


  create table "public"."lms_vordering" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "gebruiker_id" uuid,
    "les_id" uuid,
    "is_voltooi" boolean default true,
    "completed_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "kursus_id" uuid,
    "status" text default 'begin'::text,
    "toets_telling" integer,
    "toets_maksimum" integer,
    "toets_geslaag" boolean
      );


alter table "public"."lms_vordering" enable row level security;


  create table "public"."pastorale_aksies" (
    "id" uuid not null default gen_random_uuid(),
    "gebruiker_id" uuid,
    "leier_id" uuid,
    "tipe" text not null,
    "datum" timestamp with time zone not null,
    "nota" text,
    "gemeente_id" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."pastorale_aksies" enable row level security;


  create table "public"."vbo_aktiwiteite" (
    "id" uuid not null default gen_random_uuid(),
    "titel" text not null,
    "beskrywing" text not null,
    "tipe" text not null,
    "krediete" integer not null default 0,
    "kursus_id" uuid,
    "bewyse_verplig" boolean default true,
    "aktief" boolean default true,
    "created_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."vbo_aktiwiteite" enable row level security;


  create table "public"."vbo_punte" (
    "id" uuid not null default gen_random_uuid(),
    "gebruiker_id" uuid not null,
    "tipe" text not null,
    "punte" numeric default 0,
    "datum" date default CURRENT_DATE,
    "beskrywing" text,
    "bewys_url" text,
    "status" text default 'hangend'::text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."vbo_punte" enable row level security;


  create table "public"."vrae" (
    "id" uuid not null default gen_random_uuid(),
    "gebruiker_id" uuid,
    "inhoud" text not null,
    "kategorie" text not null,
    "status" text default 'nuut'::text,
    "antwoord" text,
    "beantwoord_deur" uuid,
    "gemeente_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."vrae" enable row level security;


  create table "public"."wyke" (
    "id" uuid not null default gen_random_uuid(),
    "naam" text not null,
    "beskrywing" text,
    "leier_id" uuid,
    "gemeente_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."wyke" enable row level security;

alter table "public"."congregation_inventory" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."congregation_statistics" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."gebruikers" add column "aktief" boolean default true;

alter table "public"."gebruikers" add column "besoekpunt_id" uuid;

alter table "public"."gebruikers" add column "epos" text;

alter table "public"."gebruikers" add column "gemeente_id" uuid;

alter table "public"."gebruikers" add column "laaste_kontak" timestamp with time zone;

alter table "public"."gebruikers" add column "latitude" double precision;

alter table "public"."gebruikers" add column "longitude" double precision;

alter table "public"."gebruikers" add column "notas" text;

alter table "public"."gebruikers" add column "popia_toestemming" boolean default false;

alter table "public"."gebruikers" add column "popia_toestemming_datum" timestamp with time zone;

alter table "public"."gebruikers" add column "profile_pic_url" text;

alter table "public"."gebruikers" add column "selfoon" text;

alter table "public"."gebruikers" add column "updated_at" timestamp with time zone default now();

alter table "public"."gebruikers" add column "van" text not null;

alter table "public"."gebruikers" add column "wagwoord_hash" text;

alter table "public"."gebruikers" add column "wyk_id" uuid;

alter table "public"."gebruikers" alter column "id" set default gen_random_uuid();

alter table "public"."gebruikers" alter column "naam" set not null;

alter table "public"."gebruikers" alter column "rol" set default 'lidmaat'::text;

alter table "public"."gebruikers" alter column "rol" drop not null;

alter table "public"."gemeentes" add column "is_demo" boolean default false;

alter table "public"."gemeentes" add column "logo_url" text;

alter table "public"."gemeentes" enable row level security;

alter table "public"."jy_is_myne_children" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."jy_is_myne_children" alter column "phase" drop default;

alter table "public"."jy_is_myne_journal" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."jy_is_myne_phase_content" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."jy_is_myne_toolkit" alter column "id" set default extensions.uuid_generate_v4();

CREATE UNIQUE INDEX besoekpunte_pkey ON public.besoekpunte USING btree (id);

CREATE UNIQUE INDEX betalings_pkey ON public.betalings USING btree (id);

CREATE UNIQUE INDEX boodskap_ontvangers_pkey ON public.boodskap_ontvangers USING btree (id);

CREATE UNIQUE INDEX boodskappe_pkey ON public.boodskappe USING btree (id);

CREATE UNIQUE INDEX dagstukkies_pkey ON public.dagstukkies USING btree (id);

CREATE UNIQUE INDEX dokument_kategoriee_pkey ON public.dokument_kategoriee USING btree (id);

CREATE UNIQUE INDEX dokumente_pkey ON public.dokumente USING btree (id);

CREATE UNIQUE INDEX erediens_info_pkey ON public.erediens_info USING btree (id);

CREATE UNIQUE INDEX eredienste_pkey ON public.eredienste USING btree (id);

CREATE UNIQUE INDEX geloofsonderrig_ai_logs_pkey ON public.geloofsonderrig_ai_logs USING btree (id);

CREATE UNIQUE INDEX geloofsonderrig_files_pkey ON public.geloofsonderrig_files USING btree (id);

CREATE UNIQUE INDEX geloofsonderrig_grade_pkey ON public.geloofsonderrig_grade USING btree (id);

CREATE UNIQUE INDEX geloofsonderrig_klas_leerders_pkey ON public.geloofsonderrig_klas_leerders USING btree (id);

CREATE UNIQUE INDEX geloofsonderrig_klasse_kode_key ON public.geloofsonderrig_klasse USING btree (kode);

CREATE UNIQUE INDEX geloofsonderrig_klasse_pkey ON public.geloofsonderrig_klasse USING btree (id);

CREATE UNIQUE INDEX geloofsonderrig_lesse_pkey ON public.geloofsonderrig_lesse USING btree (id);

CREATE UNIQUE INDEX geloofsonderrig_onderwerpe_pkey ON public.geloofsonderrig_onderwerpe USING btree (id);

CREATE UNIQUE INDEX geloofsonderrig_prente_pkey ON public.geloofsonderrig_prente USING btree (id);

CREATE UNIQUE INDEX geloofsonderrig_punte_pkey ON public.geloofsonderrig_punte USING btree (id);

CREATE UNIQUE INDEX geloofsonderrig_vordering_leerder_les_unique ON public.geloofsonderrig_vordering USING btree (leerder_id, les_id);

CREATE UNIQUE INDEX geloofsonderrig_vordering_pkey ON public.geloofsonderrig_vordering USING btree (id);

CREATE UNIQUE INDEX geloofsonderrig_vrae_pkey ON public.geloofsonderrig_vrae USING btree (id);

CREATE UNIQUE INDEX gemeente_program_pkey ON public.gemeente_program USING btree (id);

CREATE INDEX idx_dokument_kategoriee_gemeente ON public.dokument_kategoriee USING btree (gemeente_id);

CREATE INDEX idx_dokumente_gemeente ON public.dokumente USING btree (gemeente_id);

CREATE INDEX idx_geloofsonderrig_punte_created ON public.geloofsonderrig_punte USING btree (created_at DESC);

CREATE INDEX idx_geloofsonderrig_punte_leerder ON public.geloofsonderrig_punte USING btree (leerder_id);

CREATE INDEX idx_lms_questions_les_id ON public.lms_questions USING btree (les_id);

CREATE INDEX idx_lms_quiz_attempts_gebruiker_id ON public.lms_quiz_attempts USING btree (gebruiker_id);

CREATE INDEX idx_lms_quiz_attempts_les_id ON public.lms_quiz_attempts USING btree (les_id);

CREATE INDEX idx_vbo_aktiwiteite_aktief ON public.vbo_aktiwiteite USING btree (aktief);

CREATE INDEX idx_vbo_aktiwiteite_tipe ON public.vbo_aktiwiteite USING btree (tipe);

CREATE UNIQUE INDEX kk_lesson_attempts_pkey ON public.kk_lesson_attempts USING btree (id);

CREATE UNIQUE INDEX kk_lesson_variants_pkey ON public.kk_lesson_variants USING btree (id);

CREATE UNIQUE INDEX kk_lessons_pkey ON public.kk_lessons USING btree (id);

CREATE UNIQUE INDEX kk_questions_pkey ON public.kk_questions USING btree (id);

CREATE UNIQUE INDEX kk_user_progress_pkey ON public.kk_user_progress USING btree (id);

CREATE UNIQUE INDEX kk_user_progress_user_id_key ON public.kk_user_progress USING btree (user_id);

CREATE UNIQUE INDEX krisis_verslae_pkey ON public.krisis_verslae USING btree (id);

CREATE UNIQUE INDEX lidmaat_verhoudings_pkey ON public.lidmaat_verhoudings USING btree (id);

CREATE UNIQUE INDEX lms_kursusse_pkey ON public.lms_kursusse USING btree (id);

CREATE UNIQUE INDEX lms_lesse_pkey ON public.lms_lesse USING btree (id);

CREATE UNIQUE INDEX lms_modules_pkey ON public.lms_modules USING btree (id);

CREATE UNIQUE INDEX lms_questions_pkey ON public.lms_questions USING btree (id);

CREATE UNIQUE INDEX lms_quiz_attempts_pkey ON public.lms_quiz_attempts USING btree (id);

CREATE UNIQUE INDEX lms_registrasies_kursus_id_gebruiker_id_key ON public.lms_registrasies USING btree (kursus_id, gebruiker_id);

CREATE UNIQUE INDEX lms_registrasies_pkey ON public.lms_registrasies USING btree (id);

CREATE UNIQUE INDEX lms_vordering_gebruiker_id_les_id_key ON public.lms_vordering USING btree (gebruiker_id, les_id);

CREATE UNIQUE INDEX lms_vordering_pkey ON public.lms_vordering USING btree (id);

CREATE UNIQUE INDEX pastorale_aksies_pkey ON public.pastorale_aksies USING btree (id);

CREATE UNIQUE INDEX vbo_aktiwiteite_pkey ON public.vbo_aktiwiteite USING btree (id);

CREATE UNIQUE INDEX vbo_punte_pkey ON public.vbo_punte USING btree (id);

CREATE UNIQUE INDEX vrae_pkey ON public.vrae USING btree (id);

CREATE UNIQUE INDEX wyke_pkey ON public.wyke USING btree (id);

alter table "public"."besoekpunte" add constraint "besoekpunte_pkey" PRIMARY KEY using index "besoekpunte_pkey";

alter table "public"."betalings" add constraint "betalings_pkey" PRIMARY KEY using index "betalings_pkey";

alter table "public"."boodskap_ontvangers" add constraint "boodskap_ontvangers_pkey" PRIMARY KEY using index "boodskap_ontvangers_pkey";

alter table "public"."boodskappe" add constraint "boodskappe_pkey" PRIMARY KEY using index "boodskappe_pkey";

alter table "public"."dagstukkies" add constraint "dagstukkies_pkey" PRIMARY KEY using index "dagstukkies_pkey";

alter table "public"."dokument_kategoriee" add constraint "dokument_kategoriee_pkey" PRIMARY KEY using index "dokument_kategoriee_pkey";

alter table "public"."dokumente" add constraint "dokumente_pkey" PRIMARY KEY using index "dokumente_pkey";

alter table "public"."erediens_info" add constraint "erediens_info_pkey" PRIMARY KEY using index "erediens_info_pkey";

alter table "public"."eredienste" add constraint "eredienste_pkey" PRIMARY KEY using index "eredienste_pkey";

alter table "public"."geloofsonderrig_ai_logs" add constraint "geloofsonderrig_ai_logs_pkey" PRIMARY KEY using index "geloofsonderrig_ai_logs_pkey";

alter table "public"."geloofsonderrig_files" add constraint "geloofsonderrig_files_pkey" PRIMARY KEY using index "geloofsonderrig_files_pkey";

alter table "public"."geloofsonderrig_grade" add constraint "geloofsonderrig_grade_pkey" PRIMARY KEY using index "geloofsonderrig_grade_pkey";

alter table "public"."geloofsonderrig_klas_leerders" add constraint "geloofsonderrig_klas_leerders_pkey" PRIMARY KEY using index "geloofsonderrig_klas_leerders_pkey";

alter table "public"."geloofsonderrig_klasse" add constraint "geloofsonderrig_klasse_pkey" PRIMARY KEY using index "geloofsonderrig_klasse_pkey";

alter table "public"."geloofsonderrig_lesse" add constraint "geloofsonderrig_lesse_pkey" PRIMARY KEY using index "geloofsonderrig_lesse_pkey";

alter table "public"."geloofsonderrig_onderwerpe" add constraint "geloofsonderrig_onderwerpe_pkey" PRIMARY KEY using index "geloofsonderrig_onderwerpe_pkey";

alter table "public"."geloofsonderrig_prente" add constraint "geloofsonderrig_prente_pkey" PRIMARY KEY using index "geloofsonderrig_prente_pkey";

alter table "public"."geloofsonderrig_punte" add constraint "geloofsonderrig_punte_pkey" PRIMARY KEY using index "geloofsonderrig_punte_pkey";

alter table "public"."geloofsonderrig_vordering" add constraint "geloofsonderrig_vordering_pkey" PRIMARY KEY using index "geloofsonderrig_vordering_pkey";

alter table "public"."geloofsonderrig_vrae" add constraint "geloofsonderrig_vrae_pkey" PRIMARY KEY using index "geloofsonderrig_vrae_pkey";

alter table "public"."gemeente_program" add constraint "gemeente_program_pkey" PRIMARY KEY using index "gemeente_program_pkey";

alter table "public"."kk_lesson_attempts" add constraint "kk_lesson_attempts_pkey" PRIMARY KEY using index "kk_lesson_attempts_pkey";

alter table "public"."kk_lesson_variants" add constraint "kk_lesson_variants_pkey" PRIMARY KEY using index "kk_lesson_variants_pkey";

alter table "public"."kk_lessons" add constraint "kk_lessons_pkey" PRIMARY KEY using index "kk_lessons_pkey";

alter table "public"."kk_questions" add constraint "kk_questions_pkey" PRIMARY KEY using index "kk_questions_pkey";

alter table "public"."kk_user_progress" add constraint "kk_user_progress_pkey" PRIMARY KEY using index "kk_user_progress_pkey";

alter table "public"."krisis_verslae" add constraint "krisis_verslae_pkey" PRIMARY KEY using index "krisis_verslae_pkey";

alter table "public"."lidmaat_verhoudings" add constraint "lidmaat_verhoudings_pkey" PRIMARY KEY using index "lidmaat_verhoudings_pkey";

alter table "public"."lms_kursusse" add constraint "lms_kursusse_pkey" PRIMARY KEY using index "lms_kursusse_pkey";

alter table "public"."lms_lesse" add constraint "lms_lesse_pkey" PRIMARY KEY using index "lms_lesse_pkey";

alter table "public"."lms_modules" add constraint "lms_modules_pkey" PRIMARY KEY using index "lms_modules_pkey";

alter table "public"."lms_questions" add constraint "lms_questions_pkey" PRIMARY KEY using index "lms_questions_pkey";

alter table "public"."lms_quiz_attempts" add constraint "lms_quiz_attempts_pkey" PRIMARY KEY using index "lms_quiz_attempts_pkey";

alter table "public"."lms_registrasies" add constraint "lms_registrasies_pkey" PRIMARY KEY using index "lms_registrasies_pkey";

alter table "public"."lms_vordering" add constraint "lms_vordering_pkey" PRIMARY KEY using index "lms_vordering_pkey";

alter table "public"."pastorale_aksies" add constraint "pastorale_aksies_pkey" PRIMARY KEY using index "pastorale_aksies_pkey";

alter table "public"."vbo_aktiwiteite" add constraint "vbo_aktiwiteite_pkey" PRIMARY KEY using index "vbo_aktiwiteite_pkey";

alter table "public"."vbo_punte" add constraint "vbo_punte_pkey" PRIMARY KEY using index "vbo_punte_pkey";

alter table "public"."vrae" add constraint "vrae_pkey" PRIMARY KEY using index "vrae_pkey";

alter table "public"."wyke" add constraint "wyke_pkey" PRIMARY KEY using index "wyke_pkey";

alter table "public"."besoekpunte" add constraint "besoekpunte_gemeente_id_fkey" FOREIGN KEY (gemeente_id) REFERENCES public.gemeentes(id) not valid;

alter table "public"."besoekpunte" validate constraint "besoekpunte_gemeente_id_fkey";

alter table "public"."besoekpunte" add constraint "besoekpunte_wyk_id_fkey" FOREIGN KEY (wyk_id) REFERENCES public.wyke(id) not valid;

alter table "public"."besoekpunte" validate constraint "besoekpunte_wyk_id_fkey";

alter table "public"."boodskap_ontvangers" add constraint "boodskap_ontvangers_boodskap_id_fkey" FOREIGN KEY (boodskap_id) REFERENCES public.boodskappe(id) not valid;

alter table "public"."boodskap_ontvangers" validate constraint "boodskap_ontvangers_boodskap_id_fkey";

alter table "public"."boodskap_ontvangers" add constraint "boodskap_ontvangers_ontvanger_id_fkey" FOREIGN KEY (ontvanger_id) REFERENCES public.gebruikers(id) not valid;

alter table "public"."boodskap_ontvangers" validate constraint "boodskap_ontvangers_ontvanger_id_fkey";

alter table "public"."boodskappe" add constraint "boodskappe_gemeente_id_fkey" FOREIGN KEY (gemeente_id) REFERENCES public.gemeentes(id) not valid;

alter table "public"."boodskappe" validate constraint "boodskappe_gemeente_id_fkey";

alter table "public"."boodskappe" add constraint "boodskappe_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.gebruikers(id) not valid;

alter table "public"."boodskappe" validate constraint "boodskappe_sender_id_fkey";

alter table "public"."dagstukkies" add constraint "dagstukkies_erediens_id_fkey" FOREIGN KEY (erediens_id) REFERENCES public.erediens_info(id) not valid;

alter table "public"."dagstukkies" validate constraint "dagstukkies_erediens_id_fkey";

alter table "public"."erediens_info" add constraint "erediens_info_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.gebruikers(id) not valid;

alter table "public"."erediens_info" validate constraint "erediens_info_created_by_fkey";

alter table "public"."erediens_info" add constraint "erediens_info_gemeente_id_fkey" FOREIGN KEY (gemeente_id) REFERENCES public.gemeentes(id) not valid;

alter table "public"."erediens_info" validate constraint "erediens_info_gemeente_id_fkey";

alter table "public"."gebruikers" add constraint "gebruikers_gemeente_id_fkey" FOREIGN KEY (gemeente_id) REFERENCES public.gemeentes(id) not valid;

alter table "public"."gebruikers" validate constraint "gebruikers_gemeente_id_fkey";

alter table "public"."geloofsonderrig_ai_logs" add constraint "geloofsonderrig_ai_logs_leerder_id_fkey" FOREIGN KEY (leerder_id) REFERENCES public.gebruikers(id) not valid;

alter table "public"."geloofsonderrig_ai_logs" validate constraint "geloofsonderrig_ai_logs_leerder_id_fkey";

alter table "public"."geloofsonderrig_ai_logs" add constraint "geloofsonderrig_ai_logs_les_id_fkey" FOREIGN KEY (les_id) REFERENCES public.geloofsonderrig_lesse(id) not valid;

alter table "public"."geloofsonderrig_ai_logs" validate constraint "geloofsonderrig_ai_logs_les_id_fkey";

alter table "public"."geloofsonderrig_files" add constraint "geloofsonderrig_files_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES public.gebruikers(id) not valid;

alter table "public"."geloofsonderrig_files" validate constraint "geloofsonderrig_files_uploaded_by_fkey";

alter table "public"."geloofsonderrig_klas_leerders" add constraint "geloofsonderrig_klas_leerders_klas_id_fkey" FOREIGN KEY (klas_id) REFERENCES public.geloofsonderrig_klasse(id) not valid;

alter table "public"."geloofsonderrig_klas_leerders" validate constraint "geloofsonderrig_klas_leerders_klas_id_fkey";

alter table "public"."geloofsonderrig_klasse" add constraint "geloofsonderrig_klasse_graad_id_fkey" FOREIGN KEY (graad_id) REFERENCES public.geloofsonderrig_grade(id) not valid;

alter table "public"."geloofsonderrig_klasse" validate constraint "geloofsonderrig_klasse_graad_id_fkey";

alter table "public"."geloofsonderrig_klasse" add constraint "geloofsonderrig_klasse_kode_key" UNIQUE using index "geloofsonderrig_klasse_kode_key";

alter table "public"."geloofsonderrig_lesse" add constraint "geloofsonderrig_lesse_onderwerp_id_fkey" FOREIGN KEY (onderwerp_id) REFERENCES public.geloofsonderrig_onderwerpe(id) not valid;

alter table "public"."geloofsonderrig_lesse" validate constraint "geloofsonderrig_lesse_onderwerp_id_fkey";

alter table "public"."geloofsonderrig_onderwerpe" add constraint "geloofsonderrig_onderwerpe_graad_id_fkey" FOREIGN KEY (graad_id) REFERENCES public.geloofsonderrig_grade(id) not valid;

alter table "public"."geloofsonderrig_onderwerpe" validate constraint "geloofsonderrig_onderwerpe_graad_id_fkey";

alter table "public"."geloofsonderrig_prente" add constraint "geloofsonderrig_prente_les_id_fkey" FOREIGN KEY (les_id) REFERENCES public.geloofsonderrig_lesse(id) not valid;

alter table "public"."geloofsonderrig_prente" validate constraint "geloofsonderrig_prente_les_id_fkey";

alter table "public"."geloofsonderrig_punte" add constraint "geloofsonderrig_punte_leerder_id_fkey" FOREIGN KEY (leerder_id) REFERENCES public.gebruikers(id) ON DELETE CASCADE not valid;

alter table "public"."geloofsonderrig_punte" validate constraint "geloofsonderrig_punte_leerder_id_fkey";

alter table "public"."geloofsonderrig_punte" add constraint "geloofsonderrig_punte_les_id_fkey" FOREIGN KEY (les_id) REFERENCES public.geloofsonderrig_lesse(id) ON DELETE SET NULL not valid;

alter table "public"."geloofsonderrig_punte" validate constraint "geloofsonderrig_punte_les_id_fkey";

alter table "public"."geloofsonderrig_vordering" add constraint "geloofsonderrig_vordering_leerder_les_unique" UNIQUE using index "geloofsonderrig_vordering_leerder_les_unique";

alter table "public"."geloofsonderrig_vordering" add constraint "geloofsonderrig_vordering_les_id_fkey" FOREIGN KEY (les_id) REFERENCES public.geloofsonderrig_lesse(id) not valid;

alter table "public"."geloofsonderrig_vordering" validate constraint "geloofsonderrig_vordering_les_id_fkey";

alter table "public"."geloofsonderrig_vordering" add constraint "geloofsonderrig_vordering_onderwerp_id_fkey" FOREIGN KEY (onderwerp_id) REFERENCES public.geloofsonderrig_onderwerpe(id) not valid;

alter table "public"."geloofsonderrig_vordering" validate constraint "geloofsonderrig_vordering_onderwerp_id_fkey";

alter table "public"."geloofsonderrig_vrae" add constraint "geloofsonderrig_vrae_les_id_fkey" FOREIGN KEY (les_id) REFERENCES public.geloofsonderrig_lesse(id) not valid;

alter table "public"."geloofsonderrig_vrae" validate constraint "geloofsonderrig_vrae_les_id_fkey";

alter table "public"."jy_is_myne_journal" add constraint "jy_is_myne_journal_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."jy_is_myne_journal" validate constraint "jy_is_myne_journal_user_id_fkey";

alter table "public"."kk_lesson_attempts" add constraint "kk_lesson_attempts_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.kk_lessons(id) ON DELETE SET NULL not valid;

alter table "public"."kk_lesson_attempts" validate constraint "kk_lesson_attempts_lesson_id_fkey";

alter table "public"."kk_lesson_attempts" add constraint "kk_lesson_attempts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."kk_lesson_attempts" validate constraint "kk_lesson_attempts_user_id_fkey";

alter table "public"."kk_lesson_variants" add constraint "kk_lesson_variants_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.kk_lessons(id) ON DELETE CASCADE not valid;

alter table "public"."kk_lesson_variants" validate constraint "kk_lesson_variants_lesson_id_fkey";

alter table "public"."kk_lessons" add constraint "kk_lessons_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."kk_lessons" validate constraint "kk_lessons_created_by_fkey";

alter table "public"."kk_questions" add constraint "kk_questions_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.kk_lessons(id) ON DELETE CASCADE not valid;

alter table "public"."kk_questions" validate constraint "kk_questions_lesson_id_fkey";

alter table "public"."kk_user_progress" add constraint "kk_user_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."kk_user_progress" validate constraint "kk_user_progress_user_id_fkey";

alter table "public"."kk_user_progress" add constraint "kk_user_progress_user_id_key" UNIQUE using index "kk_user_progress_user_id_key";

alter table "public"."lms_kursusse" add constraint "lms_kursusse_geskep_deur_fkey" FOREIGN KEY (geskep_deur) REFERENCES public.gebruikers(id) ON DELETE SET NULL not valid;

alter table "public"."lms_kursusse" validate constraint "lms_kursusse_geskep_deur_fkey";

alter table "public"."lms_lesse" add constraint "lms_lesse_kursus_id_fkey" FOREIGN KEY (kursus_id) REFERENCES public.lms_kursusse(id) ON DELETE CASCADE not valid;

alter table "public"."lms_lesse" validate constraint "lms_lesse_kursus_id_fkey";

alter table "public"."lms_lesse" add constraint "lms_lesse_module_id_fkey" FOREIGN KEY (module_id) REFERENCES public.lms_modules(id) ON DELETE CASCADE not valid;

alter table "public"."lms_lesse" validate constraint "lms_lesse_module_id_fkey";

alter table "public"."lms_modules" add constraint "lms_modules_kursus_id_fkey" FOREIGN KEY (kursus_id) REFERENCES public.lms_kursusse(id) ON DELETE CASCADE not valid;

alter table "public"."lms_modules" validate constraint "lms_modules_kursus_id_fkey";

alter table "public"."lms_questions" add constraint "lms_questions_les_id_fkey" FOREIGN KEY (les_id) REFERENCES public.lms_lesse(id) ON DELETE CASCADE not valid;

alter table "public"."lms_questions" validate constraint "lms_questions_les_id_fkey";

alter table "public"."lms_quiz_attempts" add constraint "lms_quiz_attempts_gebruiker_id_fkey" FOREIGN KEY (gebruiker_id) REFERENCES public.gebruikers(id) ON DELETE CASCADE not valid;

alter table "public"."lms_quiz_attempts" validate constraint "lms_quiz_attempts_gebruiker_id_fkey";

alter table "public"."lms_quiz_attempts" add constraint "lms_quiz_attempts_les_id_fkey" FOREIGN KEY (les_id) REFERENCES public.lms_lesse(id) ON DELETE CASCADE not valid;

alter table "public"."lms_quiz_attempts" validate constraint "lms_quiz_attempts_les_id_fkey";

alter table "public"."lms_registrasies" add constraint "lms_registrasies_gebruiker_id_fkey" FOREIGN KEY (gebruiker_id) REFERENCES public.gebruikers(id) ON DELETE CASCADE not valid;

alter table "public"."lms_registrasies" validate constraint "lms_registrasies_gebruiker_id_fkey";

alter table "public"."lms_registrasies" add constraint "lms_registrasies_kursus_id_fkey" FOREIGN KEY (kursus_id) REFERENCES public.lms_kursusse(id) ON DELETE CASCADE not valid;

alter table "public"."lms_registrasies" validate constraint "lms_registrasies_kursus_id_fkey";

alter table "public"."lms_registrasies" add constraint "lms_registrasies_kursus_id_gebruiker_id_key" UNIQUE using index "lms_registrasies_kursus_id_gebruiker_id_key";

alter table "public"."lms_vordering" add constraint "lms_vordering_gebruiker_id_fkey" FOREIGN KEY (gebruiker_id) REFERENCES public.gebruikers(id) ON DELETE CASCADE not valid;

alter table "public"."lms_vordering" validate constraint "lms_vordering_gebruiker_id_fkey";

alter table "public"."lms_vordering" add constraint "lms_vordering_gebruiker_id_les_id_key" UNIQUE using index "lms_vordering_gebruiker_id_les_id_key";

alter table "public"."lms_vordering" add constraint "lms_vordering_kursus_id_fkey" FOREIGN KEY (kursus_id) REFERENCES public.lms_kursusse(id) ON DELETE CASCADE not valid;

alter table "public"."lms_vordering" validate constraint "lms_vordering_kursus_id_fkey";

alter table "public"."lms_vordering" add constraint "lms_vordering_les_id_fkey" FOREIGN KEY (les_id) REFERENCES public.lms_lesse(id) ON DELETE CASCADE not valid;

alter table "public"."lms_vordering" validate constraint "lms_vordering_les_id_fkey";

alter table "public"."vbo_aktiwiteite" add constraint "vbo_aktiwiteite_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.gebruikers(id) ON DELETE SET NULL not valid;

alter table "public"."vbo_aktiwiteite" validate constraint "vbo_aktiwiteite_created_by_fkey";

alter table "public"."vbo_aktiwiteite" add constraint "vbo_aktiwiteite_kursus_id_fkey" FOREIGN KEY (kursus_id) REFERENCES public.lms_kursusse(id) ON DELETE SET NULL not valid;

alter table "public"."vbo_aktiwiteite" validate constraint "vbo_aktiwiteite_kursus_id_fkey";

alter table "public"."vbo_aktiwiteite" add constraint "vbo_aktiwiteite_tipe_check" CHECK ((tipe = ANY (ARRAY['kursus'::text, 'konferensie'::text, 'werkwinkel'::text, 'mentorskap'::text, 'navorsing'::text, 'publikasie'::text, 'ander'::text]))) not valid;

alter table "public"."vbo_aktiwiteite" validate constraint "vbo_aktiwiteite_tipe_check";

alter table "public"."vbo_indienings" add constraint "vbo_indienings_aktiwiteit_id_fkey" FOREIGN KEY (aktiwiteit_id) REFERENCES public.vbo_aktiwiteite(id) ON DELETE RESTRICT not valid;

alter table "public"."vbo_indienings" validate constraint "vbo_indienings_aktiwiteit_id_fkey";

alter table "public"."wyke" add constraint "wyke_gemeente_id_fkey" FOREIGN KEY (gemeente_id) REFERENCES public.gemeentes(id) not valid;

alter table "public"."wyke" validate constraint "wyke_gemeente_id_fkey";

alter table "public"."wyke" add constraint "wyke_leier_id_fkey" FOREIGN KEY (leier_id) REFERENCES public.gebruikers(id) not valid;

alter table "public"."wyke" validate constraint "wyke_leier_id_fkey";

set check_function_bodies = off;

create or replace view "public"."congregation_statistics_with_growth" as  SELECT id,
    congregation_id,
    year,
    baptized_members,
    confessing_members,
    total_souls,
    births,
    deaths,
    baptisms,
    confirmations,
    transfers_in,
    transfers_out,
    notes,
    created_by,
    created_at,
    updated_at,
    lag(total_souls) OVER (PARTITION BY congregation_id ORDER BY year) AS previous_year_total,
    (total_souls - lag(total_souls) OVER (PARTITION BY congregation_id ORDER BY year)) AS growth,
        CASE
            WHEN (lag(total_souls) OVER (PARTITION BY congregation_id ORDER BY year) > 0) THEN round(((((total_souls - lag(total_souls) OVER (PARTITION BY congregation_id ORDER BY year)))::numeric / (lag(total_souls) OVER (PARTITION BY congregation_id ORDER BY year))::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS growth_percentage
   FROM public.congregation_statistics cs;


create or replace view "public"."geloofsonderrig_leaderboard" as  SELECT leerder_id,
    (sum(punte))::integer AS totaal_punte,
    rank() OVER (ORDER BY (sum(punte)) DESC) AS rang
   FROM public.geloofsonderrig_punte
  GROUP BY leerder_id;


create or replace view "public"."geloofsonderrig_skav_opsomming" as  WITH flattened_logs AS (
         SELECT geloofsonderrig_ai_logs.leerder_id,
            geloofsonderrig_ai_logs.les_id,
            ((geloofsonderrig_ai_logs.kgvw_scores ->> 'kennis'::text))::numeric AS kennis,
            ((geloofsonderrig_ai_logs.kgvw_scores ->> 'gesindheid'::text))::numeric AS gesindheid,
            ((geloofsonderrig_ai_logs.kgvw_scores ->> 'vaardigheid'::text))::numeric AS vaardigheid,
            ((geloofsonderrig_ai_logs.kgvw_scores ->> 'values'::text))::numeric AS waardes,
            (geloofsonderrig_ai_logs.kgvw_scores -> 'sterkpunte'::text) AS sp,
            (geloofsonderrig_ai_logs.kgvw_scores -> 'leemtes'::text) AS lm,
            geloofsonderrig_ai_logs.created_at
           FROM public.geloofsonderrig_ai_logs
        )
 SELECT flattened_logs.leerder_id,
    flattened_logs.les_id,
    (avg(flattened_logs.kennis) * (10)::numeric) AS kennis_telling,
    (avg(flattened_logs.gesindheid) * (10)::numeric) AS gesindheid_telling,
    (avg(flattened_logs.vaardigheid) * (10)::numeric) AS vaardighede_telling,
    (avg(flattened_logs.waardes) * (10)::numeric) AS waardes_telling,
    array_agg(DISTINCT s.val) FILTER (WHERE (s.val IS NOT NULL)) AS sterkpunte,
    array_agg(DISTINCT l.val) FILTER (WHERE (l.val IS NOT NULL)) AS leemtes,
    max(flattened_logs.created_at) AS laaste_opdatering
   FROM ((flattened_logs
     LEFT JOIN LATERAL jsonb_array_elements_text(flattened_logs.sp) s(val) ON (true))
     LEFT JOIN LATERAL jsonb_array_elements_text(flattened_logs.lm) l(val) ON (true))
  GROUP BY flattened_logs.leerder_id, flattened_logs.les_id;


CREATE OR REPLACE FUNCTION public.get_geloofsonderrig_leaderboard_leerder(p_leerder_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(rang bigint, totaal_punte integer, is_current_user boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    l.rang::BIGINT,
    l.totaal_punte,
    (l.leerder_id = p_leerder_id) AS is_current_user
  FROM geloofsonderrig_leaderboard l
  ORDER BY l.rang
  LIMIT 100;
$function$
;

CREATE OR REPLACE FUNCTION public.get_geloofsonderrig_leaderboard_public()
 RETURNS TABLE(rang bigint, totaal_punte integer, is_current_user boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    l.rang::BIGINT,
    l.totaal_punte,
    (l.leerder_id = auth.uid())
  FROM geloofsonderrig_leaderboard l
  ORDER BY l.rang
  LIMIT 100;
$function$
;

CREATE OR REPLACE FUNCTION public.get_geloofsonderrig_vordering_leerder(p_leerder_id uuid)
 RETURNS SETOF public.geloofsonderrig_vordering
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM public.geloofsonderrig_vordering WHERE leerder_id = p_leerder_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_geloofsonderrig_rank()
 RETURNS TABLE(rang bigint, totaal_punte integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT l.rang, l.totaal_punte
  FROM geloofsonderrig_leaderboard l
  WHERE l.leerder_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT rol FROM public.gebruikers WHERE id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.initialize_congregation_inventory(cong_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO congregation_inventory (congregation_id, item_name, item_category)
  VALUES
    (cong_id, 'Doopregister', 'Registers'),
    (cong_id, 'Lidmaatregister', 'Registers'),
    (cong_id, 'Belydenisregister', 'Registers'),
    (cong_id, 'Huweliksregister', 'Registers'),
    (cong_id, 'Begrafnisregister', 'Registers'),
    (cong_id, 'Kerkraadnotules', 'Minutes'),
    (cong_id, 'Diakensnotules', 'Minutes'),
    (cong_id, 'Finansiële State', 'Financial'),
    (cong_id, 'Bateregister', 'Financial'),
    (cong_id, 'Bankstate', 'Financial'),
    (cong_id, 'Belastingdokumente', 'Financial'),
    (cong_id, 'Versekeringspolis', 'Legal'),
    (cong_id, 'Grondtitel', 'Legal'),
    (cong_id, 'Boutekeninge', 'Legal'),
    (cong_id, 'Kontrakte', 'Legal')
  ON CONFLICT (congregation_id, item_name) DO NOTHING;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_geloofsonderrig_punte_leerder(p_leerder_id uuid, p_aksie_tipe text, p_punte integer, p_les_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.geloofsonderrig_punte (leerder_id, aksie_tipe, punte, les_id)
  VALUES (p_leerder_id, p_aksie_tipe, p_punte, p_les_id);
END;
$function$
;

create or replace view "public"."non_compliant_inventory" as  SELECT g.naam AS gemeente_naam,
    ci.item_name,
    ci.item_category,
    ci.date_from,
    ci.date_to,
    ci.format,
    ci.is_compliant,
    ci.compliance_notes,
        CASE
            WHEN ((ci.date_from IS NULL) OR (ci.date_to IS NULL)) THEN 'Datums ontbreek'::text
            WHEN (ci.format IS NULL) THEN 'Formaat nie gespesifiseer'::text
            WHEN (ci.is_compliant = false) THEN 'Nie voldoen nie'::text
            ELSE 'Ander probleem'::text
        END AS issue_type
   FROM (public.congregation_inventory ci
     JOIN public.gemeentes g ON ((g.id = ci.congregation_id)))
  WHERE ((ci.is_compliant = false) OR (ci.date_from IS NULL) OR (ci.date_to IS NULL) OR (ci.format IS NULL))
  ORDER BY g.naam, ci.item_category, ci.item_name;


CREATE OR REPLACE FUNCTION public.upsert_geloofsonderrig_vordering_leerder(p_leerder_id uuid, p_les_id uuid, p_voltooi boolean, p_quiz_score integer DEFAULT 0, p_quiz_total integer DEFAULT 5, p_verse_completed integer DEFAULT 0, p_verse_total integer DEFAULT 3, p_visualiserings_count integer DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.geloofsonderrig_vordering (
    leerder_id, les_id, voltooi, quiz_score, quiz_total,
    verse_completed, verse_total, visualiserings_count, datum, updated_at
  ) VALUES (
    p_leerder_id, p_les_id, p_voltooi, p_quiz_score, p_quiz_total,
    p_verse_completed, p_verse_total, p_visualiserings_count,
    NOW(), NOW()
  )
  ON CONFLICT (leerder_id, les_id) DO UPDATE SET
    voltooi = EXCLUDED.voltooi,
    quiz_score = EXCLUDED.quiz_score,
    quiz_total = EXCLUDED.quiz_total,
    verse_completed = EXCLUDED.verse_completed,
    verse_total = EXCLUDED.verse_total,
    visualiserings_count = EXCLUDED.visualiserings_count,
    updated_at = NOW();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_compliant_congregations_count()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM hoof_admin_gemeente_summary
    WHERE is_fully_compliant = true
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_geloofsonderrig_leaderboard_admin(p_admin_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(rang bigint, leerder_id uuid, naam text, van text, totaal_punte integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_check_id UUID;
BEGIN
  -- NHKA: p_admin_id gebruik (geen Supabase Auth)
  v_check_id := COALESCE(p_admin_id, auth.uid());
  IF v_check_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.gebruikers WHERE id = v_check_id AND rol IN ('hoof_admin', 'geloofsonderrig_admin')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
  SELECT 
    l.rang::BIGINT,
    l.leerder_id,
    g.naam::TEXT,
    g.van::TEXT,
    l.totaal_punte
  FROM public.geloofsonderrig_leaderboard l
  JOIN public.gebruikers g ON g.id = l.leerder_id
  ORDER BY l.rang
  LIMIT 100;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_total_church_souls()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(latest_total_souls), 0)::INTEGER
    FROM hoof_admin_gemeente_summary
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_lidmaat_status_verandering()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.lidmaat_status <> OLD.lidmaat_status AND NEW.lidmaat_status IN ('oorlede', 'verhuis', 'bedank') THEN
        INSERT INTO public.gemeente_statistiek_logs (gemeente_id, gebruiker_id, tipe, rede, beskrywing)
        VALUES (NEW.gemeente_id, NEW.id, 'vermindering', NEW.lidmaat_status, 'Lidmaat status verander na ' || NEW.lidmaat_status);
    ELSIF NEW.lidmaat_status <> OLD.lidmaat_status AND NEW.lidmaat_status = 'aktief' THEN
        INSERT INTO public.gemeente_statistiek_logs (gemeente_id, gebruiker_id, tipe, rede, beskrywing)
        VALUES (NEW.gemeente_id, NEW.id, 'vermeerdering', 'heraktiveer', 'Lidmaat weer aktief gemaak');
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_lidmaat_vermeerdering()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.gemeente_statistiek_logs (gemeente_id, gebruiker_id, tipe, rede, beskrywing)
    VALUES (NEW.gemeente_id, NEW.id, 'vermeerdering', 'nuwe_registrasie', 'Lidmaat bygevoeg of geregistreer');
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.match_omsendbrief_chunks(query_embedding public.vector, match_count integer DEFAULT 5)
 RETURNS TABLE(id uuid, content text, dokument_id uuid, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.content,
    c.dokument_id,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM omsendbrief_chunks c
  WHERE c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.match_omsendbrief_chunks(query_embedding public.vector, match_count integer DEFAULT 10, match_threshold double precision DEFAULT 0.52)
 RETURNS TABLE(id uuid, content text, dokument_id uuid, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      c.id,
      c.content,
      c.dokument_id,
      1 - (c.embedding <=> query_embedding) AS sim
    FROM omsendbrief_chunks c
    WHERE c.embedding IS NOT NULL
  )
  SELECT
    r.id,
    r.content,
    r.dokument_id,
    r.sim AS similarity
  FROM ranked r
  WHERE r.sim >= match_threshold
  ORDER BY r.sim DESC
  LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.omsendbrief_hybrid_search(p_query_text text, p_query_embedding public.vector, p_limit integer DEFAULT 10, p_vector_weight double precision DEFAULT 0.5, p_fts_weight double precision DEFAULT 0.5)
 RETURNS TABLE(chunk_id uuid, dokument_id uuid, content text, similarity double precision, fts_rank double precision, combined_score double precision, document_title text, original_file_url text, filename text)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_fts_query tsquery;
  v_query_clean text;
BEGIN
  -- Build FTS query from user input (websearch_to_tsquery handles phrases, AND/OR)
  v_query_clean := TRIM(COALESCE(p_query_text, ''));
  v_fts_query := CASE
    WHEN v_query_clean = '' THEN to_tsquery('simple', 'x') && to_tsquery('simple', '!x')  -- matches nothing
    ELSE websearch_to_tsquery('simple', v_query_clean)
  END;

  RETURN QUERY
  WITH
  -- Vector search: top chunks by cosine similarity
  vector_results AS (
    SELECT
      c.id AS chunk_id,
      c.dokument_id,
      c.content,
      1 - (c.embedding <=> p_query_embedding) AS sim
    FROM omsendbrief_chunks c
    WHERE c.embedding IS NOT NULL
    ORDER BY c.embedding <=> p_query_embedding
    LIMIT p_limit * 2  -- fetch more for merging
  ),
  -- FTS search: chunks + document title
  fts_results AS (
    SELECT
      c.id AS chunk_id,
      c.dokument_id,
      c.content,
      ts_rank(
        to_tsvector('simple', COALESCE(c.content, '') || ' ' || COALESCE(d.metadata->>'title', '') || ' ' || COALESCE(d.content, '')),
        v_fts_query
      ) AS rnk
    FROM omsendbrief_chunks c
    JOIN omsendbrief_dokumente d ON d.id = c.dokument_id
    WHERE to_tsvector('simple', COALESCE(c.content, '') || ' ' || COALESCE(d.metadata->>'title', '') || ' ' || COALESCE(d.content, '')) @@ v_fts_query
    ORDER BY rnk DESC
    LIMIT p_limit * 2
  ),
  -- Normalize and combine scores (0-1 range); when all same, use 1
  vector_norm AS (
    SELECT vr.*,
           COALESCE(
             (vr.sim - MIN(vr.sim) OVER ()) / NULLIF(MAX(vr.sim) OVER () - MIN(vr.sim) OVER (), 0),
             1
           ) AS norm_sim
    FROM vector_results vr
  ),
  fts_norm AS (
    SELECT fr.*,
           COALESCE(
             (fr.rnk - MIN(fr.rnk) OVER ()) / NULLIF(MAX(fr.rnk) OVER () - MIN(fr.rnk) OVER (), 0),
             1
           ) AS norm_rnk
    FROM fts_results fr
  ),
  -- Merge: union chunks from both, take best score per chunk
  merged AS (
    SELECT
      COALESCE(vn.chunk_id, fn.chunk_id) AS chunk_id,
      COALESCE(vn.dokument_id, fn.dokument_id) AS dokument_id,
      COALESCE(vn.content, fn.content) AS content,
      COALESCE(vn.sim, 0) AS similarity,
      COALESCE(fn.rnk, 0) AS fts_rank,
      (COALESCE(vn.norm_sim, 0) * p_vector_weight + COALESCE(fn.norm_rnk, 0) * p_fts_weight) AS combined_score
    FROM vector_norm vn
    FULL OUTER JOIN fts_norm fn ON vn.chunk_id = fn.chunk_id
  ),
  -- Title match boost: if query appears in document title, boost combined_score
  boosted AS (
    SELECT
      m.chunk_id,
      m.dokument_id,
      m.content,
      m.similarity,
      m.fts_rank,
      CASE
        WHEN d.metadata->>'title' IS NOT NULL
             AND LOWER(d.metadata->>'title') LIKE '%' || LOWER(p_query_text) || '%'
        THEN m.combined_score + 0.3  -- boost for title match
        ELSE m.combined_score
      END AS combined_score,
      d.metadata->>'title' AS document_title,
      d.original_file_url,
      d.filename
    FROM merged m
    JOIN omsendbrief_dokumente d ON d.id = m.dokument_id
  )
  SELECT
    b.chunk_id,
    b.dokument_id,
    b.content,
    b.similarity,
    b.fts_rank,
    b.combined_score,
    b.document_title,
    b.original_file_url,
    b.filename
  FROM boosted b
  ORDER BY b.combined_score DESC
  LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_gemeente_last_data_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE gemeentes 
  SET last_data_update = NOW()
  WHERE id = NEW.congregation_id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."besoekpunte" to "anon";

grant insert on table "public"."besoekpunte" to "anon";

grant references on table "public"."besoekpunte" to "anon";

grant select on table "public"."besoekpunte" to "anon";

grant trigger on table "public"."besoekpunte" to "anon";

grant truncate on table "public"."besoekpunte" to "anon";

grant update on table "public"."besoekpunte" to "anon";

grant delete on table "public"."besoekpunte" to "authenticated";

grant insert on table "public"."besoekpunte" to "authenticated";

grant references on table "public"."besoekpunte" to "authenticated";

grant select on table "public"."besoekpunte" to "authenticated";

grant trigger on table "public"."besoekpunte" to "authenticated";

grant truncate on table "public"."besoekpunte" to "authenticated";

grant update on table "public"."besoekpunte" to "authenticated";

grant delete on table "public"."besoekpunte" to "service_role";

grant insert on table "public"."besoekpunte" to "service_role";

grant references on table "public"."besoekpunte" to "service_role";

grant select on table "public"."besoekpunte" to "service_role";

grant trigger on table "public"."besoekpunte" to "service_role";

grant truncate on table "public"."besoekpunte" to "service_role";

grant update on table "public"."besoekpunte" to "service_role";

grant delete on table "public"."betalings" to "anon";

grant insert on table "public"."betalings" to "anon";

grant references on table "public"."betalings" to "anon";

grant select on table "public"."betalings" to "anon";

grant trigger on table "public"."betalings" to "anon";

grant truncate on table "public"."betalings" to "anon";

grant update on table "public"."betalings" to "anon";

grant delete on table "public"."betalings" to "authenticated";

grant insert on table "public"."betalings" to "authenticated";

grant references on table "public"."betalings" to "authenticated";

grant select on table "public"."betalings" to "authenticated";

grant trigger on table "public"."betalings" to "authenticated";

grant truncate on table "public"."betalings" to "authenticated";

grant update on table "public"."betalings" to "authenticated";

grant delete on table "public"."betalings" to "service_role";

grant insert on table "public"."betalings" to "service_role";

grant references on table "public"."betalings" to "service_role";

grant select on table "public"."betalings" to "service_role";

grant trigger on table "public"."betalings" to "service_role";

grant truncate on table "public"."betalings" to "service_role";

grant update on table "public"."betalings" to "service_role";

grant delete on table "public"."boodskap_ontvangers" to "anon";

grant insert on table "public"."boodskap_ontvangers" to "anon";

grant references on table "public"."boodskap_ontvangers" to "anon";

grant select on table "public"."boodskap_ontvangers" to "anon";

grant trigger on table "public"."boodskap_ontvangers" to "anon";

grant truncate on table "public"."boodskap_ontvangers" to "anon";

grant update on table "public"."boodskap_ontvangers" to "anon";

grant delete on table "public"."boodskap_ontvangers" to "authenticated";

grant insert on table "public"."boodskap_ontvangers" to "authenticated";

grant references on table "public"."boodskap_ontvangers" to "authenticated";

grant select on table "public"."boodskap_ontvangers" to "authenticated";

grant trigger on table "public"."boodskap_ontvangers" to "authenticated";

grant truncate on table "public"."boodskap_ontvangers" to "authenticated";

grant update on table "public"."boodskap_ontvangers" to "authenticated";

grant delete on table "public"."boodskap_ontvangers" to "service_role";

grant insert on table "public"."boodskap_ontvangers" to "service_role";

grant references on table "public"."boodskap_ontvangers" to "service_role";

grant select on table "public"."boodskap_ontvangers" to "service_role";

grant trigger on table "public"."boodskap_ontvangers" to "service_role";

grant truncate on table "public"."boodskap_ontvangers" to "service_role";

grant update on table "public"."boodskap_ontvangers" to "service_role";

grant delete on table "public"."boodskappe" to "anon";

grant insert on table "public"."boodskappe" to "anon";

grant references on table "public"."boodskappe" to "anon";

grant select on table "public"."boodskappe" to "anon";

grant trigger on table "public"."boodskappe" to "anon";

grant truncate on table "public"."boodskappe" to "anon";

grant update on table "public"."boodskappe" to "anon";

grant delete on table "public"."boodskappe" to "authenticated";

grant insert on table "public"."boodskappe" to "authenticated";

grant references on table "public"."boodskappe" to "authenticated";

grant select on table "public"."boodskappe" to "authenticated";

grant trigger on table "public"."boodskappe" to "authenticated";

grant truncate on table "public"."boodskappe" to "authenticated";

grant update on table "public"."boodskappe" to "authenticated";

grant delete on table "public"."boodskappe" to "service_role";

grant insert on table "public"."boodskappe" to "service_role";

grant references on table "public"."boodskappe" to "service_role";

grant select on table "public"."boodskappe" to "service_role";

grant trigger on table "public"."boodskappe" to "service_role";

grant truncate on table "public"."boodskappe" to "service_role";

grant update on table "public"."boodskappe" to "service_role";

grant delete on table "public"."dagstukkies" to "anon";

grant insert on table "public"."dagstukkies" to "anon";

grant references on table "public"."dagstukkies" to "anon";

grant select on table "public"."dagstukkies" to "anon";

grant trigger on table "public"."dagstukkies" to "anon";

grant truncate on table "public"."dagstukkies" to "anon";

grant update on table "public"."dagstukkies" to "anon";

grant delete on table "public"."dagstukkies" to "authenticated";

grant insert on table "public"."dagstukkies" to "authenticated";

grant references on table "public"."dagstukkies" to "authenticated";

grant select on table "public"."dagstukkies" to "authenticated";

grant trigger on table "public"."dagstukkies" to "authenticated";

grant truncate on table "public"."dagstukkies" to "authenticated";

grant update on table "public"."dagstukkies" to "authenticated";

grant delete on table "public"."dagstukkies" to "service_role";

grant insert on table "public"."dagstukkies" to "service_role";

grant references on table "public"."dagstukkies" to "service_role";

grant select on table "public"."dagstukkies" to "service_role";

grant trigger on table "public"."dagstukkies" to "service_role";

grant truncate on table "public"."dagstukkies" to "service_role";

grant update on table "public"."dagstukkies" to "service_role";

grant delete on table "public"."dokument_kategoriee" to "anon";

grant insert on table "public"."dokument_kategoriee" to "anon";

grant references on table "public"."dokument_kategoriee" to "anon";

grant select on table "public"."dokument_kategoriee" to "anon";

grant trigger on table "public"."dokument_kategoriee" to "anon";

grant truncate on table "public"."dokument_kategoriee" to "anon";

grant update on table "public"."dokument_kategoriee" to "anon";

grant delete on table "public"."dokument_kategoriee" to "authenticated";

grant insert on table "public"."dokument_kategoriee" to "authenticated";

grant references on table "public"."dokument_kategoriee" to "authenticated";

grant select on table "public"."dokument_kategoriee" to "authenticated";

grant trigger on table "public"."dokument_kategoriee" to "authenticated";

grant truncate on table "public"."dokument_kategoriee" to "authenticated";

grant update on table "public"."dokument_kategoriee" to "authenticated";

grant delete on table "public"."dokument_kategoriee" to "service_role";

grant insert on table "public"."dokument_kategoriee" to "service_role";

grant references on table "public"."dokument_kategoriee" to "service_role";

grant select on table "public"."dokument_kategoriee" to "service_role";

grant trigger on table "public"."dokument_kategoriee" to "service_role";

grant truncate on table "public"."dokument_kategoriee" to "service_role";

grant update on table "public"."dokument_kategoriee" to "service_role";

grant delete on table "public"."dokumente" to "anon";

grant insert on table "public"."dokumente" to "anon";

grant references on table "public"."dokumente" to "anon";

grant select on table "public"."dokumente" to "anon";

grant trigger on table "public"."dokumente" to "anon";

grant truncate on table "public"."dokumente" to "anon";

grant update on table "public"."dokumente" to "anon";

grant delete on table "public"."dokumente" to "authenticated";

grant insert on table "public"."dokumente" to "authenticated";

grant references on table "public"."dokumente" to "authenticated";

grant select on table "public"."dokumente" to "authenticated";

grant trigger on table "public"."dokumente" to "authenticated";

grant truncate on table "public"."dokumente" to "authenticated";

grant update on table "public"."dokumente" to "authenticated";

grant delete on table "public"."dokumente" to "service_role";

grant insert on table "public"."dokumente" to "service_role";

grant references on table "public"."dokumente" to "service_role";

grant select on table "public"."dokumente" to "service_role";

grant trigger on table "public"."dokumente" to "service_role";

grant truncate on table "public"."dokumente" to "service_role";

grant update on table "public"."dokumente" to "service_role";

grant delete on table "public"."erediens_info" to "anon";

grant insert on table "public"."erediens_info" to "anon";

grant references on table "public"."erediens_info" to "anon";

grant select on table "public"."erediens_info" to "anon";

grant trigger on table "public"."erediens_info" to "anon";

grant truncate on table "public"."erediens_info" to "anon";

grant update on table "public"."erediens_info" to "anon";

grant delete on table "public"."erediens_info" to "authenticated";

grant insert on table "public"."erediens_info" to "authenticated";

grant references on table "public"."erediens_info" to "authenticated";

grant select on table "public"."erediens_info" to "authenticated";

grant trigger on table "public"."erediens_info" to "authenticated";

grant truncate on table "public"."erediens_info" to "authenticated";

grant update on table "public"."erediens_info" to "authenticated";

grant delete on table "public"."erediens_info" to "service_role";

grant insert on table "public"."erediens_info" to "service_role";

grant references on table "public"."erediens_info" to "service_role";

grant select on table "public"."erediens_info" to "service_role";

grant trigger on table "public"."erediens_info" to "service_role";

grant truncate on table "public"."erediens_info" to "service_role";

grant update on table "public"."erediens_info" to "service_role";

grant delete on table "public"."eredienste" to "anon";

grant insert on table "public"."eredienste" to "anon";

grant references on table "public"."eredienste" to "anon";

grant select on table "public"."eredienste" to "anon";

grant trigger on table "public"."eredienste" to "anon";

grant truncate on table "public"."eredienste" to "anon";

grant update on table "public"."eredienste" to "anon";

grant delete on table "public"."eredienste" to "authenticated";

grant insert on table "public"."eredienste" to "authenticated";

grant references on table "public"."eredienste" to "authenticated";

grant select on table "public"."eredienste" to "authenticated";

grant trigger on table "public"."eredienste" to "authenticated";

grant truncate on table "public"."eredienste" to "authenticated";

grant update on table "public"."eredienste" to "authenticated";

grant delete on table "public"."eredienste" to "service_role";

grant insert on table "public"."eredienste" to "service_role";

grant references on table "public"."eredienste" to "service_role";

grant select on table "public"."eredienste" to "service_role";

grant trigger on table "public"."eredienste" to "service_role";

grant truncate on table "public"."eredienste" to "service_role";

grant update on table "public"."eredienste" to "service_role";

grant delete on table "public"."geloofsonderrig_ai_logs" to "anon";

grant insert on table "public"."geloofsonderrig_ai_logs" to "anon";

grant references on table "public"."geloofsonderrig_ai_logs" to "anon";

grant select on table "public"."geloofsonderrig_ai_logs" to "anon";

grant trigger on table "public"."geloofsonderrig_ai_logs" to "anon";

grant truncate on table "public"."geloofsonderrig_ai_logs" to "anon";

grant update on table "public"."geloofsonderrig_ai_logs" to "anon";

grant delete on table "public"."geloofsonderrig_ai_logs" to "authenticated";

grant insert on table "public"."geloofsonderrig_ai_logs" to "authenticated";

grant references on table "public"."geloofsonderrig_ai_logs" to "authenticated";

grant select on table "public"."geloofsonderrig_ai_logs" to "authenticated";

grant trigger on table "public"."geloofsonderrig_ai_logs" to "authenticated";

grant truncate on table "public"."geloofsonderrig_ai_logs" to "authenticated";

grant update on table "public"."geloofsonderrig_ai_logs" to "authenticated";

grant delete on table "public"."geloofsonderrig_ai_logs" to "service_role";

grant insert on table "public"."geloofsonderrig_ai_logs" to "service_role";

grant references on table "public"."geloofsonderrig_ai_logs" to "service_role";

grant select on table "public"."geloofsonderrig_ai_logs" to "service_role";

grant trigger on table "public"."geloofsonderrig_ai_logs" to "service_role";

grant truncate on table "public"."geloofsonderrig_ai_logs" to "service_role";

grant update on table "public"."geloofsonderrig_ai_logs" to "service_role";

grant delete on table "public"."geloofsonderrig_files" to "anon";

grant insert on table "public"."geloofsonderrig_files" to "anon";

grant references on table "public"."geloofsonderrig_files" to "anon";

grant select on table "public"."geloofsonderrig_files" to "anon";

grant trigger on table "public"."geloofsonderrig_files" to "anon";

grant truncate on table "public"."geloofsonderrig_files" to "anon";

grant update on table "public"."geloofsonderrig_files" to "anon";

grant delete on table "public"."geloofsonderrig_files" to "authenticated";

grant insert on table "public"."geloofsonderrig_files" to "authenticated";

grant references on table "public"."geloofsonderrig_files" to "authenticated";

grant select on table "public"."geloofsonderrig_files" to "authenticated";

grant trigger on table "public"."geloofsonderrig_files" to "authenticated";

grant truncate on table "public"."geloofsonderrig_files" to "authenticated";

grant update on table "public"."geloofsonderrig_files" to "authenticated";

grant delete on table "public"."geloofsonderrig_files" to "service_role";

grant insert on table "public"."geloofsonderrig_files" to "service_role";

grant references on table "public"."geloofsonderrig_files" to "service_role";

grant select on table "public"."geloofsonderrig_files" to "service_role";

grant trigger on table "public"."geloofsonderrig_files" to "service_role";

grant truncate on table "public"."geloofsonderrig_files" to "service_role";

grant update on table "public"."geloofsonderrig_files" to "service_role";

grant delete on table "public"."geloofsonderrig_grade" to "anon";

grant insert on table "public"."geloofsonderrig_grade" to "anon";

grant references on table "public"."geloofsonderrig_grade" to "anon";

grant select on table "public"."geloofsonderrig_grade" to "anon";

grant trigger on table "public"."geloofsonderrig_grade" to "anon";

grant truncate on table "public"."geloofsonderrig_grade" to "anon";

grant update on table "public"."geloofsonderrig_grade" to "anon";

grant delete on table "public"."geloofsonderrig_grade" to "authenticated";

grant insert on table "public"."geloofsonderrig_grade" to "authenticated";

grant references on table "public"."geloofsonderrig_grade" to "authenticated";

grant select on table "public"."geloofsonderrig_grade" to "authenticated";

grant trigger on table "public"."geloofsonderrig_grade" to "authenticated";

grant truncate on table "public"."geloofsonderrig_grade" to "authenticated";

grant update on table "public"."geloofsonderrig_grade" to "authenticated";

grant delete on table "public"."geloofsonderrig_grade" to "service_role";

grant insert on table "public"."geloofsonderrig_grade" to "service_role";

grant references on table "public"."geloofsonderrig_grade" to "service_role";

grant select on table "public"."geloofsonderrig_grade" to "service_role";

grant trigger on table "public"."geloofsonderrig_grade" to "service_role";

grant truncate on table "public"."geloofsonderrig_grade" to "service_role";

grant update on table "public"."geloofsonderrig_grade" to "service_role";

grant delete on table "public"."geloofsonderrig_klas_leerders" to "anon";

grant insert on table "public"."geloofsonderrig_klas_leerders" to "anon";

grant references on table "public"."geloofsonderrig_klas_leerders" to "anon";

grant select on table "public"."geloofsonderrig_klas_leerders" to "anon";

grant trigger on table "public"."geloofsonderrig_klas_leerders" to "anon";

grant truncate on table "public"."geloofsonderrig_klas_leerders" to "anon";

grant update on table "public"."geloofsonderrig_klas_leerders" to "anon";

grant delete on table "public"."geloofsonderrig_klas_leerders" to "authenticated";

grant insert on table "public"."geloofsonderrig_klas_leerders" to "authenticated";

grant references on table "public"."geloofsonderrig_klas_leerders" to "authenticated";

grant select on table "public"."geloofsonderrig_klas_leerders" to "authenticated";

grant trigger on table "public"."geloofsonderrig_klas_leerders" to "authenticated";

grant truncate on table "public"."geloofsonderrig_klas_leerders" to "authenticated";

grant update on table "public"."geloofsonderrig_klas_leerders" to "authenticated";

grant delete on table "public"."geloofsonderrig_klas_leerders" to "service_role";

grant insert on table "public"."geloofsonderrig_klas_leerders" to "service_role";

grant references on table "public"."geloofsonderrig_klas_leerders" to "service_role";

grant select on table "public"."geloofsonderrig_klas_leerders" to "service_role";

grant trigger on table "public"."geloofsonderrig_klas_leerders" to "service_role";

grant truncate on table "public"."geloofsonderrig_klas_leerders" to "service_role";

grant update on table "public"."geloofsonderrig_klas_leerders" to "service_role";

grant delete on table "public"."geloofsonderrig_klasse" to "anon";

grant insert on table "public"."geloofsonderrig_klasse" to "anon";

grant references on table "public"."geloofsonderrig_klasse" to "anon";

grant select on table "public"."geloofsonderrig_klasse" to "anon";

grant trigger on table "public"."geloofsonderrig_klasse" to "anon";

grant truncate on table "public"."geloofsonderrig_klasse" to "anon";

grant update on table "public"."geloofsonderrig_klasse" to "anon";

grant delete on table "public"."geloofsonderrig_klasse" to "authenticated";

grant insert on table "public"."geloofsonderrig_klasse" to "authenticated";

grant references on table "public"."geloofsonderrig_klasse" to "authenticated";

grant select on table "public"."geloofsonderrig_klasse" to "authenticated";

grant trigger on table "public"."geloofsonderrig_klasse" to "authenticated";

grant truncate on table "public"."geloofsonderrig_klasse" to "authenticated";

grant update on table "public"."geloofsonderrig_klasse" to "authenticated";

grant delete on table "public"."geloofsonderrig_klasse" to "service_role";

grant insert on table "public"."geloofsonderrig_klasse" to "service_role";

grant references on table "public"."geloofsonderrig_klasse" to "service_role";

grant select on table "public"."geloofsonderrig_klasse" to "service_role";

grant trigger on table "public"."geloofsonderrig_klasse" to "service_role";

grant truncate on table "public"."geloofsonderrig_klasse" to "service_role";

grant update on table "public"."geloofsonderrig_klasse" to "service_role";

grant delete on table "public"."geloofsonderrig_lesse" to "anon";

grant insert on table "public"."geloofsonderrig_lesse" to "anon";

grant references on table "public"."geloofsonderrig_lesse" to "anon";

grant select on table "public"."geloofsonderrig_lesse" to "anon";

grant trigger on table "public"."geloofsonderrig_lesse" to "anon";

grant truncate on table "public"."geloofsonderrig_lesse" to "anon";

grant update on table "public"."geloofsonderrig_lesse" to "anon";

grant delete on table "public"."geloofsonderrig_lesse" to "authenticated";

grant insert on table "public"."geloofsonderrig_lesse" to "authenticated";

grant references on table "public"."geloofsonderrig_lesse" to "authenticated";

grant select on table "public"."geloofsonderrig_lesse" to "authenticated";

grant trigger on table "public"."geloofsonderrig_lesse" to "authenticated";

grant truncate on table "public"."geloofsonderrig_lesse" to "authenticated";

grant update on table "public"."geloofsonderrig_lesse" to "authenticated";

grant delete on table "public"."geloofsonderrig_lesse" to "service_role";

grant insert on table "public"."geloofsonderrig_lesse" to "service_role";

grant references on table "public"."geloofsonderrig_lesse" to "service_role";

grant select on table "public"."geloofsonderrig_lesse" to "service_role";

grant trigger on table "public"."geloofsonderrig_lesse" to "service_role";

grant truncate on table "public"."geloofsonderrig_lesse" to "service_role";

grant update on table "public"."geloofsonderrig_lesse" to "service_role";

grant delete on table "public"."geloofsonderrig_onderwerpe" to "anon";

grant insert on table "public"."geloofsonderrig_onderwerpe" to "anon";

grant references on table "public"."geloofsonderrig_onderwerpe" to "anon";

grant select on table "public"."geloofsonderrig_onderwerpe" to "anon";

grant trigger on table "public"."geloofsonderrig_onderwerpe" to "anon";

grant truncate on table "public"."geloofsonderrig_onderwerpe" to "anon";

grant update on table "public"."geloofsonderrig_onderwerpe" to "anon";

grant delete on table "public"."geloofsonderrig_onderwerpe" to "authenticated";

grant insert on table "public"."geloofsonderrig_onderwerpe" to "authenticated";

grant references on table "public"."geloofsonderrig_onderwerpe" to "authenticated";

grant select on table "public"."geloofsonderrig_onderwerpe" to "authenticated";

grant trigger on table "public"."geloofsonderrig_onderwerpe" to "authenticated";

grant truncate on table "public"."geloofsonderrig_onderwerpe" to "authenticated";

grant update on table "public"."geloofsonderrig_onderwerpe" to "authenticated";

grant delete on table "public"."geloofsonderrig_onderwerpe" to "service_role";

grant insert on table "public"."geloofsonderrig_onderwerpe" to "service_role";

grant references on table "public"."geloofsonderrig_onderwerpe" to "service_role";

grant select on table "public"."geloofsonderrig_onderwerpe" to "service_role";

grant trigger on table "public"."geloofsonderrig_onderwerpe" to "service_role";

grant truncate on table "public"."geloofsonderrig_onderwerpe" to "service_role";

grant update on table "public"."geloofsonderrig_onderwerpe" to "service_role";

grant delete on table "public"."geloofsonderrig_prente" to "anon";

grant insert on table "public"."geloofsonderrig_prente" to "anon";

grant references on table "public"."geloofsonderrig_prente" to "anon";

grant select on table "public"."geloofsonderrig_prente" to "anon";

grant trigger on table "public"."geloofsonderrig_prente" to "anon";

grant truncate on table "public"."geloofsonderrig_prente" to "anon";

grant update on table "public"."geloofsonderrig_prente" to "anon";

grant delete on table "public"."geloofsonderrig_prente" to "authenticated";

grant insert on table "public"."geloofsonderrig_prente" to "authenticated";

grant references on table "public"."geloofsonderrig_prente" to "authenticated";

grant select on table "public"."geloofsonderrig_prente" to "authenticated";

grant trigger on table "public"."geloofsonderrig_prente" to "authenticated";

grant truncate on table "public"."geloofsonderrig_prente" to "authenticated";

grant update on table "public"."geloofsonderrig_prente" to "authenticated";

grant delete on table "public"."geloofsonderrig_prente" to "service_role";

grant insert on table "public"."geloofsonderrig_prente" to "service_role";

grant references on table "public"."geloofsonderrig_prente" to "service_role";

grant select on table "public"."geloofsonderrig_prente" to "service_role";

grant trigger on table "public"."geloofsonderrig_prente" to "service_role";

grant truncate on table "public"."geloofsonderrig_prente" to "service_role";

grant update on table "public"."geloofsonderrig_prente" to "service_role";

grant delete on table "public"."geloofsonderrig_punte" to "anon";

grant insert on table "public"."geloofsonderrig_punte" to "anon";

grant references on table "public"."geloofsonderrig_punte" to "anon";

grant select on table "public"."geloofsonderrig_punte" to "anon";

grant trigger on table "public"."geloofsonderrig_punte" to "anon";

grant truncate on table "public"."geloofsonderrig_punte" to "anon";

grant update on table "public"."geloofsonderrig_punte" to "anon";

grant delete on table "public"."geloofsonderrig_punte" to "authenticated";

grant insert on table "public"."geloofsonderrig_punte" to "authenticated";

grant references on table "public"."geloofsonderrig_punte" to "authenticated";

grant select on table "public"."geloofsonderrig_punte" to "authenticated";

grant trigger on table "public"."geloofsonderrig_punte" to "authenticated";

grant truncate on table "public"."geloofsonderrig_punte" to "authenticated";

grant update on table "public"."geloofsonderrig_punte" to "authenticated";

grant delete on table "public"."geloofsonderrig_punte" to "service_role";

grant insert on table "public"."geloofsonderrig_punte" to "service_role";

grant references on table "public"."geloofsonderrig_punte" to "service_role";

grant select on table "public"."geloofsonderrig_punte" to "service_role";

grant trigger on table "public"."geloofsonderrig_punte" to "service_role";

grant truncate on table "public"."geloofsonderrig_punte" to "service_role";

grant update on table "public"."geloofsonderrig_punte" to "service_role";

grant delete on table "public"."geloofsonderrig_vordering" to "anon";

grant insert on table "public"."geloofsonderrig_vordering" to "anon";

grant references on table "public"."geloofsonderrig_vordering" to "anon";

grant select on table "public"."geloofsonderrig_vordering" to "anon";

grant trigger on table "public"."geloofsonderrig_vordering" to "anon";

grant truncate on table "public"."geloofsonderrig_vordering" to "anon";

grant update on table "public"."geloofsonderrig_vordering" to "anon";

grant delete on table "public"."geloofsonderrig_vordering" to "authenticated";

grant insert on table "public"."geloofsonderrig_vordering" to "authenticated";

grant references on table "public"."geloofsonderrig_vordering" to "authenticated";

grant select on table "public"."geloofsonderrig_vordering" to "authenticated";

grant trigger on table "public"."geloofsonderrig_vordering" to "authenticated";

grant truncate on table "public"."geloofsonderrig_vordering" to "authenticated";

grant update on table "public"."geloofsonderrig_vordering" to "authenticated";

grant delete on table "public"."geloofsonderrig_vordering" to "service_role";

grant insert on table "public"."geloofsonderrig_vordering" to "service_role";

grant references on table "public"."geloofsonderrig_vordering" to "service_role";

grant select on table "public"."geloofsonderrig_vordering" to "service_role";

grant trigger on table "public"."geloofsonderrig_vordering" to "service_role";

grant truncate on table "public"."geloofsonderrig_vordering" to "service_role";

grant update on table "public"."geloofsonderrig_vordering" to "service_role";

grant delete on table "public"."geloofsonderrig_vrae" to "anon";

grant insert on table "public"."geloofsonderrig_vrae" to "anon";

grant references on table "public"."geloofsonderrig_vrae" to "anon";

grant select on table "public"."geloofsonderrig_vrae" to "anon";

grant trigger on table "public"."geloofsonderrig_vrae" to "anon";

grant truncate on table "public"."geloofsonderrig_vrae" to "anon";

grant update on table "public"."geloofsonderrig_vrae" to "anon";

grant delete on table "public"."geloofsonderrig_vrae" to "authenticated";

grant insert on table "public"."geloofsonderrig_vrae" to "authenticated";

grant references on table "public"."geloofsonderrig_vrae" to "authenticated";

grant select on table "public"."geloofsonderrig_vrae" to "authenticated";

grant trigger on table "public"."geloofsonderrig_vrae" to "authenticated";

grant truncate on table "public"."geloofsonderrig_vrae" to "authenticated";

grant update on table "public"."geloofsonderrig_vrae" to "authenticated";

grant delete on table "public"."geloofsonderrig_vrae" to "service_role";

grant insert on table "public"."geloofsonderrig_vrae" to "service_role";

grant references on table "public"."geloofsonderrig_vrae" to "service_role";

grant select on table "public"."geloofsonderrig_vrae" to "service_role";

grant trigger on table "public"."geloofsonderrig_vrae" to "service_role";

grant truncate on table "public"."geloofsonderrig_vrae" to "service_role";

grant update on table "public"."geloofsonderrig_vrae" to "service_role";

grant delete on table "public"."gemeente_program" to "anon";

grant insert on table "public"."gemeente_program" to "anon";

grant references on table "public"."gemeente_program" to "anon";

grant select on table "public"."gemeente_program" to "anon";

grant trigger on table "public"."gemeente_program" to "anon";

grant truncate on table "public"."gemeente_program" to "anon";

grant update on table "public"."gemeente_program" to "anon";

grant delete on table "public"."gemeente_program" to "authenticated";

grant insert on table "public"."gemeente_program" to "authenticated";

grant references on table "public"."gemeente_program" to "authenticated";

grant select on table "public"."gemeente_program" to "authenticated";

grant trigger on table "public"."gemeente_program" to "authenticated";

grant truncate on table "public"."gemeente_program" to "authenticated";

grant update on table "public"."gemeente_program" to "authenticated";

grant delete on table "public"."gemeente_program" to "service_role";

grant insert on table "public"."gemeente_program" to "service_role";

grant references on table "public"."gemeente_program" to "service_role";

grant select on table "public"."gemeente_program" to "service_role";

grant trigger on table "public"."gemeente_program" to "service_role";

grant truncate on table "public"."gemeente_program" to "service_role";

grant update on table "public"."gemeente_program" to "service_role";

grant delete on table "public"."kk_lesson_attempts" to "anon";

grant insert on table "public"."kk_lesson_attempts" to "anon";

grant references on table "public"."kk_lesson_attempts" to "anon";

grant select on table "public"."kk_lesson_attempts" to "anon";

grant trigger on table "public"."kk_lesson_attempts" to "anon";

grant truncate on table "public"."kk_lesson_attempts" to "anon";

grant update on table "public"."kk_lesson_attempts" to "anon";

grant delete on table "public"."kk_lesson_attempts" to "authenticated";

grant insert on table "public"."kk_lesson_attempts" to "authenticated";

grant references on table "public"."kk_lesson_attempts" to "authenticated";

grant select on table "public"."kk_lesson_attempts" to "authenticated";

grant trigger on table "public"."kk_lesson_attempts" to "authenticated";

grant truncate on table "public"."kk_lesson_attempts" to "authenticated";

grant update on table "public"."kk_lesson_attempts" to "authenticated";

grant delete on table "public"."kk_lesson_attempts" to "service_role";

grant insert on table "public"."kk_lesson_attempts" to "service_role";

grant references on table "public"."kk_lesson_attempts" to "service_role";

grant select on table "public"."kk_lesson_attempts" to "service_role";

grant trigger on table "public"."kk_lesson_attempts" to "service_role";

grant truncate on table "public"."kk_lesson_attempts" to "service_role";

grant update on table "public"."kk_lesson_attempts" to "service_role";

grant delete on table "public"."kk_lesson_variants" to "anon";

grant insert on table "public"."kk_lesson_variants" to "anon";

grant references on table "public"."kk_lesson_variants" to "anon";

grant select on table "public"."kk_lesson_variants" to "anon";

grant trigger on table "public"."kk_lesson_variants" to "anon";

grant truncate on table "public"."kk_lesson_variants" to "anon";

grant update on table "public"."kk_lesson_variants" to "anon";

grant delete on table "public"."kk_lesson_variants" to "authenticated";

grant insert on table "public"."kk_lesson_variants" to "authenticated";

grant references on table "public"."kk_lesson_variants" to "authenticated";

grant select on table "public"."kk_lesson_variants" to "authenticated";

grant trigger on table "public"."kk_lesson_variants" to "authenticated";

grant truncate on table "public"."kk_lesson_variants" to "authenticated";

grant update on table "public"."kk_lesson_variants" to "authenticated";

grant delete on table "public"."kk_lesson_variants" to "service_role";

grant insert on table "public"."kk_lesson_variants" to "service_role";

grant references on table "public"."kk_lesson_variants" to "service_role";

grant select on table "public"."kk_lesson_variants" to "service_role";

grant trigger on table "public"."kk_lesson_variants" to "service_role";

grant truncate on table "public"."kk_lesson_variants" to "service_role";

grant update on table "public"."kk_lesson_variants" to "service_role";

grant delete on table "public"."kk_lessons" to "anon";

grant insert on table "public"."kk_lessons" to "anon";

grant references on table "public"."kk_lessons" to "anon";

grant select on table "public"."kk_lessons" to "anon";

grant trigger on table "public"."kk_lessons" to "anon";

grant truncate on table "public"."kk_lessons" to "anon";

grant update on table "public"."kk_lessons" to "anon";

grant delete on table "public"."kk_lessons" to "authenticated";

grant insert on table "public"."kk_lessons" to "authenticated";

grant references on table "public"."kk_lessons" to "authenticated";

grant select on table "public"."kk_lessons" to "authenticated";

grant trigger on table "public"."kk_lessons" to "authenticated";

grant truncate on table "public"."kk_lessons" to "authenticated";

grant update on table "public"."kk_lessons" to "authenticated";

grant delete on table "public"."kk_lessons" to "service_role";

grant insert on table "public"."kk_lessons" to "service_role";

grant references on table "public"."kk_lessons" to "service_role";

grant select on table "public"."kk_lessons" to "service_role";

grant trigger on table "public"."kk_lessons" to "service_role";

grant truncate on table "public"."kk_lessons" to "service_role";

grant update on table "public"."kk_lessons" to "service_role";

grant delete on table "public"."kk_questions" to "anon";

grant insert on table "public"."kk_questions" to "anon";

grant references on table "public"."kk_questions" to "anon";

grant select on table "public"."kk_questions" to "anon";

grant trigger on table "public"."kk_questions" to "anon";

grant truncate on table "public"."kk_questions" to "anon";

grant update on table "public"."kk_questions" to "anon";

grant delete on table "public"."kk_questions" to "authenticated";

grant insert on table "public"."kk_questions" to "authenticated";

grant references on table "public"."kk_questions" to "authenticated";

grant select on table "public"."kk_questions" to "authenticated";

grant trigger on table "public"."kk_questions" to "authenticated";

grant truncate on table "public"."kk_questions" to "authenticated";

grant update on table "public"."kk_questions" to "authenticated";

grant delete on table "public"."kk_questions" to "service_role";

grant insert on table "public"."kk_questions" to "service_role";

grant references on table "public"."kk_questions" to "service_role";

grant select on table "public"."kk_questions" to "service_role";

grant trigger on table "public"."kk_questions" to "service_role";

grant truncate on table "public"."kk_questions" to "service_role";

grant update on table "public"."kk_questions" to "service_role";

grant delete on table "public"."kk_user_progress" to "anon";

grant insert on table "public"."kk_user_progress" to "anon";

grant references on table "public"."kk_user_progress" to "anon";

grant select on table "public"."kk_user_progress" to "anon";

grant trigger on table "public"."kk_user_progress" to "anon";

grant truncate on table "public"."kk_user_progress" to "anon";

grant update on table "public"."kk_user_progress" to "anon";

grant delete on table "public"."kk_user_progress" to "authenticated";

grant insert on table "public"."kk_user_progress" to "authenticated";

grant references on table "public"."kk_user_progress" to "authenticated";

grant select on table "public"."kk_user_progress" to "authenticated";

grant trigger on table "public"."kk_user_progress" to "authenticated";

grant truncate on table "public"."kk_user_progress" to "authenticated";

grant update on table "public"."kk_user_progress" to "authenticated";

grant delete on table "public"."kk_user_progress" to "service_role";

grant insert on table "public"."kk_user_progress" to "service_role";

grant references on table "public"."kk_user_progress" to "service_role";

grant select on table "public"."kk_user_progress" to "service_role";

grant trigger on table "public"."kk_user_progress" to "service_role";

grant truncate on table "public"."kk_user_progress" to "service_role";

grant update on table "public"."kk_user_progress" to "service_role";

grant delete on table "public"."krisis_verslae" to "anon";

grant insert on table "public"."krisis_verslae" to "anon";

grant references on table "public"."krisis_verslae" to "anon";

grant select on table "public"."krisis_verslae" to "anon";

grant trigger on table "public"."krisis_verslae" to "anon";

grant truncate on table "public"."krisis_verslae" to "anon";

grant update on table "public"."krisis_verslae" to "anon";

grant delete on table "public"."krisis_verslae" to "authenticated";

grant insert on table "public"."krisis_verslae" to "authenticated";

grant references on table "public"."krisis_verslae" to "authenticated";

grant select on table "public"."krisis_verslae" to "authenticated";

grant trigger on table "public"."krisis_verslae" to "authenticated";

grant truncate on table "public"."krisis_verslae" to "authenticated";

grant update on table "public"."krisis_verslae" to "authenticated";

grant delete on table "public"."krisis_verslae" to "service_role";

grant insert on table "public"."krisis_verslae" to "service_role";

grant references on table "public"."krisis_verslae" to "service_role";

grant select on table "public"."krisis_verslae" to "service_role";

grant trigger on table "public"."krisis_verslae" to "service_role";

grant truncate on table "public"."krisis_verslae" to "service_role";

grant update on table "public"."krisis_verslae" to "service_role";

grant delete on table "public"."lidmaat_verhoudings" to "anon";

grant insert on table "public"."lidmaat_verhoudings" to "anon";

grant references on table "public"."lidmaat_verhoudings" to "anon";

grant select on table "public"."lidmaat_verhoudings" to "anon";

grant trigger on table "public"."lidmaat_verhoudings" to "anon";

grant truncate on table "public"."lidmaat_verhoudings" to "anon";

grant update on table "public"."lidmaat_verhoudings" to "anon";

grant delete on table "public"."lidmaat_verhoudings" to "authenticated";

grant insert on table "public"."lidmaat_verhoudings" to "authenticated";

grant references on table "public"."lidmaat_verhoudings" to "authenticated";

grant select on table "public"."lidmaat_verhoudings" to "authenticated";

grant trigger on table "public"."lidmaat_verhoudings" to "authenticated";

grant truncate on table "public"."lidmaat_verhoudings" to "authenticated";

grant update on table "public"."lidmaat_verhoudings" to "authenticated";

grant delete on table "public"."lidmaat_verhoudings" to "service_role";

grant insert on table "public"."lidmaat_verhoudings" to "service_role";

grant references on table "public"."lidmaat_verhoudings" to "service_role";

grant select on table "public"."lidmaat_verhoudings" to "service_role";

grant trigger on table "public"."lidmaat_verhoudings" to "service_role";

grant truncate on table "public"."lidmaat_verhoudings" to "service_role";

grant update on table "public"."lidmaat_verhoudings" to "service_role";

grant delete on table "public"."lms_kursusse" to "anon";

grant insert on table "public"."lms_kursusse" to "anon";

grant references on table "public"."lms_kursusse" to "anon";

grant select on table "public"."lms_kursusse" to "anon";

grant trigger on table "public"."lms_kursusse" to "anon";

grant truncate on table "public"."lms_kursusse" to "anon";

grant update on table "public"."lms_kursusse" to "anon";

grant delete on table "public"."lms_kursusse" to "authenticated";

grant insert on table "public"."lms_kursusse" to "authenticated";

grant references on table "public"."lms_kursusse" to "authenticated";

grant select on table "public"."lms_kursusse" to "authenticated";

grant trigger on table "public"."lms_kursusse" to "authenticated";

grant truncate on table "public"."lms_kursusse" to "authenticated";

grant update on table "public"."lms_kursusse" to "authenticated";

grant delete on table "public"."lms_kursusse" to "service_role";

grant insert on table "public"."lms_kursusse" to "service_role";

grant references on table "public"."lms_kursusse" to "service_role";

grant select on table "public"."lms_kursusse" to "service_role";

grant trigger on table "public"."lms_kursusse" to "service_role";

grant truncate on table "public"."lms_kursusse" to "service_role";

grant update on table "public"."lms_kursusse" to "service_role";

grant delete on table "public"."lms_lesse" to "anon";

grant insert on table "public"."lms_lesse" to "anon";

grant references on table "public"."lms_lesse" to "anon";

grant select on table "public"."lms_lesse" to "anon";

grant trigger on table "public"."lms_lesse" to "anon";

grant truncate on table "public"."lms_lesse" to "anon";

grant update on table "public"."lms_lesse" to "anon";

grant delete on table "public"."lms_lesse" to "authenticated";

grant insert on table "public"."lms_lesse" to "authenticated";

grant references on table "public"."lms_lesse" to "authenticated";

grant select on table "public"."lms_lesse" to "authenticated";

grant trigger on table "public"."lms_lesse" to "authenticated";

grant truncate on table "public"."lms_lesse" to "authenticated";

grant update on table "public"."lms_lesse" to "authenticated";

grant delete on table "public"."lms_lesse" to "service_role";

grant insert on table "public"."lms_lesse" to "service_role";

grant references on table "public"."lms_lesse" to "service_role";

grant select on table "public"."lms_lesse" to "service_role";

grant trigger on table "public"."lms_lesse" to "service_role";

grant truncate on table "public"."lms_lesse" to "service_role";

grant update on table "public"."lms_lesse" to "service_role";

grant delete on table "public"."lms_modules" to "anon";

grant insert on table "public"."lms_modules" to "anon";

grant references on table "public"."lms_modules" to "anon";

grant select on table "public"."lms_modules" to "anon";

grant trigger on table "public"."lms_modules" to "anon";

grant truncate on table "public"."lms_modules" to "anon";

grant update on table "public"."lms_modules" to "anon";

grant delete on table "public"."lms_modules" to "authenticated";

grant insert on table "public"."lms_modules" to "authenticated";

grant references on table "public"."lms_modules" to "authenticated";

grant select on table "public"."lms_modules" to "authenticated";

grant trigger on table "public"."lms_modules" to "authenticated";

grant truncate on table "public"."lms_modules" to "authenticated";

grant update on table "public"."lms_modules" to "authenticated";

grant delete on table "public"."lms_modules" to "service_role";

grant insert on table "public"."lms_modules" to "service_role";

grant references on table "public"."lms_modules" to "service_role";

grant select on table "public"."lms_modules" to "service_role";

grant trigger on table "public"."lms_modules" to "service_role";

grant truncate on table "public"."lms_modules" to "service_role";

grant update on table "public"."lms_modules" to "service_role";

grant delete on table "public"."lms_questions" to "anon";

grant insert on table "public"."lms_questions" to "anon";

grant references on table "public"."lms_questions" to "anon";

grant select on table "public"."lms_questions" to "anon";

grant trigger on table "public"."lms_questions" to "anon";

grant truncate on table "public"."lms_questions" to "anon";

grant update on table "public"."lms_questions" to "anon";

grant delete on table "public"."lms_questions" to "authenticated";

grant insert on table "public"."lms_questions" to "authenticated";

grant references on table "public"."lms_questions" to "authenticated";

grant select on table "public"."lms_questions" to "authenticated";

grant trigger on table "public"."lms_questions" to "authenticated";

grant truncate on table "public"."lms_questions" to "authenticated";

grant update on table "public"."lms_questions" to "authenticated";

grant delete on table "public"."lms_questions" to "service_role";

grant insert on table "public"."lms_questions" to "service_role";

grant references on table "public"."lms_questions" to "service_role";

grant select on table "public"."lms_questions" to "service_role";

grant trigger on table "public"."lms_questions" to "service_role";

grant truncate on table "public"."lms_questions" to "service_role";

grant update on table "public"."lms_questions" to "service_role";

grant delete on table "public"."lms_quiz_attempts" to "anon";

grant insert on table "public"."lms_quiz_attempts" to "anon";

grant references on table "public"."lms_quiz_attempts" to "anon";

grant select on table "public"."lms_quiz_attempts" to "anon";

grant trigger on table "public"."lms_quiz_attempts" to "anon";

grant truncate on table "public"."lms_quiz_attempts" to "anon";

grant update on table "public"."lms_quiz_attempts" to "anon";

grant delete on table "public"."lms_quiz_attempts" to "authenticated";

grant insert on table "public"."lms_quiz_attempts" to "authenticated";

grant references on table "public"."lms_quiz_attempts" to "authenticated";

grant select on table "public"."lms_quiz_attempts" to "authenticated";

grant trigger on table "public"."lms_quiz_attempts" to "authenticated";

grant truncate on table "public"."lms_quiz_attempts" to "authenticated";

grant update on table "public"."lms_quiz_attempts" to "authenticated";

grant delete on table "public"."lms_quiz_attempts" to "service_role";

grant insert on table "public"."lms_quiz_attempts" to "service_role";

grant references on table "public"."lms_quiz_attempts" to "service_role";

grant select on table "public"."lms_quiz_attempts" to "service_role";

grant trigger on table "public"."lms_quiz_attempts" to "service_role";

grant truncate on table "public"."lms_quiz_attempts" to "service_role";

grant update on table "public"."lms_quiz_attempts" to "service_role";

grant delete on table "public"."lms_registrasies" to "anon";

grant insert on table "public"."lms_registrasies" to "anon";

grant references on table "public"."lms_registrasies" to "anon";

grant select on table "public"."lms_registrasies" to "anon";

grant trigger on table "public"."lms_registrasies" to "anon";

grant truncate on table "public"."lms_registrasies" to "anon";

grant update on table "public"."lms_registrasies" to "anon";

grant delete on table "public"."lms_registrasies" to "authenticated";

grant insert on table "public"."lms_registrasies" to "authenticated";

grant references on table "public"."lms_registrasies" to "authenticated";

grant select on table "public"."lms_registrasies" to "authenticated";

grant trigger on table "public"."lms_registrasies" to "authenticated";

grant truncate on table "public"."lms_registrasies" to "authenticated";

grant update on table "public"."lms_registrasies" to "authenticated";

grant delete on table "public"."lms_registrasies" to "service_role";

grant insert on table "public"."lms_registrasies" to "service_role";

grant references on table "public"."lms_registrasies" to "service_role";

grant select on table "public"."lms_registrasies" to "service_role";

grant trigger on table "public"."lms_registrasies" to "service_role";

grant truncate on table "public"."lms_registrasies" to "service_role";

grant update on table "public"."lms_registrasies" to "service_role";

grant delete on table "public"."lms_vordering" to "anon";

grant insert on table "public"."lms_vordering" to "anon";

grant references on table "public"."lms_vordering" to "anon";

grant select on table "public"."lms_vordering" to "anon";

grant trigger on table "public"."lms_vordering" to "anon";

grant truncate on table "public"."lms_vordering" to "anon";

grant update on table "public"."lms_vordering" to "anon";

grant delete on table "public"."lms_vordering" to "authenticated";

grant insert on table "public"."lms_vordering" to "authenticated";

grant references on table "public"."lms_vordering" to "authenticated";

grant select on table "public"."lms_vordering" to "authenticated";

grant trigger on table "public"."lms_vordering" to "authenticated";

grant truncate on table "public"."lms_vordering" to "authenticated";

grant update on table "public"."lms_vordering" to "authenticated";

grant delete on table "public"."lms_vordering" to "service_role";

grant insert on table "public"."lms_vordering" to "service_role";

grant references on table "public"."lms_vordering" to "service_role";

grant select on table "public"."lms_vordering" to "service_role";

grant trigger on table "public"."lms_vordering" to "service_role";

grant truncate on table "public"."lms_vordering" to "service_role";

grant update on table "public"."lms_vordering" to "service_role";

grant delete on table "public"."pastorale_aksies" to "anon";

grant insert on table "public"."pastorale_aksies" to "anon";

grant references on table "public"."pastorale_aksies" to "anon";

grant select on table "public"."pastorale_aksies" to "anon";

grant trigger on table "public"."pastorale_aksies" to "anon";

grant truncate on table "public"."pastorale_aksies" to "anon";

grant update on table "public"."pastorale_aksies" to "anon";

grant delete on table "public"."pastorale_aksies" to "authenticated";

grant insert on table "public"."pastorale_aksies" to "authenticated";

grant references on table "public"."pastorale_aksies" to "authenticated";

grant select on table "public"."pastorale_aksies" to "authenticated";

grant trigger on table "public"."pastorale_aksies" to "authenticated";

grant truncate on table "public"."pastorale_aksies" to "authenticated";

grant update on table "public"."pastorale_aksies" to "authenticated";

grant delete on table "public"."pastorale_aksies" to "service_role";

grant insert on table "public"."pastorale_aksies" to "service_role";

grant references on table "public"."pastorale_aksies" to "service_role";

grant select on table "public"."pastorale_aksies" to "service_role";

grant trigger on table "public"."pastorale_aksies" to "service_role";

grant truncate on table "public"."pastorale_aksies" to "service_role";

grant update on table "public"."pastorale_aksies" to "service_role";

grant delete on table "public"."vbo_aktiwiteite" to "anon";

grant insert on table "public"."vbo_aktiwiteite" to "anon";

grant references on table "public"."vbo_aktiwiteite" to "anon";

grant select on table "public"."vbo_aktiwiteite" to "anon";

grant trigger on table "public"."vbo_aktiwiteite" to "anon";

grant truncate on table "public"."vbo_aktiwiteite" to "anon";

grant update on table "public"."vbo_aktiwiteite" to "anon";

grant delete on table "public"."vbo_aktiwiteite" to "authenticated";

grant insert on table "public"."vbo_aktiwiteite" to "authenticated";

grant references on table "public"."vbo_aktiwiteite" to "authenticated";

grant select on table "public"."vbo_aktiwiteite" to "authenticated";

grant trigger on table "public"."vbo_aktiwiteite" to "authenticated";

grant truncate on table "public"."vbo_aktiwiteite" to "authenticated";

grant update on table "public"."vbo_aktiwiteite" to "authenticated";

grant delete on table "public"."vbo_aktiwiteite" to "service_role";

grant insert on table "public"."vbo_aktiwiteite" to "service_role";

grant references on table "public"."vbo_aktiwiteite" to "service_role";

grant select on table "public"."vbo_aktiwiteite" to "service_role";

grant trigger on table "public"."vbo_aktiwiteite" to "service_role";

grant truncate on table "public"."vbo_aktiwiteite" to "service_role";

grant update on table "public"."vbo_aktiwiteite" to "service_role";

grant delete on table "public"."vbo_punte" to "anon";

grant insert on table "public"."vbo_punte" to "anon";

grant references on table "public"."vbo_punte" to "anon";

grant select on table "public"."vbo_punte" to "anon";

grant trigger on table "public"."vbo_punte" to "anon";

grant truncate on table "public"."vbo_punte" to "anon";

grant update on table "public"."vbo_punte" to "anon";

grant delete on table "public"."vbo_punte" to "authenticated";

grant insert on table "public"."vbo_punte" to "authenticated";

grant references on table "public"."vbo_punte" to "authenticated";

grant select on table "public"."vbo_punte" to "authenticated";

grant trigger on table "public"."vbo_punte" to "authenticated";

grant truncate on table "public"."vbo_punte" to "authenticated";

grant update on table "public"."vbo_punte" to "authenticated";

grant delete on table "public"."vbo_punte" to "service_role";

grant insert on table "public"."vbo_punte" to "service_role";

grant references on table "public"."vbo_punte" to "service_role";

grant select on table "public"."vbo_punte" to "service_role";

grant trigger on table "public"."vbo_punte" to "service_role";

grant truncate on table "public"."vbo_punte" to "service_role";

grant update on table "public"."vbo_punte" to "service_role";

grant delete on table "public"."vrae" to "anon";

grant insert on table "public"."vrae" to "anon";

grant references on table "public"."vrae" to "anon";

grant select on table "public"."vrae" to "anon";

grant trigger on table "public"."vrae" to "anon";

grant truncate on table "public"."vrae" to "anon";

grant update on table "public"."vrae" to "anon";

grant delete on table "public"."vrae" to "authenticated";

grant insert on table "public"."vrae" to "authenticated";

grant references on table "public"."vrae" to "authenticated";

grant select on table "public"."vrae" to "authenticated";

grant trigger on table "public"."vrae" to "authenticated";

grant truncate on table "public"."vrae" to "authenticated";

grant update on table "public"."vrae" to "authenticated";

grant delete on table "public"."vrae" to "service_role";

grant insert on table "public"."vrae" to "service_role";

grant references on table "public"."vrae" to "service_role";

grant select on table "public"."vrae" to "service_role";

grant trigger on table "public"."vrae" to "service_role";

grant truncate on table "public"."vrae" to "service_role";

grant update on table "public"."vrae" to "service_role";

grant delete on table "public"."wyke" to "anon";

grant insert on table "public"."wyke" to "anon";

grant references on table "public"."wyke" to "anon";

grant select on table "public"."wyke" to "anon";

grant trigger on table "public"."wyke" to "anon";

grant truncate on table "public"."wyke" to "anon";

grant update on table "public"."wyke" to "anon";

grant delete on table "public"."wyke" to "authenticated";

grant insert on table "public"."wyke" to "authenticated";

grant references on table "public"."wyke" to "authenticated";

grant select on table "public"."wyke" to "authenticated";

grant trigger on table "public"."wyke" to "authenticated";

grant truncate on table "public"."wyke" to "authenticated";

grant update on table "public"."wyke" to "authenticated";

grant delete on table "public"."wyke" to "service_role";

grant insert on table "public"."wyke" to "service_role";

grant references on table "public"."wyke" to "service_role";

grant select on table "public"."wyke" to "service_role";

grant trigger on table "public"."wyke" to "service_role";

grant truncate on table "public"."wyke" to "service_role";

grant update on table "public"."wyke" to "service_role";


  create policy "Allow public insert"
  on "public"."artikels_indienings"
  as permissive
  for insert
  to public
with check (true);



  create policy "Allow public select"
  on "public"."artikels_indienings"
  as permissive
  for select
  to public
using (true);



  create policy "Allow all for admins types"
  on "public"."artikels_tipes"
  as permissive
  for all
  to public
using (true);



  create policy "Allow public read types"
  on "public"."artikels_tipes"
  as permissive
  for select
  to public
using (true);



  create policy "Allow All"
  on "public"."besoekpunte"
  as permissive
  for all
  to public
using (true);



  create policy "Admin Manage Payments"
  on "public"."betalings"
  as permissive
  for all
  to public
using (true);



  create policy "Allow All"
  on "public"."betalings"
  as permissive
  for all
  to public
using (true);



  create policy "Users Read Own Payments"
  on "public"."betalings"
  as permissive
  for select
  to public
using ((auth.uid() = gebruiker_id));



  create policy "Allow All Ontvangers"
  on "public"."boodskap_ontvangers"
  as permissive
  for all
  to public
using (true);



  create policy "Allow All Boodskappe"
  on "public"."boodskappe"
  as permissive
  for all
  to public
using (true);



  create policy "Allow All Dagstukkies"
  on "public"."dagstukkies"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all dagstukkies"
  on "public"."dagstukkies"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all access to categories"
  on "public"."dokument_kategoriee"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all access to documents"
  on "public"."dokumente"
  as permissive
  for all
  to public
using (true);



  create policy "Allow All Erediens"
  on "public"."erediens_info"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all erediens"
  on "public"."eredienste"
  as permissive
  for all
  to public
using (true);



  create policy "Allow All"
  on "public"."gebruikers"
  as permissive
  for all
  to public
using (true);



  create policy "Read Own User Data"
  on "public"."gebruikers"
  as permissive
  for select
  to public
using ((id = auth.uid()));



  create policy "Learners Read Own Logs"
  on "public"."geloofsonderrig_ai_logs"
  as permissive
  for select
  to public
using ((auth.uid() = leerder_id));



  create policy "Mentors Read All Logs"
  on "public"."geloofsonderrig_ai_logs"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.gebruikers
  WHERE ((gebruikers.id = auth.uid()) AND (gebruikers.rol = ANY (ARRAY['hoof_admin'::text, 'subadmin'::text, 'admin'::text, 'predikant'::text, 'moderator'::text, 'geloofsonderrig_admin'::text]))))));



  create policy "Mentors see class logs"
  on "public"."geloofsonderrig_ai_logs"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM (public.geloofsonderrig_klas_leerders kl
     JOIN public.geloofsonderrig_klasse k ON ((k.id = kl.klas_id)))
  WHERE ((kl.leerder_id = geloofsonderrig_ai_logs.leerder_id) AND ((k.mentor_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.gebruikers
          WHERE ((gebruikers.id = auth.uid()) AND (gebruikers.rol = ANY (ARRAY['hoof_admin'::text, 'admin'::text, 'geloofsonderrig_admin'::text]))))))))));



  create policy "Service Role Full Access"
  on "public"."geloofsonderrig_ai_logs"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Users see own logs"
  on "public"."geloofsonderrig_ai_logs"
  as permissive
  for select
  to public
using ((auth.uid() = leerder_id));



  create policy "Allow All"
  on "public"."geloofsonderrig_files"
  as permissive
  for all
  to public
using (true);



  create policy "Admin Manage Grades"
  on "public"."geloofsonderrig_grade"
  as permissive
  for all
  to public
using (true);



  create policy "Public Read Grades"
  on "public"."geloofsonderrig_grade"
  as permissive
  for select
  to public
using (true);



  create policy "Manage Class Members"
  on "public"."geloofsonderrig_klas_leerders"
  as permissive
  for all
  to public
using (true);



  create policy "Public Read Class Members"
  on "public"."geloofsonderrig_klas_leerders"
  as permissive
  for select
  to public
using (true);



  create policy "Mentors Manage Classes"
  on "public"."geloofsonderrig_klasse"
  as permissive
  for all
  to public
using (true);



  create policy "Public Read Classes"
  on "public"."geloofsonderrig_klasse"
  as permissive
  for select
  to public
using (true);



  create policy "Admin Manage Lessons"
  on "public"."geloofsonderrig_lesse"
  as permissive
  for all
  to public
using (true);



  create policy "Public Read Lessons"
  on "public"."geloofsonderrig_lesse"
  as permissive
  for select
  to public
using (true);



  create policy "Admin Manage Topics"
  on "public"."geloofsonderrig_onderwerpe"
  as permissive
  for all
  to public
using (true);



  create policy "Public Read Topics"
  on "public"."geloofsonderrig_onderwerpe"
  as permissive
  for select
  to public
using (true);



  create policy "Users Manage Own Images"
  on "public"."geloofsonderrig_prente"
  as permissive
  for all
  to public
using ((auth.uid() = leerder_id));



  create policy "Mentors see class punte"
  on "public"."geloofsonderrig_punte"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM (public.geloofsonderrig_klas_leerders kl
     JOIN public.geloofsonderrig_klasse k ON ((k.id = kl.klas_id)))
  WHERE ((kl.leerder_id = geloofsonderrig_punte.leerder_id) AND ((k.mentor_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.gebruikers
          WHERE ((gebruikers.id = auth.uid()) AND (gebruikers.rol = ANY (ARRAY['hoof_admin'::text, 'admin'::text, 'geloofsonderrig_admin'::text]))))))))));



  create policy "Users insert own punte"
  on "public"."geloofsonderrig_punte"
  as permissive
  for insert
  to public
with check ((auth.uid() = leerder_id));



  create policy "Users see own punte"
  on "public"."geloofsonderrig_punte"
  as permissive
  for select
  to public
using ((auth.uid() = leerder_id));



  create policy "Mentors see class progress"
  on "public"."geloofsonderrig_vordering"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM (public.geloofsonderrig_klas_leerders kl
     JOIN public.geloofsonderrig_klasse k ON ((k.id = kl.klas_id)))
  WHERE ((kl.leerder_id = geloofsonderrig_vordering.leerder_id) AND ((k.mentor_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.gebruikers
          WHERE ((gebruikers.id = auth.uid()) AND (gebruikers.rol = ANY (ARRAY['hoof_admin'::text, 'admin'::text, 'geloofsonderrig_admin'::text]))))))))));



  create policy "Users See Own Progress"
  on "public"."geloofsonderrig_vordering"
  as permissive
  for select
  to public
using ((auth.uid() = leerder_id));



  create policy "Users Update Own Progress"
  on "public"."geloofsonderrig_vordering"
  as permissive
  for all
  to public
using ((auth.uid() = leerder_id));



  create policy "Users see own progress"
  on "public"."geloofsonderrig_vordering"
  as permissive
  for select
  to public
using ((auth.uid() = leerder_id));



  create policy "Users update own progress"
  on "public"."geloofsonderrig_vordering"
  as permissive
  for all
  to public
using ((auth.uid() = leerder_id))
with check ((auth.uid() = leerder_id));



  create policy "Admin Manage Questions"
  on "public"."geloofsonderrig_vrae"
  as permissive
  for all
  to public
using (true);



  create policy "Public Read Questions"
  on "public"."geloofsonderrig_vrae"
  as permissive
  for select
  to public
using (true);



  create policy "Admin Manage Program"
  on "public"."gemeente_program"
  as permissive
  for all
  to public
using (true);



  create policy "Allow All"
  on "public"."gemeente_program"
  as permissive
  for all
  to public
using (true);



  create policy "Public Read Program"
  on "public"."gemeente_program"
  as permissive
  for select
  to public
using (true);



  create policy "Allow All"
  on "public"."gemeentes"
  as permissive
  for all
  to public
using (true);



  create policy "User Own Children"
  on "public"."jy_is_myne_children"
  as permissive
  for all
  to public
using (true);



  create policy "User Own Journal"
  on "public"."jy_is_myne_journal"
  as permissive
  for all
  to public
using (true);



  create policy "Admin Write Phase Content"
  on "public"."jy_is_myne_phase_content"
  as permissive
  for all
  to public
using (true);



  create policy "Public Read Phase Content"
  on "public"."jy_is_myne_phase_content"
  as permissive
  for select
  to public
using (true);



  create policy "Admin Write Toolkit"
  on "public"."jy_is_myne_toolkit"
  as permissive
  for all
  to public
using (true);



  create policy "Public Read Toolkit"
  on "public"."jy_is_myne_toolkit"
  as permissive
  for select
  to public
using (true);



  create policy "User Own KK Attempts"
  on "public"."kk_lesson_attempts"
  as permissive
  for all
  to public
using (true);



  create policy "Admin Write Variants"
  on "public"."kk_lesson_variants"
  as permissive
  for all
  to public
using (true);



  create policy "Read Options KK"
  on "public"."kk_lesson_variants"
  as permissive
  for select
  to public
using (true);



  create policy "Admin All KK"
  on "public"."kk_lessons"
  as permissive
  for all
  to public
using (true);



  create policy "Public Read KK"
  on "public"."kk_lessons"
  as permissive
  for select
  to public
using (true);



  create policy "Admin Write Questions"
  on "public"."kk_questions"
  as permissive
  for all
  to public
using (true);



  create policy "Read Questions KK"
  on "public"."kk_questions"
  as permissive
  for select
  to public
using (true);



  create policy "User Own KK Progress"
  on "public"."kk_user_progress"
  as permissive
  for all
  to public
using (true);



  create policy "Admin View Krisis"
  on "public"."krisis_verslae"
  as permissive
  for all
  to public
using (true);



  create policy "Allow All"
  on "public"."krisis_verslae"
  as permissive
  for all
  to public
using (true);



  create policy "Users Create Krisis"
  on "public"."krisis_verslae"
  as permissive
  for insert
  to public
with check ((auth.uid() = ingedien_deur));



  create policy "Admin Manage Relationships"
  on "public"."lidmaat_verhoudings"
  as permissive
  for all
  to public
using (true);



  create policy "Allow All"
  on "public"."lidmaat_verhoudings"
  as permissive
  for all
  to public
using (true);



  create policy "Public Read Relationships"
  on "public"."lidmaat_verhoudings"
  as permissive
  for select
  to public
using (true);



  create policy "Admin All Kursusse"
  on "public"."lms_kursusse"
  as permissive
  for all
  to public
using (true);



  create policy "Public Read Kursusse"
  on "public"."lms_kursusse"
  as permissive
  for select
  to public
using (true);



  create policy "Admin All Lesse"
  on "public"."lms_lesse"
  as permissive
  for all
  to public
using (true);



  create policy "Read Lesse"
  on "public"."lms_lesse"
  as permissive
  for select
  to public
using (true);



  create policy "Admin All Modules"
  on "public"."lms_modules"
  as permissive
  for all
  to public
using (true);



  create policy "Read Modules"
  on "public"."lms_modules"
  as permissive
  for select
  to public
using (true);



  create policy "Admin Write LMS Questions"
  on "public"."lms_questions"
  as permissive
  for all
  to public
using (true);



  create policy "Read LMS Questions"
  on "public"."lms_questions"
  as permissive
  for select
  to public
using (true);



  create policy "User Own Quiz Attempts"
  on "public"."lms_quiz_attempts"
  as permissive
  for all
  to public
using (true);



  create policy "Admin All Registrasies"
  on "public"."lms_registrasies"
  as permissive
  for select
  to public
using (true);



  create policy "User Own Registrasies"
  on "public"."lms_registrasies"
  as permissive
  for all
  to public
using (true);



  create policy "User Own Vordering"
  on "public"."lms_vordering"
  as permissive
  for all
  to public
using (true);



  create policy "Admin Manage Actions"
  on "public"."pastorale_aksies"
  as permissive
  for all
  to public
using (true);



  create policy "Allow All"
  on "public"."pastorale_aksies"
  as permissive
  for all
  to public
using (true);



  create policy "Involved Users Read Actions"
  on "public"."pastorale_aksies"
  as permissive
  for select
  to public
using (((auth.uid() = gebruiker_id) OR (auth.uid() = leier_id)));



  create policy "Allow all vbo_aktiwiteite"
  on "public"."vbo_aktiwiteite"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Allow all vbo"
  on "public"."vbo_punte"
  as permissive
  for all
  to public
using (true);



  create policy "Admin Manage Vrae"
  on "public"."vrae"
  as permissive
  for all
  to public
using (true);



  create policy "Allow All"
  on "public"."vrae"
  as permissive
  for all
  to public
using (true);



  create policy "Public Read Vrae"
  on "public"."vrae"
  as permissive
  for select
  to public
using (true);



  create policy "Users Create Vrae"
  on "public"."vrae"
  as permissive
  for insert
  to public
with check ((auth.uid() = gebruiker_id));



  create policy "Allow All"
  on "public"."wyke"
  as permissive
  for all
  to public
using (true);


CREATE TRIGGER trigger_update_gemeente_on_inventory AFTER INSERT OR UPDATE ON public.congregation_inventory FOR EACH ROW EXECUTE FUNCTION public.update_gemeente_last_data_update();

CREATE TRIGGER trigger_update_gemeente_on_statistics AFTER INSERT OR UPDATE ON public.congregation_statistics FOR EACH ROW EXECUTE FUNCTION public.update_gemeente_last_data_update();


  create policy "allow_all_update"
  on "storage"."objects"
  as permissive
  for update
  to public
using (true);



  create policy "allow_all_upload"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (true);



  create policy "allow_public_read"
  on "storage"."objects"
  as permissive
  for select
  to public
using (true);


CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


