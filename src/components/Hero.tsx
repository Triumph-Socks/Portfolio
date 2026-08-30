import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import NodeCanvas from "./NodeCanvas";
import { sfx } from "../lib/audio";
import { Corners, Counter, Led, Reveal } from "./ui";

/* ------- boot sequence ------- */
const BOOT_LINES = [
  { p: "$", text: "init telemetry-link --secure", tone: "text-ink" },
  { p: ">", text: "handshake .................. OK", tone: "text-mint" },
  { p: ">", text: "auth operator: K.VASQUEZ ... GRANTED [L4]", tone: "text-mint" },
  { p: ">", text: "mount portfolio.sys ........ OK (5 schematics / 13 events)", tone: "text-cyan" },
  { p: ">", text: "status: ALL SYSTEMS NOMINAL", tone: "text-mint" },
];

function useBootSequence() {
  const reduced = useReducedMotion();
  const [pos, setPos] = useState({ l: 0, c: 0 });
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (reduced) {
      setPos({ l: BOOT_LINES.length, c: 0 });
      setDone(true);
      return;
    }
    let l = 0;
    let c = 0;
    let stop = false;
    const tick = () => {
      if (stop) return;
      const line = BOOT_LINES[l];
      if (!line) {
        setDone(true);
        return;
      }
      if (c < line.text.length) {
        c += 1;
        setPos({ l, c });
        window.setTimeout(tick, 13 + Math.random() * 24);
      } else if (l < BOOT_LINES.length - 1) {
        l += 1;
        c = 0;
        setPos({ l, c });
        window.setTimeout(tick, 280);
      } else {
        setDone(true);
      }
    };
    const t = window.setTimeout(tick, 600);
    return () => {
      stop = true;
      window.clearTimeout(t);
    };
  }, [reduced]);

  return { pos, done };
}

/* ------- hero ------- */
const METRICS = [
  { label: "YEARS OPERATIONAL", value: 8, decimals: 0, suffix: "", trend: "+1 SINCE 2019" },
  { label: "PIPELINES DEPLOYED", value: 47, decimals: 0, suffix: "", trend: "▲ 12 THIS YEAR" },
  { label: "FLEET UPTIME", value: 99.98, decimals: 2, suffix: "%", trend: "SLO GREEN" },
  { label: "INCIDENTS RESOLVED", value: 23, decimals: 0, suffix: "", trend: "MTTR 6M04S" },
];

const ACTIONS = [
  { code: "01", label: "VIEW SCHEMATICS", href: "#schematics" },
  { code: "02", label: "OPEN EVENT LOGS", href: "#logs" },
  { code: "03", label: "ESTABLISH LINK", href: "#link" },
];

