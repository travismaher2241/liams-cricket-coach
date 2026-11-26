/**
 * Mental coaching content. Everything here is player-facing: calm, short,
 * one idea at a time. The main theme is that getting out is a normal part of
 * cricket, so Liam can play the ball instead of just trying to survive.
 */

export type SessionKind = "training" | "match";

export interface ScheduleSlot {
  id: string;
  /** 0 = Sunday … 6 = Saturday (Melbourne time). */
  day: number;
  /** "HH:MM", 24-hour, Melbourne time. */
  time: string;
  kind: SessionKind;
  /** How long it usually runs, in minutes. Defaults: training 90, game 150. */
  durationMin?: number;
  title: string;
}

export const DEFAULT_SCHEDULE: ScheduleSlot[] = [
  { id: "mon", day: 1, time: "16:00", kind: "training", title: "Training" },
  { id: "wed", day: 3, time: "17:00", kind: "match", title: "Game day" },
  { id: "thu", day: 4, time: "17:15", kind: "training", title: "Senior team training" },
];

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Minutes before a session that its note starts to show, and minutes after the start it stays. */
export const NOTE_LEAD_MIN = 150;
/** Phone notifications go out when a session is this many minutes away (checked every 30 min). */
export const PUSH_FROM_MIN = 30;
export const PUSH_TO_MIN = 150;
export const NOTE_TAIL_MIN = 30;

export const MIND_WORDS = ["Watch", "Next ball", "Breathe", "See it, hit it", "Have a go", "Fresh"];

export interface Lesson {
  id: string;
  icon: string;
  title: string;
  /** Short screens, shown one at a time. */
  steps: string[];
  /** The line to remember. */
  takeaway: string;
}

export const LESSONS: Lesson[] = [
  {
    id: "ok-to-get-out",
    icon: "🏏",
    title: "It's OK to get out",
    steps: [
      "Every batter gets out. Every single one. It's part of the game, like a goalie letting in a goal.",
      "Don Bradman is the best batter who ever lived. He still got out in 70 of his 80 Test innings.",
      "In his very last Test innings, Bradman was out for 0. People still call him the greatest.",
      "Getting out doesn't mean you let anyone down. Your team wants you to have a go and enjoy it.",
    ],
    takeaway: "Getting out is part of cricket. Having a go is what counts.",
  },
  {
    id: "play-the-ball",
    icon: "👀",
    title: "Play the ball, not the worry",
    steps: [
      "When we worry about getting out, our feet freeze and we just try to survive. That actually makes batting harder.",
      "Batters who score runs are thinking about one thing: the ball.",
      "Watch it out of the bowler's hand. See it, then hit it.",
      "If it's in your zone, back yourself and play your shot. If you get out playing your shot, that's a good out.",
    ],
    takeaway: "See it, hit it. One ball at a time.",
  },
  {
    id: "walk-back",
    icon: "🔄",
    title: "The walk-back reset",
    steps: [
      "When you get out, it's normal to feel flat. Every cricketer does. Here's what the pros do.",
      "Step 1: Take one big breath on the walk back. In through your nose, slowly out through your mouth.",
      "Step 2: Say to yourself, \"Next time.\" That innings is finished. The next one is brand new.",
      "Step 3: Pads off, then cheer on your teammates. Being a great teammate counts just as much.",
      "Later on, think of one thing you did well. There's always something.",
    ],
    takeaway: "Breathe. \"Next time.\" Cheer your mates.",
  },
  {
    id: "hit-for-four",
    icon: "🎯",
    title: "Hit for four or six?",
    steps: [
      "A batter's whole job is to score runs. So when they hit you for four or six, they're just doing their job.",
      "It happens to every bowler in the world. The best Test bowlers get hit for six too, and they keep running in.",
      "Bowlers who take wickets are the ones brave enough to keep bowling their best ball.",
      "Next ball: breathe, walk back to your mark, pick your spot, and run in.",
      "Getting hit is a good thing at training. It shows you something to practise, and getting better is the fun part.",
    ],
    takeaway: "That's the batter's job. My job is the next ball.",
  },
  {
    id: "misfields",
    icon: "🧤",
    title: "Misfields happen",
    steps: [
      "Every fielder misfields sometimes. The ball bounces funny, the grass is bumpy, it's quick. It happens to everyone.",
      "Even the best fielders in the world drop catches and let balls through.",
      "What great fielders do next: clap their hands, say \"next one\", and get ready again.",
      "Each misfield shows you something to practise. That's a reason to enjoy training, not a reason to feel bad.",
    ],
    takeaway: "Clap, \"next one\", get ready.",
  },
  {
    id: "nerves",
    icon: "🦋",
    title: "Nerves mean you care",
    steps: [
      "Butterflies before batting? That's your body getting ready. It's energy, not a warning.",
      "Top players get nervous too, even in big Test matches. They just let the nerves come along for the ride.",
      "Try saying \"I'm excited\" instead of \"I'm nervous\". It's the same feeling, pointed in a good direction.",
    ],
    takeaway: "Nervous just means I care. That's a good thing.",
  },
  {
    id: "teammates",
    icon: "🤝",
    title: "Your team has your back",
    steps: [
      "Every player in your team has been out heaps of times. Nobody thinks less of you when you get out.",
      "Think about when a teammate gets out. You don't think they let you down. You clap them in.",
      "They feel the same about you. Clap them, and they'll clap you.",
    ],
    takeaway: "We win together, we get out together, we have fun together.",
  },
  {
    id: "between-balls",
    icon: "⏸️",
    title: "Between balls",
    steps: [
      "Every ball is a fresh start. What happened last ball doesn't matter now.",
      "Between balls: step away, tap your bat, and take a breath.",
      "Say your word to yourself, then look up at the bowler.",
      "Watch the ball. That's your only job.",
    ],
    takeaway: "Tap, breathe, my word, watch the ball.",
  },
];

