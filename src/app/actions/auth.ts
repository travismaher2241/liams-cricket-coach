"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { eq, sql } from "drizzle-orm";
import { createSession, destroySession } from "@/lib/auth";

export type FormState = { error?: string } | undefined;

export async function setupFamily(_: FormState, fd: FormData): Promise<FormState> {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.users);
  if (n > 0) return { error: "This app is already set up. Please log in." };
  const parentName = String(fd.get("parentName") || "").trim();
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const playerName = String(fd.get("playerName") || "").trim();
  const pin = String(fd.get("pin") || "");
  if (!parentName || !email || !playerName) return { error: "Please fill in every field." };
  if (password.length < 8) return { error: "Password needs at least 8 characters." };
  if (!/^\d{4}$/.test(pin)) return { error: "The PIN must be 4 digits." };

  const [parent] = await db
    .insert(schema.users)
    .values({ role: "parent", name: parentName, email, passwordHash: await bcrypt.hash(password, 10) })
    .returning();
  const [pu] = await db
    .insert(schema.users)
    .values({ role: "player", name: playerName, pinHash: await bcrypt.hash(pin, 10) })
    .returning();
  const [player] = await db
    .insert(schema.players)
    .values({ userId: pu.id, parentId: parent.id, displayName: playerName })
    .returning();
  await createSession({ uid: parent.id, role: "parent", pid: player.id });
  redirect("/parent/profile?welcome=1");
}

export async function parentLogin(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (!u || u.role !== "parent" || !u.passwordHash || !(await bcrypt.compare(password, u.passwordHash))) {
    return { error: "That email and password didn't match." };
  }
  const [player] = await db.select().from(schema.players).where(eq(schema.players.parentId, u.id));
  if (!player) return { error: "No player is linked to this account." };
  await createSession({ uid: u.id, role: "parent", pid: player.id });
  redirect("/parent");
}

export async function playerLogin(playerId: number, pin: string): Promise<{ ok: boolean }> {
  const [player] = await db.select().from(schema.players).where(eq(schema.players.id, playerId));
  if (!player) return { ok: false };
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, player.userId));
  if (!u?.pinHash || !(await bcrypt.compare(pin, u.pinHash))) return { ok: false };
  await createSession({ uid: u.id, role: "player", pid: player.id });
  return { ok: true };
}

export async function logout() {
  await destroySession();
  redirect("/");
}
