# Liam's Cricket Coach

A personal cricket development app for a junior cricketer, with separate **player** and **parent** experiences.

> Simple on the outside. Intelligent on the inside. Every little bit counts.

## What's in the first release

**Player (Liam)** – mobile-first, big buttons, minimal reading, never negative.
- **Home**: today's challenge (start / something else / not today), one focus, quiz status, next match, recent wins and PBs. No streaks, no overdue warnings.
- **Train**: quick sessions filtered by time (2–20+ min), place and area, personalised to equipment, spaces, parent priorities and hidden programmes. Each drill shows purpose, equipment, steps, cues, reps, completion point, safety and supervision flags. Feedback is all optional taps (difficulty, fun, confidence, again?, discomfort, measured result → personal bests).
- **Coach**: 10 button choices ("I've got five minutes", "Help me build my confidence"…). Short coaching lines come from **Google Gemini** when `GEMINI_API_KEY` is set, otherwise from built-in lines. Only player-safe info is sent (never parent notes), and replies are filtered for negative language.
- **Learn**: weekly 20-question Cricket IQ quiz (no time limit). **>75% unlocks the next level, ≤75% stays, never drops.** Every concept missed comes back the next week with different wording; mastered concepts are revisited. Optional practice never affects the level. Junior-rule questions are flagged.
- **Match Day mode**: feeling check-in (with calm messaging when nervous), one simple focus, kit checklist, warm-up and breathing.
- **Record a match**: stats wizard (handles not out / retired, incomplete overs, unknown vs zero), then 6–10 rotated reflection questions, each with "Not sure" and Skip, occasional worries check, and personal wins.
- **Journey**: this week, career/season stats, awards and PBs, and a chronological story. Completed hidden programmes are revealed with real numbers only.

**Parent** – full picture.
- Overview, hidden development programmes (start / pause / complete), **private notes** (never shown to Liam or sent to the AI), matches (correct, add historical), schedule, Cricket IQ detail (reinforcement list, concepts understood), confidence & enjoyment trends (self-reported, non-clinical), training log and assessments, profile/equipment/spaces/safety/priorities, Liam's PIN.

Excluded per spec: video, PlayHQ integration, voice.

## Stack

Next.js 15 (App Router, server actions) · Postgres via Drizzle ORM · Tailwind CSS 4 · `@google/genai` for the coach · JWT cookie sessions (parent: email + password; player: tap name + 4-digit PIN).

## Environment variables

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (Neon/Supabase/local) |
| `SESSION_SECRET` | Long random string used to sign login cookies |
| `GEMINI_API_KEY` | Optional. Google AI Studio key for coach lines |
| `GEMINI_MODEL` | Optional. Defaults to `gemini-2.5-flash` |

## Local development

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL and SESSION_SECRET
npx drizzle-kit push         # create tables
npm run dev
npm test                     # quiz progression, reinforcement, stats, recommendations
```

Open the app and you'll be sent to `/setup` to create the parent account and the player login.

## Content

- Drills: `src/content/drills.ts`
- Quiz concepts (each with 2+ wordings): `src/content/quiz.ts`
- Reflection questions, worries and wins: `src/content/reflection.ts`
- Programme templates: `src/content/programmes.ts`
