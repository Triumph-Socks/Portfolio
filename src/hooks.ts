import { useEffect, useState } from "react";

/** Ticking UTC wall clock, e.g. "14:32:07Z" */
export function useClockUTC(intervalMs = 1000): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(now.getUTCHours())}:${p(now.getUTCMinutes())}:${p(now.getUTCSeconds())}Z`;
}

/** Session uptime since mount, "HH:MM:SS" */
export function useUptime(): string {
  const [s, setS] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setS((v) => v + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

/** Simulated drifting latency readout */
export function useJitter(base: number, spread: number, intervalMs = 2200): number {
  const [v, setV] = useState(base);
  useEffect(() => {
    const id = window.setInterval(
      () => setV(Math.round(base + Math.random() * spread)),
      intervalMs,
    );
    return () => window.clearInterval(id);
  }, [base, spread, intervalMs]);
  return v;
}
