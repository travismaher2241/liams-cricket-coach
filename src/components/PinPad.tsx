"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { playerLogin } from "@/app/actions/auth";

export default function PinPad({ playerId }: { playerId: number }) {
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  const press = (d: string) => {
    if (pending) return;
    const next = (pin + d).slice(0, 4);
    setPin(next);
    setMsg("");
    if (next.length === 4) {
      start(async () => {
        const r = await playerLogin(playerId, next);
        if (r.ok) router.push("/play");
        else {
          setMsg("Not quite. Have another go!");
          setPin("");
        }
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex gap-3" aria-label="PIN entered">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-4 w-4 rounded-full ${i < pin.length ? "bg-turf" : "bg-line"}`} />
        ))}
      </div>
      <p className="h-5 text-sm text-gold">{msg}</p>
      <div className="grid w-full max-w-xs grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} onClick={() => press(d)} className="btn-ghost text-2xl">
            {d}
          </button>
        ))}
        <span />
        <button onClick={() => press("0")} className="btn-ghost text-2xl">
          0
        </button>
        <button onClick={() => setPin(pin.slice(0, -1))} className="btn-ghost text-base" aria-label="Delete">
          ⌫
        </button>
      </div>
    </div>
  );
}