export const LESSON_BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l]));

/** Fallback notes before a session, used when Gemini is unavailable. No "fail"/"disappoint" words. */
export const NOTE_FALLBACKS: Record<SessionKind, string[]> = {
  match: [
    "If a batter hits you for four, that's their job. Your job is the next ball. Run in and enjoy it.",
    "Everyone misfields sometimes, even the best. Clap your hands, say \"next one\", and get ready again.",
    "Game day! Getting out is part of cricket, even for the best. Watch the ball, play your shots and enjoy it.",
    "Your only job today is to watch the ball and have fun with your mates. Whatever happens, you're part of the team.",
    "Every batter gets out. Bradman did 70 times in Tests! So relax, back yourself and play the ball.",
    "Nervous just means you care. Take a big breath, watch the ball, and have a go.",
    "Play the ball, not the worry. If you get out playing your shot, that's a good out.",
  ],
  training: [
    "Training is where getting hit for four or misfielding is a good thing. It shows you what to practise next.",
    "Bowl your best ball today, and if it goes for six, smile and go again. Every bowler gets hit.",
    "Training is the place to try things. Have a go at your shots and see what happens.",
    "Mistakes at training are how you learn. Swing freely, watch the ball and enjoy it.",
    "Today, practise playing your shots with confidence. Getting out in the nets is totally fine.",
    "One focus today: watch the ball right onto the bat. Everything else, just have fun.",
    "You've been working hard. Go and enjoy hitting some balls with your mates.",
  ],
};

export type ToughMoment = "out" | "hit" | "misfield";

export const TOUGH_MOMENTS: { key: ToughMoment; icon: string; label: string }[] = [
  { key: "out", icon: "🏏", label: "I got out" },
  { key: "hit", icon: "🎯", label: "I got hit for 4 or 6" },
  { key: "misfield", icon: "🧤", label: "I misfielded or dropped one" },
];

export const RESET_STEPS: Record<ToughMoment, { big: string; small: string }[]> = {
  out: [
    { big: "That's OK.", small: "Every batter gets out. Even the best in the world. You had a go." },
    { big: "One big breath", small: "In through your nose for 4… out through your mouth for 6." },
    { big: "“Next time.”", small: "Say it to yourself. That innings is finished. The next one is brand new." },
    { big: "Cheer your mates", small: "Pads off, then clap your teammates on. Being a great teammate counts just as much." },
    { big: "One good thing", small: "Think of one thing you did well today. A good shot, a good leave, running hard. There's always something." },
  ],
  hit: [
    { big: "That's their job!", small: "A batter's job is to score runs. Every bowler in the world gets hit for four and six." },
    { big: "One big breath", small: "In through your nose for 4… out through your mouth for 6, on the walk back to your mark." },
    { big: "“Next ball.”", small: "That ball is finished. Pick your spot for the next one." },
    { big: "Run in and back yourself", small: "Brave bowlers take wickets. Bowl your best ball." },
  ],
  misfield: [
    { big: "Happens to everyone", small: "Every fielder misfields and drops catches sometimes, even the best in the world." },
    { big: "Clap it off", small: "Clap your hands once and say “next one”." },
    { big: "Get ready again", small: "Walk in with the bowler, low and ready. You want the next one to come to you." },
    { big: "Something to practise", small: "That's a reason to enjoy training. Getting better is the fun part." },
  ],
};

export const RESET_LINE = "Breathe. \"Next time.\" Cheer your mates.";

// ---------------------------------------------------------------------------
// Schedule helpers (pure, Melbourne time)

/** Current Melbourne weekday, minutes after midnight and date key (YYYY-MM-DD). */
export function melbNow(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Melbourne",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const dateKey = now.toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" });
  return { day, minutes, dateKey };
}

export const slotMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export function formatTime(t: string) {
  const mins = slotMinutes(t);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
}

/**
 * The session whose note should show now: from NOTE_LEAD_MIN before it starts
 * until NOTE_TAIL_MIN after, on the same Melbourne day.
 */
export function sessionNow(schedule: ScheduleSlot[], now = new Date()) {
  const n = melbNow(now);
  for (const s of schedule) {
    if (s.day !== n.day) continue;
    const delta = slotMinutes(s.time) - n.minutes;
    if (delta <= NOTE_LEAD_MIN && delta >= -NOTE_TAIL_MIN) return { slot: s, minutesUntil: delta, dateKey: n.dateKey };
  }
  return null;
}

