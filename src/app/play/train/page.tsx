import Link from "next/link";
import { requirePlayerView } from "@/lib/auth";
import { recommendContext } from "@/lib/data";
import { recommend, dateSeed } from "@/lib/recommend";
import { AREA_LABEL, PLACE_LABEL, type Area, type Place } from "@/content/drills";

const TIMES = [2, 5, 10, 15, 20];

function chipHref(cur: Record<string, string | undefined>, key: string, val?: string) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(cur)) if (v && k !== key) p.set(k, v);
  if (val && cur[key] !== val) p.set(key, val);
  const s = p.toString();
  return `/play/train${s ? "?" + s : ""}`;
}

export default async function Train({ searchParams }: { searchParams: Promise<{ time?: string; place?: string; area?: string; more?: string }> }) {
  const sp = await searchParams;
  const { player } = await requirePlayerView();
  const ctx = await recommendContext(player);
  const time = sp.time ? Number(sp.time) : undefined;
  const list = recommend(
    ctx,
    { maxMinutes: time && time < 20 ? time : undefined, place: sp.place as Place | undefined, area: sp.area as Area | undefined },
    dateSeed(new Date(), Number(sp.more ?? 0)),
  );
  const shown = list.slice(0, 5);
  const places: Place[] = player.spaces.length ? (player.spaces as Place[]) : ["inside", "backyard", "nets", "oval"];

  return (
    <main className="flex flex-col gap-4">
      <h1 className="h-display text-3xl">Train</h1>

      <div>
        <p className="label mb-2">How long have you got?</p>
        <div className="flex flex-wrap gap-2">
          {TIMES.map((t) => (
            <Link key={t} href={chipHref(sp, "time", String(t))} className={`btn-small ${sp.time === String(t) ? "!bg-turf !text-pitch" : ""}`}>
              {t === 20 ? "20+ min" : `${t} min`}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <p className="label mb-2">Where are you?</p>
        <div className="flex flex-wrap gap-2">
          {places.map((p) => (
            <Link key={p} href={chipHref(sp, "place", p)} className={`btn-small ${sp.place === p ? "!bg-turf !text-pitch" : ""}`}>
              {PLACE_LABEL[p]}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <p className="label mb-2">What do you feel like?</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(AREA_LABEL) as Area[]).map((a) => (
            <Link key={a} href={chipHref(sp, "area", a)} className={`btn-small ${sp.area === a ? "!bg-turf !text-pitch" : ""}`}>
              {AREA_LABEL[a]}
            </Link>
          ))}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        {shown.length === 0 && <p className="card text-muted">Nothing fits those choices. Try a different one!</p>}
        {shown.map((d, i) => (
          <Link key={d.id} href={`/play/drill/${d.id}`} className={`card flex items-center justify-between gap-3 ${i === 0 ? "border-turf/60" : ""}`}>
            <span>
              {i === 0 && <span className="label text-turf">Top pick</span>}
              <span className="block text-lg font-semibold">{d.name}</span>
              <span className="block text-sm text-muted">{d.purpose}</span>
              <span className="mt-1 flex flex-wrap gap-1.5">
                <span className="chip">{d.minutes} min</span>
                <span className="chip">{AREA_LABEL[d.area]}</span>
                {(d.needsAdult || d.needsPartner) && <span className="chip !text-gold">{d.needsAdult ? "Adult needed" : "Needs a partner"}</span>}
              </span>
            </span>
            <span className="text-2xl text-muted">›</span>
          </Link>
        ))}
        {list.length > 5 && (
          <Link href={chipHref({ ...sp, more: undefined }, "more", String(Number(sp.more ?? 0) + 1))} className="btn-ghost">
            Show me different ones
          </Link>
        )}
      </section>
    </main>
  );
}
