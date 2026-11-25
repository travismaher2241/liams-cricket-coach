CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"key" text NOT NULL,
	"title" text NOT NULL,
	"detail" text NOT NULL,
	"category" text NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"seen" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"drill_id" text NOT NULL,
	"programme_id" integer,
	"minutes" integer NOT NULL,
	"difficulty" integer,
	"enjoyment" integer,
	"confidence" integer,
	"again" boolean,
	"discomfort" boolean DEFAULT false NOT NULL,
	"result" real,
	"is_challenge" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"location" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "match_preps" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"event_id" integer,
	"feeling" text,
	"focus" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"match_date" date NOT NULL,
	"team" text,
	"opposition" text,
	"competition" text,
	"season" text,
	"format" text,
	"result" text,
	"batted" boolean DEFAULT false NOT NULL,
	"runs" integer,
	"balls" integer,
	"fours" integer,
	"sixes" integer,
	"batting_status" text,
	"how_out" text,
	"bowled" boolean DEFAULT false NOT NULL,
	"balls_bowled" integer,
	"runs_conceded" integer,
	"wickets" integer,
	"maidens" integer,
	"wides" integer,
	"no_balls" integer,
	"catches" integer,
	"run_outs" integer,
	"stumpings" integer,
	"is_historical" boolean DEFAULT false NOT NULL,
	"edited_by_parent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"kind" text NOT NULL,
	"area" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"parent_id" integer NOT NULL,
	"display_name" text NOT NULL,
	"birth_year" integer,
	"batting_hand" text,
	"bowling_style" text,
	"team" text,
	"competition" text,
	"parent_overview" text,
	"priorities" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"equipment" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"spaces" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"safety_notes" text,
	"player_answers" jsonb,
	"player_onboarded" boolean DEFAULT false NOT NULL,
	"quiz_level" integer DEFAULT 1 NOT NULL,
	"season" text,
	"season_phase" text DEFAULT 'in' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programmes" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"template_key" text NOT NULL,
	"title" text NOT NULL,
	"purpose" text NOT NULL,
	"focus_tags" jsonb NOT NULL,
	"target_sessions" integer NOT NULL,
	"planned_weeks" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"parent_notes" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"revealed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quiz_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"question_id" text NOT NULL,
	"concept_id" text NOT NULL,
	"correct" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"kind" text NOT NULL,
	"week_key" text,
	"level" integer NOT NULL,
	"score" integer NOT NULL,
	"total" integer NOT NULL,
	"level_up" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reflections" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"answers" jsonb NOT NULL,
	"worries" jsonb,
	"wins" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"password_hash" text,
	"pin_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_preps" ADD CONSTRAINT "match_preps_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "achievements_player_key" ON "achievements" USING btree ("player_id","key");--> statement-breakpoint
CREATE INDEX "activities_player_idx" ON "activities" USING btree ("player_id","completed_at");