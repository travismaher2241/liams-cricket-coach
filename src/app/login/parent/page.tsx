import Link from "next/link";
import { ParentLoginForm } from "@/components/AuthForms";

export default function ParentLogin() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <h1 className="h-display text-3xl">Parent login</h1>
      <ParentLoginForm />
      <Link href="/" className="text-center text-sm text-muted underline">Back</Link>
    </main>
  );
}
