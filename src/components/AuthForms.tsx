"use client";
import { useActionState } from "react";
import { setupFamily, parentLogin } from "@/app/actions/auth";

export function SetupForm() {
  const [state, action, pending] = useActionState(setupFamily, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="label">You (parent)</p>
      <input className="input" name="parentName" placeholder="Your name" required />
      <input className="input" name="email" type="email" placeholder="Email" required />
      <input className="input" name="password" type="password" placeholder="Password (8+ characters)" required minLength={8} />
      <p className="label mt-2">Your cricketer</p>
      <input className="input" name="playerName" placeholder="First name, e.g. Liam" required />
      <input className="input" name="pin" inputMode="numeric" pattern="\d{4}" maxLength={4} placeholder="4-digit PIN for their login" required />
      {state?.error && <p className="text-sm text-gold">{state.error}</p>}
      <button className="btn-primary mt-2" disabled={pending}>
        {pending ? "Setting up…" : "Create accounts"}
      </button>
    </form>
  );
}

export function ParentLoginForm() {
  const [state, action, pending] = useActionState(parentLogin, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input className="input" name="email" type="email" placeholder="Email" required />
      <input className="input" name="password" type="password" placeholder="Password" required />
      {state?.error && <p className="text-sm text-gold">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
