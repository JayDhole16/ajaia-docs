"use client";

import { useSyncExternalStore } from "react";

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 7],
  ["week", 4.35],
  ["month", 12],
  ["year", Infinity],
];

export function formatRelative(date: Date, now = Date.now()): string {
  let value = (date.getTime() - now) / 1000;
  for (const [unit, size] of STEPS) {
    if (Math.abs(value) < size) {
      return unit === "second" && Math.abs(value) < 45 ? "just now" : rtf.format(Math.round(value), unit);
    }
    value /= size;
  }
  return date.toLocaleDateString();
}

const subscribe = () => () => {};

/** Relative time computed in the browser (server time zone / clock would differ). */
export function TimeAgo({ iso }: { iso: string }) {
  const label = useSyncExternalStore(
    subscribe,
    () => formatRelative(new Date(iso)),
    () => new Date(iso).toISOString().slice(0, 10),
  );
  return (
    <time dateTime={iso} title={new Date(iso).toUTCString()}>
      {label}
    </time>
  );
}
