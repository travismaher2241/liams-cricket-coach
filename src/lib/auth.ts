import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPlayer } from "@/db/repo";

const COOKIE = "lcc_session";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-only-secret-not-for-production!!");

export interface Session {
  uid: string;
  role: "parent" | "player";
  pid: string; // player id
}

export async function createSession(s: Session) {
  const token = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(s.role === "player" ? "90d" : "30d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * (s.role === "player" ? 90 : 30),
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.uid !== "string" || typeof payload.pid !== "string") return null;
    return { uid: payload.uid, role: payload.role as Session["role"], pid: payload.pid };
  } catch {
    return null;
  }
}

/** Player pages: Liam, or a parent previewing. */
export async function requirePlayerView() {
  const s = await getSession();
  if (!s) redirect("/");
  const player = await getPlayer(s.pid);
  if (!player) redirect("/");
  return { session: s, player };
}

export async function requireParent() {
  const s = await getSession();
  if (!s || s.role !== "parent") redirect("/login/parent");
  const player = await getPlayer(s.pid);
  if (!player) redirect("/setup");
  return { session: s, player };
}
