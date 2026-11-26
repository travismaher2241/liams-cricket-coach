import { NextResponse } from "next/server";
import { sendDueNotes } from "@/lib/mind";

export const dynamic = "force-dynamic";

/**
 * Hit every ~30 minutes by the scheduler (GitHub Actions). Safe to call any
 * time: it only sends notifications that are due, each one once. If
 * CRON_SECRET is set, callers must send `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  const sent = await sendDueNotes();
  return NextResponse.json({ ok: true, sent });
}