/** Next session from now (today later on, or the coming days), with days ahead. */
export function nextSession(schedule: ScheduleSlot[], now = new Date()) {
  if (!schedule.length) return null;
  const n = melbNow(now);
  let best: { slot: ScheduleSlot; daysAhead: number; score: number } | null = null;
  for (const s of schedule) {
    let ahead = (s.day - n.day + 7) % 7;
    if (ahead === 0 && slotMinutes(s.time) < n.minutes - NOTE_TAIL_MIN) ahead = 7;
    const score = ahead * 1440 + slotMinutes(s.time);
    if (!best || score < best.score) best = { slot: s, daysAhead: ahead, score };
  }
  return best && { slot: best.slot, daysAhead: best.daysAhead };
}

export function whenLabel(daysAhead: number, slot: ScheduleSlot) {
  const day = daysAhead === 0 ? "Today" : daysAhead === 1 ? "Tomorrow" : DAY_NAMES[slot.day];
  return `${day}, ${formatTime(slot.time)}`;
}

export function cleanSchedule(raw: unknown): ScheduleSlot[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && Number.isInteger(s.day) && s.day >= 0 && s.day <= 6 && /^\d{1,2}:\d{2}$/.test(s.time))
    .map((s, i): ScheduleSlot => ({
      id: String(s.id || `s${i}`),
      day: s.day,
      time: s.time,
      kind: s.kind === "match" ? "match" : "training",
      title: String(s.title || (s.kind === "match" ? "Game day" : "Training")).slice(0, 60),
      ...(Number(s.durationMin) >= 15 && Number(s.durationMin) <= 600 ? { durationMin: Math.round(Number(s.durationMin)) } : {}),
    }))
    .slice(0, 14);
}

/** Session whose phone notification is due now (PUSH_FROM_MIN..PUSH_TO_MIN before start). */
export const slotDuration = (s: ScheduleSlot) => s.durationMin ?? (s.kind === "match" ? 150 : 90);

/** After-session reminder window: from 15 min to 2 hours after the session ends. */
export const AFTER_FROM_MIN = 15;
export const AFTER_TO_MIN = 120;

/** Session that finished recently enough for the "add your update" reminder. */
export function sessionDueForAfterPush(schedule: ScheduleSlot[], now = new Date()) {
  const n = melbNow(now);
  for (const s of schedule) {
    if (s.day !== n.day) continue;
    const since = n.minutes - (slotMinutes(s.time) + slotDuration(s));
    if (since >= AFTER_FROM_MIN && since <= AFTER_TO_MIN) return { slot: s, minutesSinceEnd: since, dateKey: n.dateKey };
  }
  return null;
}

/** Session that ended earlier today (up to 8 hours ago), for the home-screen prompt. */
export function sessionEndedToday(schedule: ScheduleSlot[], now = new Date()) {
  const n = melbNow(now);
  let best: { slot: ScheduleSlot; dateKey: string; since: number } | null = null;
  for (const s of schedule) {
    if (s.day !== n.day) continue;
    const since = n.minutes - (slotMinutes(s.time) + slotDuration(s));
    if (since >= 0 && since <= 480 && (!best || since < best.since)) best = { slot: s, dateKey: n.dateKey, since };
  }
  return best;
}

export const CHECKIN_FEELINGS = [
  { v: 4, icon: "🤩", label: "Loved it" },
  { v: 3, icon: "🙂", label: "Good" },
  { v: 2, icon: "😐", label: "Okay" },
  { v: 1, icon: "💪", label: "Tough one" },
];
export const CHECKIN_AREAS = ["Batting", "Bowling", "Fielding", "Keeping", "Running & fitness", "Match practice"];
export const CHECKIN_PROUD = ["A good shot", "A good ball", "A good catch or stop", "Tried something new", "Kept going", "Helped a teammate", "Listened to the coach"];

export function sessionDueForPush(schedule: ScheduleSlot[], now = new Date()) {
  const n = melbNow(now);
  for (const s of schedule) {
    if (s.day !== n.day) continue;
    const delta = slotMinutes(s.time) - n.minutes;
    if (delta >= PUSH_FROM_MIN && delta <= PUSH_TO_MIN) return { slot: s, minutesUntil: delta, dateKey: n.dateKey };
  }
  return null;
}

/** Words that suggest more than cricket nerves. Such thoughts are never sent to the AI. */
const DISTRESS = [/kill/i, /suicid/i, /hurt (my|me|him|her)self/i, /self[- ]?harm/i, /want to die/i, /wanna die/i, /hate (my ?self|me)/i, /no one likes me/i, /nobody likes me/i, /bullied|bully|bullies/i, /cut(ting)? myself/i, /end it/i];
export const isDistress = (t: string) => DISTRESS.some((r) => r.test(t));

export const THOUGHT_PROMPTS = [
  "What's on your mind about cricket?",
  "How are you feeling about your next game?",
  "Anything worrying you a bit?",
  "What went well this week?",
];
