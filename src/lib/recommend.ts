import { DRILLS, type Area, type Drill, type Equipment, type Place } from "@/content/drills";
import { rng } from "./quizEngine";

export interface RecentActivity {
  drillId: string;
  enjoyment: number | null;
  again: boolean | null;
  discomfort: boolean;
  completedAt: Date;
}

export interface RecommendContext {
  equipment: string[];
  spaces: string[];
  /** Parent-set area weights, e.g. { batting: 2 }. */
  priorities: Record<string, number>;
  /** Focus tags of active (not paused) programmes. */
  programmeTags: string[];
  recent: RecentActivity[];
  /** True if Liam bowled in a match in the last 36 hours: go easy on bowling/throwing. */
  recentMatchBowling?: boolean;
  now: Date;
}

export interface RecommendFilter {
  area?: Area;
  maxMinutes?: number;
  place?: Place;
  /** Exclude drills needing a partner or adult. */
  solo?: boolean;
  excludeIds?: string[];
}

const DEFAULT_EQUIPMENT: Equipment[] = ["bat", "tennis_ball", "none"];

export function hasEquipment(d: Drill, available: string[]) {
  const have = new Set<string>([...(available.length ? available : DEFAULT_EQUIPMENT), "none"]);
  return d.equipment.every((e) => have.has(e));
}

export function scoreDrill(d: Drill, ctx: RecommendContext): number {
  let s = 1;
  s += d.tags.filter((t) => ctx.programmeTags.includes(t)).length * 2;
  s += (ctx.priorities[d.area] ?? 0) * 1.5;
  const mine = ctx.recent.filter((r) => r.drillId === d.id);
  const lastDone = mine.reduce<Date | null>((a, r) => (!a || r.completedAt > a ? r.completedAt : a), null);
  if (lastDone) {
    const days = (ctx.now.getTime() - lastDone.getTime()) / 86400000;
    if (days < 1) s -= 4; // variety
    else if (days < 3) s -= 1.5;
  }
  if (mine.some((r) => r.enjoyment === 3 || r.again)) s += 1;
  if (mine.some((r) => r.again === false)) s -= 1.5;
  if (mine.some((r) => r.discomfort && ctx.now.getTime() - r.completedAt.getTime() < 7 * 86400000)) s -= 6;
  if (ctx.recentMatchBowling && (d.area === "bowling" || d.tags.includes("throwing_power"))) s -= 5;
  if (d.needsPartner || d.needsAdult) s -= 0.5;
  return s;
}

export function recommend(ctx: RecommendContext, filter: RecommendFilter = {}, seed = 1): Drill[] {
  const rand = rng(seed);
  const places = filter.place ? [filter.place] : ctx.spaces.length ? (ctx.spaces as Place[]) : null;
  const pool = DRILLS.filter(
    (d) =>
      hasEquipment(d, ctx.equipment) &&
      (!filter.area || d.area === filter.area) &&
      (!filter.maxMinutes || d.minutes <= filter.maxMinutes) &&
      (!places || d.places.some((p) => places.includes(p))) &&
      (!filter.solo || (!d.needsPartner && !d.needsAdult)) &&
      !filter.excludeIds?.includes(d.id),
  );
  // Small random jitter keeps things fresh.
  return pool
    .map((d) => ({ d, s: scoreDrill(d, ctx) + rand() * 1.2 }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.d);
}

export function dateSeed(d: Date, salt = 0) {
  const k = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(d);
  return Number(k.replace(/-/g, "")) + salt;
}

/** Today's challenge: short, solo-friendly, stable for the day. */
export function dailyChallenge(ctx: RecommendContext): Drill | null {
  const list = recommend(ctx, { maxMinutes: 5, solo: true }, dateSeed(ctx.now));
  return list[0] ?? null;
}
