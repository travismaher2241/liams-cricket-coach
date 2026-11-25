import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, Timestamp, type Firestore } from "firebase-admin/firestore";

const g = globalThis as unknown as { __fs?: Firestore };

/**
 * Firestore via firebase-admin. Credentials come from FIREBASE_SERVICE_ACCOUNT
 * (the full service-account JSON). Locally, FIRESTORE_EMULATOR_HOST +
 * FIREBASE_PROJECT_ID is enough.
 */
export function firestore(): Firestore {
  if (g.__fs) return g.__fs;
  let app: App;
  if (getApps().length) app = getApps()[0];
  else {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (raw) {
      const sa = JSON.parse(raw);
      app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
    } else if (process.env.FIRESTORE_EMULATOR_HOST) {
      app = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || "demo-cricket" });
    } else {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is not set");
    }
  }
  const fs = getFirestore(app);
  try {
    fs.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Already configured by another server bundle sharing this app.
  }
  g.__fs = fs;
  return fs;
}

/** Convert Firestore Timestamps to Dates, recursively. */
export function fromFs<T>(id: string, data: FirebaseFirestore.DocumentData): T {
  const conv = (v: unknown): unknown => {
    if (v instanceof Timestamp) return v.toDate();
    if (Array.isArray(v)) return v.map(conv);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, conv(x)]));
    return v;
  };
  return { ...(conv(data) as object), id } as T;
}
