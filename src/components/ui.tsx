import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { sfx } from "../lib/audio";

/* ---------------- Scramble / decode text ---------------- */

const GLYPHS = "▓▒░<>/\\+#*:=10";

export function Scramble({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const [out, setOut] = useState(text.replace(/[^ ]/g, "\u00A0"));

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setOut(text);
      return;
    }
    let raf = 0;
    let frame = 0;
    const total = 26;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      if (now < start) {
        raf = requestAnimationFrame(tick);
        return;
      }
      frame += 1;
      const prog = frame / total;
      const reveal = Math.floor(prog * text.length);
      let s = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === " ") s += " ";
        else s += i < reveal ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setOut(s);
      if (prog < 1) raf = requestAnimationFrame(tick);
      else setOut(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, text, reduced, delay]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      {out}
    </span>
  );
}

/* ---------------- Animated counter ---------------- */

export function Counter({
  to,
  decimals = 0,
  suffix = "",
  prefix = "",
  duration = 1300,
  className = "",
}: {
  to: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const reduced = useReducedMotion();
  const [v, setV] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setV(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, reduced, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {v.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ---------------- LED status dot ---------------- */

export function Led({ color = "mint", size = "h-1.5 w-1.5" }: { color?: string; size?: string }) {
  const map: Record<string, string> = {
    mint: "text-mint",
    cyan: "text-cyan",
    amber: "text-amber",
    alert: "text-alert",
    dim: "text-dim",
  };
  return (
    <span
      aria-hidden="true"
      className={`led-pulse inline-block rounded-full bg-current ${size} ${map[color] ?? "text-mint"}`}
    />
  );
}

/* ---------------- Corner brackets ---------------- */

export function Corners({ tone = "border-cyan/50", size = "h-3 w-3" }: { tone?: string; size?: string }) {
  const c = `pointer-events-none absolute ${size} ${tone}`;
  return (
    <span aria-hidden="true">
      <span className={`${c} left-0 top-0 border-l border-t`} />
      <span className={`${c} right-0 top-0 border-r border-t`} />
      <span className={`${c} bottom-0 left-0 border-b border-l`} />
      <span className={`${c} bottom-0 right-0 border-b border-r`} />
    </span>
  );
}

/* ---------------- Tech chip ---------------- */

export function Chip({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      onMouseEnter={() => sfx("tick")}
      className={`inline-block border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] transition-colors duration-200 ${
        accent
          ? "border-cyan/40 bg-cyan/5 text-cyan"
          : "border-line bg-abyss/60 text-dim hover:border-cyan/50 hover:text-cyan"
      }`}
    >
      {children}
    </span>
  );
}

/* ---------------- Section header ---------------- */

export function SectionHead({
  code,
  kicker,
  title,
  desc,
}: {
  code: string;
  kicker: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative mb-10 border-t border-line pt-6 md:mb-14">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 font-mono text-[11px] tracking-[0.35em] text-cyan/80">
            <span className="text-faint">//</span> {code} · {kicker}
          </p>
          <h2 className="font-display text-3xl font-bold leading-none tracking-tight text-ink sm:text-4xl lg:text-5xl">
            <Scramble text={title} />
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-dim md:text-right">{desc}</p>
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-px left-0 h-px w-24 bg-gradient-to-r from-cyan to-transparent"
      />
    </div>
  );
}

/* ---------------- Marquee ticker ---------------- */

export function Ticker({ items }: { items: string[] }) {
  return (
    <div className="relative overflow-hidden border-y border-line bg-abyss/70 py-3">
      <div className="marquee-track flex w-max">
        {[0, 1].map((half) => (
          <div key={half} className="flex items-center gap-10 pr-10" aria-hidden={half === 1}>
            {items.map((it, i) => (
              <span
                key={`${half}-${i}`}
                className="whitespace-nowrap font-mono text-[11px] tracking-[0.3em] text-dim"
              >
                <span className="mr-3 text-cyan/70">▸</span>
                {it}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-void to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-void to-transparent" />
    </div>
  );
}

/* ---------------- Reveal wrapper ---------------- */

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
