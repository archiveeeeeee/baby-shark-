import { AppState } from "@/types";

export const storageKey = "babyshark-v1-state";

export const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export function saveState(state: AppState) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

export function loadState(): AppState | null {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

export const money = (amount: number) =>
  new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(amount);

export const dateLabel = (iso: string) =>
  new Intl.DateTimeFormat("fr-BE", { dateStyle: "medium" }).format(new Date(iso));

export const dateTimeLabel = (iso: string) =>
  new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
