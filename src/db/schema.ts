import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  real,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/** Login accounts. One family = one parent + one player for now. */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  role: text("role", { enum: ["parent", "player"] }).notNull(),
  name: text("name").notNull(),
  /** Parents log in with email + password. */
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  /** Players log in by tapping their name and entering a 4-digit PIN. */
  pinHash: text("pin_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** The cricketer. Everything else hangs off this. */
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  parentId: integer("parent_id").notNull().references(() => users.id),
  displayName: text("display_name").notNull(),
  birthYear: integer("birth_year"),
  battingHand: text("batting_hand"),
  bowlingStyle: text("bowling_style"),
  team: text("team"),
  competition: text("competition"),
  /** Parent's free-text overview from onboarding. PARENT ONLY. */
  parentOverview: text("parent_overview"),
  /** Development areas the parent wants weighted (e.g. {"batting": 3}). PARENT ONLY. */
  priorities: jsonb("priorities").$type<Record<string, number>>().default({}).notNull(),
  equipment: jsonb("equipment").$type<string[]>().default([]).notNull(),
  spaces: jsonb("spaces").$type<string[]>().default([]).notNull(),
  /** Safety limits set by the parent, e.g. "no hard ball without an adult". */
  safetyNotes: text("safety_notes"),
  /** Liam's own onboarding answers (favourite player, shot, etc.). */
  playerAnswers: jsonb("player_answers").$type<Record<string, string>>(),
  playerOnboarded: boolean("player_onboarded").default(false).notNull(),
  quizLevel: integer("quiz_level").default(1).notNull(),
  season: text("season"),
  seasonPhase: text("season_phase", { enum: ["pre", "in", "off"] }).default("in").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Private parent notes. Never rendered or summarised on player pages. */
export const observations = pgTable("observations", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id),
  kind: text("kind", { enum: ["observation", "coach_feedback", "history", "circumstance"] }).notNull(),
  /** Development area tag used for personalisation (batting, bowling, ...). */
  area: text("area"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Hidden long-term development programmes. */
export const programmes = pgTable("programmes", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id),
  templateKey: text("template_key").notNull(),
  title: text("title").notNull(),
  purpose: text("purpose").notNull(),
  focusTags: jsonb("focus_tags").$type<string[]>().notNull(),
  targetSessions: integer("target_sessions").notNull(),
  plannedWeeks: integer("planned_weeks").notNull(),
  status: text("status", { enum: ["active", "paused", "completed"] }).default("active").notNull(),
  parentNotes: text("parent_notes"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  /** Set when Liam has seen the completion reveal. */
  revealedAt: timestamp("revealed_at", { withTimezone: true }),
});

/** Every completed drill / quick session. */
export const activities = pgTable(
  "activities",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id").notNull().references(() => players.id),
    drillId: text("drill_id").notNull(),
    programmeId: integer("programme_id").references(() => programmes.id),
    minutes: integer("minutes").notNull(),
    difficulty: integer("difficulty"), // 1 easy .. 3 hard
    enjoyment: integer("enjoyment"), // 1..3
    confidence: integer("confidence"), // 1..3
    again: boolean("again"),
    discomfort: boolean("discomfort").default(false).notNull(),
    result: real("result"),
    isChallenge: boolean("is_challenge").default(false).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("activities_player_idx").on(t.playerId, t.completedAt)],
);

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id),
  kind: text("kind", { enum: ["weekly", "practice"] }).notNull(),
  weekKey: text("week_key"),
  level: integer("level").notNull(),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  levelUp: boolean("level_up").default(false).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const quizAnswers = pgTable("quiz_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => quizAttempts.id),
  questionId: text("question_id").notNull(),
  conceptId: text("concept_id").notNull(),
  correct: boolean("correct").notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id),
  matchDate: date("match_date").notNull(),
  team: text("team"),
  opposition: text("opposition"),
  competition: text("competition"),
  season: text("season"),
  format: text("format"),
  result: text("result"),
  // Batting (null = unknown, distinct from 0)
  batted: boolean("batted").default(false).notNull(),
  runs: integer("runs"),
  balls: integer("balls"),
  fours: integer("fours"),
  sixes: integer("sixes"),
  /** out | not_out | retired */
  battingStatus: text("batting_status"),
  howOut: text("how_out"),
  // Bowling
  bowled: boolean("bowled").default(false).notNull(),
  /** Stored as legal balls so incomplete overs work (e.g. 2.3 overs = 15). */
  ballsBowled: integer("balls_bowled"),
  runsConceded: integer("runs_conceded"),
  wickets: integer("wickets"),
  maidens: integer("maidens"),
  wides: integer("wides"),
  noBalls: integer("no_balls"),
  // Fielding
  catches: integer("catches"),
  runOuts: integer("run_outs"),
  stumpings: integer("stumpings"),
  isHistorical: boolean("is_historical").default(false).notNull(),
  editedByParent: boolean("edited_by_parent").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reflections = pgTable("reflections", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  playerId: integer("player_id").notNull().references(() => players.id),
  /** questionId -> option index (or "skip" / "unsure"). */
  answers: jsonb("answers").$type<Record<string, string>>().notNull(),
  worries: jsonb("worries").$type<string[]>(),
  wins: jsonb("wins").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Match day check-ins. */
export const matchPreps = pgTable("match_preps", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id),
  eventId: integer("event_id"),
  feeling: text("feeling"),
  focus: text("focus"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => players.id),
  type: text("type", { enum: ["match", "training", "other_sport", "rest", "event"] }).notNull(),
  title: text("title").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  location: text("location"),
  notes: text("notes"),
});

export const achievements = pgTable(
  "achievements",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id").notNull().references(() => players.id),
    key: text("key").notNull(),
    title: text("title").notNull(),
    detail: text("detail").notNull(),
    category: text("category", { enum: ["match", "development", "iq", "confidence"] }).notNull(),
    earnedAt: timestamp("earned_at", { withTimezone: true }).defaultNow().notNull(),
    seen: boolean("seen").default(false).notNull(),
  },
  (t) => [uniqueIndex("achievements_player_key").on(t.playerId, t.key)],
);

export type Player = typeof players.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Programme = typeof programmes.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type CalEvent = typeof events.$inferSelect;