export default function Hero() {
  const { pos, done } = useBootSequence();

  return (
    <section id="telemetry" className="relative flex min-h-screen flex-col overflow-hidden">
      {/* interactive mesh */}
      <NodeCanvas className="absolute inset-0 h-full w-full" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-void/40 via-transparent to-void"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 items-start gap-10 px-4 pb-20 pt-28 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:pt-36">
        {/* left — terminal + vitals */}
        <div className="order-2 lg:order-1 lg:col-span-5">
          <Reveal>
            <div className="relative border border-line bg-abyss/85 backdrop-blur-sm">
              <Corners />
              <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-alert/70" />
                <span className="h-2 w-2 rounded-full bg-amber/70" />
                <span className="h-2 w-2 rounded-full bg-mint/70" />
                <span className="ml-3 font-mono text-[10px] tracking-[0.25em] text-faint">
                  boot.log — /dev/operator
                </span>
              </div>
              <div className="min-h-[168px] px-4 py-4 font-mono text-[12px] leading-relaxed sm:text-[13px]">
                {BOOT_LINES.map((line, i) => {
                  if (i > pos.l) return null;
                  const full = i < pos.l || pos.l >= BOOT_LINES.length;
                  const text = full ? line.text : line.text.slice(0, pos.c);
                  return (
                    <p key={i} className="whitespace-pre-wrap">
                      <span className="mr-2 text-cyan">{line.p}</span>
                      <span className={full ? line.tone : "text-dim"}>{text}</span>
                      {i === pos.l && !done && (
                        <span className="cursor-blink ml-0.5 inline-block h-3.5 w-2 translate-y-0.5 bg-cyan" />
                      )}
                    </p>
                  );
                })}
                {done && (
                  <p>
                    <span className="mr-2 text-cyan">$</span>
                    <span className="cursor-blink inline-block h-3.5 w-2 translate-y-0.5 bg-cyan" />
                  </p>
                )}
              </div>
            </div>
          </Reveal>

          {/* vitals */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {METRICS.map((m, i) => (
              <Reveal key={m.label} delay={0.1 + i * 0.08}>
                <div className="group relative border border-line bg-panel/70 p-4 transition-colors duration-300 hover:border-cyan/50">
                  <Corners tone="border-line group-hover:border-cyan/40" size="h-2 w-2" />
                  <p className="font-display text-3xl font-bold text-ink transition-colors group-hover:text-cyan sm:text-4xl">
                    <Counter to={m.value} decimals={m.decimals} suffix={m.suffix} />
                  </p>
                  <p className="mt-1 font-mono text-[9px] tracking-[0.22em] text-dim">{m.label}</p>
                  <p className="mt-2 font-mono text-[9px] tracking-[0.12em] text-mint/80">{m.trend}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* right — operator identity */}
        <div className="order-1 lg:order-2 lg:col-span-7 lg:pt-2">
          <Reveal delay={0.05}>
            <p className="mb-5 flex items-center gap-3 font-mono text-[11px] tracking-[0.35em] text-cyan/90">
              <span className="inline-block h-px w-10 bg-cyan/60" />
              OPERATOR PROFILE — CLEARANCE LEVEL 4
            </p>
          </Reveal>
          <h1 className="font-display font-bold leading-[0.93] tracking-tight">
            <Reveal delay={0.1}>
              <span className="block text-5xl text-ink sm:text-7xl xl:text-[5.6rem]">KAI VASQUEZ</span>
            </Reveal>
            <Reveal delay={0.2}>
              <span className="font-outline block text-5xl sm:text-7xl xl:text-[5.6rem]">
                FULL-STACK SYSTEMS
              </span>
            </Reveal>
            <Reveal delay={0.3}>
              <span className="glow-mint block text-5xl text-mint sm:text-7xl xl:text-[5.6rem]">
                ENGINEER<span className="cursor-blink text-cyan">_</span>
              </span>
            </Reveal>
          </h1>
          <Reveal delay={0.4}>
            <p className="mt-7 max-w-xl text-[15px] leading-relaxed text-dim">
              I design and operate the unglamorous middle of software — ingest pipelines, sync
              engines, cache tiers and the consoles that keep them observable. Currently holding
              the pager for <span className="text-ink">realtime telemetry at Helios Labs</span>,
              previously field-deployed offline-first capture across 14 regions.
            </p>
          </Reveal>

          <Reveal delay={0.5}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {ACTIONS.map((a) => (
                <a
                  key={a.code}
                  href={a.href}
                  onClick={() => sfx("click")}
                  onMouseEnter={() => sfx("hover")}
                  className="group flex items-center gap-4 border border-line bg-panel/70 px-5 py-3.5 backdrop-blur-sm transition-all duration-300 hover:border-cyan/60 hover:bg-raise hover:glow-soft"
                >
                  <span className="font-mono text-[11px] text-cyan">[{a.code}]</span>
                  <span className="font-display text-sm font-semibold tracking-[0.18em] text-ink transition-colors group-hover:text-cyan">
                    {a.label}
                  </span>
                  <span className="ml-2 text-cyan transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </a>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.62}>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 font-mono text-[10px] tracking-[0.2em] text-dim">
              <span className="flex items-center gap-2">
                <Led color="mint" /> DATA STREAMS ACTIVE
              </span>
              <span className="flex items-center gap-2">
                <Led color="cyan" /> 12 CLUSTERS ONLINE
              </span>
              <span className="flex items-center gap-2">
                <Led color="amber" /> 1 ADVISORY OPEN
              </span>
            </div>
          </Reveal>
        </div>
      </div>

      {/* scroll cue */}
      <div className="relative z-10 mx-auto mb-6 flex w-full max-w-[1440px] items-center gap-3 px-4 sm:px-6">
        <span className="font-mono text-[10px] tracking-[0.3em] text-faint">SCROLL FOR TELEMETRY</span>
        <span className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
        <span className="cursor-blink font-mono text-[10px] text-cyan">▼</span>
      </div>
    </section>
  );
}
