"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import * as repo from "@/db/repo";
import { createSession, destroySession } from "@/lib/auth";

export type FormState = { error?: string } | undefined;

export async function setupFamily(_: FormState, fd: FormData): Promise<FormState> {
  if ((await repo.countUsers()) > 0) return { error: "This app is already set up. Please log in." };
  const parentName = String(fd.get("parentName") || "").trim();
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const playerName = String(fd.get("playerName") || "").trim();
  const pin = String(fd.get("pin") || "");
  if (!parentName || !email || !playerName) return { error: "Please fill in every field." };
  if (password.length < 8) return { error: "Password needs at least 8 characters." };
  if (!/^\d{4}$/.test(pin)) return { error: "The PIN must be 4 digits." };

  const now = new Date();
  const { parentId, playerId } = await repo.createFamily(
    { role: "parent", name: parentName, email, passwordHash: await bcrypt.hash(password, 10), pinHash: null, createdAt: now },
    { role: "player", name: playerName, email: null, passwordHash: null, pinHash: await bcrypt.hash(pin, 10), createdAt: now },
    playerName,
  );
  await createSession({ uid: parentId, role: "parent", pid: playerId });
  redirect("/parent/profile?welcome=1");
}

export async function parentLogin(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const u = email ? await repo.getUserByEmail(email) : null;
  if (!u || u.role !== "parent" || !u.passwordHash || !(await bcrypt.compare(password, u.passwordHash))) {
    return { error: "That email and password didn't match." };
  }
  const player = await repo.getPlayerByParent(u.id);
  if (!player) return { error: "No player is linked to this account." };
  await createSession({ uid: u.id, role: "parent", pid: player.id });
  redirect("/parent");
}

export async function playerLogin(playerId: string, pin: string): Promise<{ ok: boolean }> {
  const player = await repo.getPlayer(playerId);
  if (!player) return { ok: false };
  const u = await repo.getUser(player.userId);
  if (!u?.pinHash || !(await bcrypt.compare(pin, u.pinHash))) return { ok: false };
  await createSession({ uid: u.id, role: "player", pid: player.id });
  return { ok: true };
}

export async function logout() {
  await destroySession();
  redirect("/");
}
