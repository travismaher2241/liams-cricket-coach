import type { ScheduleSlot } from "@/content/mind";
/** Data shapes stored in Firestore. Dates are converted to JS Date on read. */

export interface User {
  id: string;
  role: "parent" | "player";
  name: string;
  email: string | null;
  passwordHash: string | null;
  pinHash: string | null;
  createdAt: Date;
}

export interface Player {
  id: string;
  userId: string;
  parentId: string;
  displayName: string;
  birthYear: number | null;
  battingHand: string | null;
  bowlingStyle: string | null;
  team: string | null;
  competition: string | null;
  /** PARENT ONLY. */
  parentOverview: string | null;
  /** PARENT ONLY. Area weights e.g. { batting: 2 }. */
  priorities: Record<string, number>;
  equipment: string[];
  spaces: string[];
  safetyNotes: string | null;
  playerAnswers: Record<string, string> | null;
  playerOnboarded: boolean;
  quizLevel: number;
  season: string | null;
  seasonPhase: "pre" | "in" | "off";
  /** Weekly training/game times (Melbourne). Missing = DEFAULT_SCHEDULE. */
  weeklySchedule?: ScheduleSlot[] | null;
  /** Liam's own reset word, picked by him. */
  mindWord?: string | null;
  /** Mind lessons Liam has finished. */
  mindDone?: string[];
  /** Encouraging lines the parent writes FOR Liam. These ARE shown to him. */
  mindLines?: string[];
  createdAt: Date;
}

/** PARENT ONLY. Never rendered on player pages or sent to the AI. */
export interface Observation {
  id: string;
  playerId: string;
  kind: "observation" | "coach_feedback" | "history" | "circumstance";
  area: string | null;
  body: string;
  createdAt: Date;
}

export interface Programme {
  id: string;
  playerId: string;
  templateKey: string;
  title: string;
  purpose: string;
  focusTags: string[];
  targetSessions: number;
  plannedWeeks: number;
  status: "active" | "paused" | "completed";
  parentNotes: string | null;
  startedAt: Date;
  completedAt: Date | null;
  revealedAt: Date | null;
}

export interface Activity {
  id: string;
  playerId: string;
  drillId: string;
  programmeId: string | null;
  minutes: number;
  difficulty: number | null;
  enjoyment: number | null;
  confidence: number | null;
  again: boolean | null;
  discomfort: boolean;
  result: number | null;
  isChallenge: boolean;
  completedAt: Date;
}

export interface QuizAnswer {
  questionId: string;
  conceptId: string;
  correct: boolean;
}

export interface QuizAttempt {
  id: string;
  playerId: string;
  kind: "weekly" | "practice";
  weekKey: string | null;
  level: number;
  score: number;
  total: number;
  levelUp: boolean;
  answers: QuizAnswer[];
  completedAt: Date;
}

export interface Match {
  id: string;
  playerId: string;
  matchDate: string; // YYYY-MM-DD
  team: string | null;
  opposition: string | null;
  competition: string | null;
  season: string | null;
  format: string | null;
  result: string | null;
  batted: boolean;
  runs: number | null;
  balls: number | null;
  fours: number | null;
  sixes: number | null;
  battingStatus: "out" | "not_out" | "retired" | null;
  howOut: string | null;
  bowled: boolean;
  /** Legal balls, so incomplete overs work (2.3 overs = 15). */
  ballsBowled: number | null;
  runsConceded: number | null;
  wickets: number | null;
  maidens: number | null;
  wides: number | null;
  noBalls: number | null;
  catches: number | null;
  runOuts: number | null;
  stumpings: number | null;
  isHistorical: boolean;
  editedByParent: boolean;
  createdAt: Date;
}

export interface Reflection {
  id: string;
  matchId: string;
  playerId: string;
  answers: Record<string, string>;
  worries: string[] | null;
  wins: string[] | null;
  createdAt: Date;
}

export interface MatchPrep {
  id: string;
  playerId: string;
  eventId: string | null;
  feeling: string | null;
  focus: string | null;
  createdAt: Date;
}

export interface CalEvent {
  id: string;
  playerId: string;
  type: "match" | "training" | "other_sport" | "rest" | "event";
  title: string;
  startsAt: Date;
  location: string | null;
  notes: string | null;
}

export interface Achievement {
  id: string; // = key
  playerId: string;
  key: string;
  title: string;
  detail: string;
  category: "match" | "development" | "iq" | "confidence";
  earnedAt: Date;
  seen: boolean;
}

/** Cached pre-session note. Doc id = `${dateKey}-${slotId}`. */
export interface MindNote {
  id: string;
  playerId: string;
  slotId: string;
  dateKey: string;
  text: string;
  createdAt: Date;
  pushedAt?: Date | null;
}

/** Liam's optional thoughts. The parent can read these (Trav's choice); the player page makes no claim either way. */
export interface Thought {
  id: string;
  playerId: string;
  text: string;
  /** Contains words that suggest he may be really upset. Highlighted for the parent, never sent to the AI. */
  flagged: boolean;
  createdAt: Date;
}

export interface PushSub {
  id: string;
  playerId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  role: "player" | "parent";
  createdAt: Date;
}

/** Liam's quick check-in after a training session. */
export interface SessionLog {
  id: string; // = `${dateKey}-${slotId}`
  playerId: string;
  slotId: string;
  title: string;
  dateKey: string;
  feeling: number | null;
  worked: string[];
  proud: string[];
  note: string | null;
  createdAt: Date;
}
