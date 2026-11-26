"use client";
import { useEffect, useState } from "react";
import { removePushSub, savePushSub, sendTestPush } from "@/app/actions/player";

type State = "loading" | "unsupported" | "needs-install" | "off" | "on" | "blocked";

function urlB64ToUint8Array(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Turn coach notifications on/off on this device. */
export default function PushToggle({ compact = false, publicKey }: { compact?: boolean; publicKey: string }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const key = publicKey;

  useEffect(() => {
    (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window) || !key) {
        setState(ios && !standalone ? "needs-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") return setState("blocked");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, [key]);

  async function turnOn() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState(perm === "denied" ? "blocked" : "off");
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(key!) }));
      const j = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await savePushSub({ endpoint: j.endpoint, keys: j.keys });
      setState("on");
      await sendTestPush();
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await removePushSub(sub.endpoint);
      await sub.unsubscribe();
    }
    setState("off");
    setBusy(false);
  }

  if (state === "loading" || state === "unsupported") return null;
  if (compact && state === "on") return null;

  return (
    <section className="card">
      <p className="label">Coach messages</p>
      {state === "needs-install" && (
        <p className="mt-1 text-sm text-muted">To get a message from your coach before training and games, add this app to your home screen first (Share, then Add to Home Screen) and open it from there.</p>
      )}
      {state === "blocked" && <p className="mt-1 text-sm text-muted">Notifications are turned off for this app in your phone&apos;s settings. Ask a grown-up to help turn them on.</p>}
      {state === "off" && (
        <>
          <p className="mt-1 text-sm text-muted">Get a message from your coach on your phone before training and games.</p>
          <button onClick={turnOn} disabled={busy} className="btn-primary mt-3 w-full">Turn on coach messages</button>
        </>
      )}
      {state === "on" && (
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-sm">On for this phone</p>
          <button onClick={turnOff} disabled={busy} className="btn-small">Turn off</button>
        </div>
      )}
    </section>
  );
}
