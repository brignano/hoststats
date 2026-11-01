import { ParsedData, Reservation } from "./models";

/**
 * Opt-in only: the host ticks "Remember my data on this device" and the import
 * is kept in this browser's IndexedDB, so a reload or a visit next week starts
 * on the dashboard instead of the upload screen. Unticking deletes it.
 *
 * IndexedDB rather than localStorage for two reasons: an export can run to
 * thousands of stays, well past localStorage's ~5 MB of string, and structured
 * clone round-trips `Date` objects natively, so the stored stays come back as
 * the same shape the importers produced instead of needing dates revived from
 * strings.
 *
 * Storage can be missing, blocked or full (private windows, blocked site data,
 * quota), so every access resolves rather than rejects: failing to remember is
 * never an error, and the visit carries on in memory.
 */

const DB_NAME = "hoststats";
const DB_VERSION = 1;
const STORE = "session";
const RECORD_KEY = "current";

/**
 * Whether the host opted in. Kept in localStorage, not IndexedDB, because it
 * has to be readable synchronously during the first render — the page needs to
 * know whether to show the upload screen or wait for a restore, and a flash of
 * the uploader before the dashboard appears reads as a bug.
 */
const FLAG = "hoststats.remember.v1";

/** The record shape. Bumped if `ParsedData` ever changes incompatibly. */
const RECORD_VERSION = 1;

interface SavedRecord {
  version: number;
  savedAt: Date;
  data: ParsedData;
}

export interface RestoredSession {
  data: ParsedData;
  savedAt: Date;
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function isRemembering(): boolean {
  try {
    return storage()?.getItem(FLAG) === "1";
  } catch {
    return false;
  }
}

export function setRemembering(on: boolean): void {
  try {
    if (on) storage()?.setItem(FLAG, "1");
    else storage()?.removeItem(FLAG);
  } catch {
    // Blocked storage: the preference just doesn't survive this visit.
  }
}

/**
 * Guest names, dropped on the way to disk.
 *
 * `Reservation.guestName` is parsed from the CSV but nothing reads it — it is
 * not shown, not counted, and not in the tax export. Writing it would be the
 * only time the most personal column in the file touched storage, so it is
 * removed here rather than stored against a use that doesn't exist.
 */
export function stripGuestNames(data: ParsedData): ParsedData {
  return {
    ...data,
    reservations: data.reservations.map((stay) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { guestName, ...rest } = stay;
      return rest as Reservation;
    }),
  };
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      // Another tab holds an older version open; this visit stays in memory.
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Does this look like something the importers produced? */
function valid(record: unknown): record is SavedRecord {
  if (!record || typeof record !== "object") return false;
  const r = record as Partial<SavedRecord>;
  if (r.version !== RECORD_VERSION) return false;
  if (!(r.savedAt instanceof Date) || Number.isNaN(r.savedAt.getTime())) return false;
  const d = r.data;
  if (!d || typeof d !== "object") return false;
  return Array.isArray(d.reservations) && Array.isArray(d.payouts);
}

export async function saveData(data: ParsedData): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    const record: SavedRecord = {
      version: RECORD_VERSION,
      savedAt: new Date(),
      data: stripGuestNames(data),
    };
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(record, RECORD_KEY);
      tx.oncomplete = () => resolve();
      // Over quota, most likely. The import still works for this visit.
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    // Structured clone refused the value, or the store vanished.
  } finally {
    db.close();
  }
}

/** The remembered import, or null if there is none or it isn't readable. */
export async function loadSavedData(): Promise<RestoredSession | null> {
  const db = await openDb();
  if (!db) return null;
  try {
    const record = await new Promise<unknown>((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(RECORD_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      tx.onabort = () => resolve(null);
    });
    if (!valid(record)) return null;
    return { data: record.data, savedAt: record.savedAt };
  } catch {
    return null;
  } finally {
    db.close();
  }
}

export async function clearSavedData(): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    // Nothing to clear.
  } finally {
    db.close();
  }
}
