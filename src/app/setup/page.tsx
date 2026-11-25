import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { sql } from "drizzle-orm";
import { SetupForm } from "@/components/AuthForms";

export const dynamic = "force-dynamic";

export default async function Setup() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.users);
  if (n > 0) redirect("/");
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div>
        <div className="text-4xl">🏏</div>
        <h1 className="h-display mt-2 text-3xl">Set up the app</h1>
        <p className="mt-1 text-sm text-muted">
          Create the parent account and your cricketer&apos;s login. They&apos;ll sign in by tapping their name and a 4-digit PIN.
        </p>
      </div>
      <SetupForm />
    </main>
  );
}
