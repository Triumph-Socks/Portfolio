import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LOGS, type LogEntry } from "../data";
import { sfx } from "../lib/audio";
import { Reveal, SectionHead } from "./ui";

const CATS: { id: "ALL" | LogEntry["category"]; label: string }[] = [
  { id: "ALL", label: "ALL" },
  { id: "DATA", label: "DATA ENGINEERING" },
  { id: "FULLSTACK", label: "FULL-STACK DEV" },
  { id: "UIUX", label: "UI/UX SYSTEMS" },
  { id: "RESEARCH", label: "RESEARCH" },
];

const TYPE_STYLE: Record<LogEntry["type"], string> = {
  DEPLOY: "text-cyan border-cyan/40",
  SHIP: "text-mint border-mint/40",
  RESEARCH: "text-amber border-amber/40",
  INCIDENT: "text-alert border-alert/40",
  PROMO: "text-ink border-ink/25",
  PATCH: "text-dim border-line",
};

const DOT_HEX: Record<LogEntry["type"], string> = {
  DEPLOY: "#38e1ff",
  SHIP: "#3ddc97",
  RESEARCH: "#ffb02e",
  INCIDENT: "#ff5470",
  PROMO: "#d9e7ea",
  PATCH: "#7e99a1",
};

export default function EventLog() {
  const [cat, setCat] = useState<(typeof CATS)[number]["id"]>("ALL");

  const filtered = useMemo(
    () => (cat === "ALL" ? LOGS : LOGS.filter((l) => l.category === cat)),
    [cat],
  );

  const countFor = (id: (typeof CATS)[number]["id"]) =>
    id === "ALL" ? LOGS.length : LOGS.filter((l) => l.category === id).length;

  return (
    <section id="logs" className="relative border-t border-line bg-abyss/40">
      <div className="mx-auto w-full max-w-[1440px] scroll-mt-16 px-4 py-20 sm:px-6 lg:py-28">
        <SectionHead
          code="03"
          kicker="SYSTEM EVENT LOGS"
          title="CAREER TELEMETRY"
          desc="Chronological event stream — deployments, shipments, research and the 3 a.m. incidents that taught the most."
        />

        {/* terminal header */}
        <Reveal>
          <div className="border border-line bg-panel/70">
            <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-alert/70" />
              <span className="h-2 w-2 rounded-full bg-amber/70" />
              <span className="h-2 w-2 rounded-full bg-mint/70" />
              <span className="ml-2 font-mono text-[11px] text-dim">
                <span className="text-mint">visitor@grid</span>
                <span className="text-faint">:~$</span> tail -f /var/log/career.log
              </span>
              <span className="ml-auto font-mono text-[10px] tracking-[0.2em] text-faint">
                {filtered.length} EVENTS / BUFFER FULL
              </span>
            </div>

            {/* filters */}
            <div className="flex flex-wrap gap-2 border-b border-line px-4 py-3">
              {CATS.map((c) => {
                const active = cat === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      sfx("click");
                      setCat(c.id);
                    }}
                    onMouseEnter={() => sfx("tick")}
                    aria-pressed={active}
                    className={`border px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] transition-all duration-200 ${
                      active
                        ? "border-cyan/60 bg-cyan/10 text-cyan glow-soft"
                        : "border-line bg-abyss/60 text-dim hover:border-cyan/40 hover:text-ink"
                    }`}
                  >
                    {c.label} <span className={active ? "text-mint" : "text-faint"}>{countFor(c.id)}</span>
                  </button>
                );
              })}
            </div>

            {/* log rows */}
            <ul className="relative divide-y divide-line/60">
              <span className="absolute bottom-4 top-4 hidden w-px bg-line sm:left-[10.4rem] sm:block" aria-hidden="true" />
              <AnimatePresence mode="popLayout" initial={false}>
                {filtered.map((log) => (
                  <motion.li
                    key={log.ts + log.title}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="group relative grid grid-cols-1 gap-2 px-4 py-4 transition-colors duration-200 hover:bg-cyan/[0.04] sm:grid-cols-[132px_110px_1fr] sm:gap-5 sm:px-6"
                  >
                    <span
                      className="absolute top-1/2 hidden h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-abyss transition-transform duration-200 group-hover:scale-125 sm:left-[10.05rem] sm:block"
                      style={{ backgroundColor: DOT_HEX[log.type] }}
                      aria-hidden="true"
                    />
                    <span className="whitespace-nowrap font-mono text-[11px] leading-5 text-faint">{log.ts}</span>
                    <span>
                      <span
                        className={`inline-block border px-2 py-0.5 font-mono text-[9px] tracking-[0.2em] ${TYPE_STYLE[log.type]}`}
                      >
                        {log.type}
                      </span>
                    </span>
                    <span>
                      <span className="block font-display text-[15px] font-semibold leading-snug text-ink transition-colors group-hover:text-cyan">
                        {log.title}
                      </span>
                      <span className="mt-1 block max-w-2xl text-sm leading-relaxed text-dim">
                        {log.detail}
                      </span>
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
