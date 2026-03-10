/**
 * Offline Queue — stores pending meal analyses in localStorage when offline.
 *
 * When the user takes a photo or enters a description while offline,
 * we save it to a queue. When connectivity returns, the app can process
 * queued items automatically.
 */

const STORAGE_KEY = "plate2offset_offline_queue";

export interface QueuedMeal {
  id: string;
  description: string;
  photoBase64: string | null;
  queuedAt: number; // ms since epoch
}

function readQueue(): QueuedMeal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedMeal[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function getQueue(): QueuedMeal[] {
  return readQueue().sort((a, b) => a.queuedAt - b.queuedAt);
}

export function enqueue(description: string, photoBase64: string | null): QueuedMeal {
  const queue = readQueue();
  const item: QueuedMeal = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    description,
    photoBase64,
    queuedAt: Date.now(),
  };
  queue.push(item);
  writeQueue(queue);
  return item;
}

export function dequeue(id: string): void {
  const queue = readQueue().filter((item) => item.id !== id);
  writeQueue(queue);
}

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}
