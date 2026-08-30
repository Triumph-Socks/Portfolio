import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, ExternalLink, Cpu } from "lucide-react";
import {
  ACCENT_HEX,
  KIND_HEX,
  STATUS_HEX,
  layoutNodes,
  type LaidNode,
  type Project,
  type ProjectMetric,
} from "../data";
import { sfx } from "../lib/audio";
import { Chip, Corners, Counter, Led, Scramble } from "./ui";

/* ---------------- architecture diagram ---------------- */

const NW = 148;
const NH = 44;

function ArchDiagram({ project }: { project: Project }) {
  const reduced = useReducedMotion();
  const laid = layoutNodes(project);
  const byId = new Map(laid.map((n) => [n.id, n]));
  const P = (n: LaidNode) => ({
    x: 20 + n.nx * (800 - NW - 40),
    y: 26 + n.ny * (348 - NH - 52),
  });
  const accent = ACCENT_HEX[project.accent];

  const paths = project.edges
    .map((e) => {
      const a = byId.get(e.from);
      const b = byId.get(e.to);
      if (!a || !b) return null;
      const pa = P(a);
      const pb = P(b);
      const forward = b.nx >= a.nx;
      const sx = forward ? pa.x + NW : pa.x;
      const sy = pa.y + NH / 2;
      const ex = forward ? pb.x : pb.x + NW;
      const ey = pb.y + NH / 2;
      const mx = (sx + ex) / 2;
      return { d: `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ey}, ${ex} ${ey}` };
    })
    .filter((x): x is { d: string } => x !== null);

  return (
    <svg viewBox="0 0 800 348" className="w-full" role="img" aria-label={`Architecture diagram for ${project.codename}`}>
      {paths.map((p, i) => (
        <g key={i}>
          <path
            d={p.d}
            fill="none"
            stroke={i === 0 ? accent : "#2a4a56"}
            strokeOpacity={i === 0 ? 0.9 : 0.6}
            strokeWidth="1.3"
            className={reduced ? undefined : "flow-dash"}
          />
          {!reduced && (
            <circle r="3.2" fill={accent} opacity="0.95">
              <animateMotion dur={`${2.3 + i * 0.4}s`} repeatCount="indefinite" path={p.d} />
            </circle>
          )}
        </g>
      ))}
      {laid.map((n) => {
        const p = P(n);
        const k = KIND_HEX[n.kind];
        return (
          <g key={n.id}>
            <rect x={p.x} y={p.y} width={NW} height={NH} rx="3" fill="#0b151c" stroke={k} strokeOpacity="0.7" />
            <rect x={p.x} y={p.y} width="3" height={NH} fill={k} opacity="0.85" />
            <circle cx={p.x + NW - 11} cy={p.y + 11} r="3" fill={k} className={reduced ? undefined : "led-pulse"} />
            <text
              x={p.x + 12}
              y={p.y + 20}
              fontFamily="'IBM Plex Mono', monospace"
              fontSize="11"
              letterSpacing="1"
              fill="#d9e7ea"
            >
              {n.label}
            </text>
            <text
              x={p.x + 12}
              y={p.y + 34}
              fontFamily="'IBM Plex Mono', monospace"
              fontSize="8"
              letterSpacing="2"
              fill="#7e99a1"
            >
              {n.kind.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------------- metric widgets ---------------- */

function Gauge({ m, delay }: { m: ProjectMetric; delay: number }) {
  const reduced = useReducedMotion();
  const pct = Math.min(1, m.value / m.target);
  const C = 2 * Math.PI * 30;
  return (
    <div className="flex items-center gap-4 border border-line bg-abyss/60 p-4">
      <div className="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90">
          <circle cx="38" cy="38" r="30" fill="none" stroke="#162a33" strokeWidth="6" />
          <motion.circle
            cx="38"
            cy="38"
            r="30"
            fill="none"
            stroke="#38e1ff"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: reduced ? C * (1 - pct) : C }}
            animate={{ strokeDashoffset: C * (1 - pct) }}
            transition={{ duration: 1.2, delay, ease: "easeOut" }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-display text-base font-bold text-ink">
          <Counter to={m.value} decimals={m.decimals ?? 0} duration={1200} />
        </span>
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[9px] tracking-[0.2em] text-dim">{m.label}</p>
        <p className="mt-1.5 font-mono text-xs text-cyan">
          {m.value}
          {m.suffix} <span className="text-faint">/ {m.target}{m.suffix}</span>
        </p>
      </div>
    </div>
  );
}

function Bar({ m, delay }: { m: ProjectMetric; delay: number }) {
  const reduced = useReducedMotion();
  const pct = Math.min(100, (m.value / m.target) * 100);
  return (
    <div className="border border-line bg-abyss/60 p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[9px] tracking-[0.2em] text-dim">{m.label}</p>
        <p className="font-mono text-sm text-ink">
          <Counter to={m.value} decimals={m.decimals ?? 0} duration={1100} />
          <span className="text-cyan">{m.suffix}</span>
        </p>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden bg-line/70">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan to-mint"
          initial={{ width: reduced ? `${pct}%` : "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, delay, ease: "easeOut" }}
        />
      </div>
      <p className="mt-2 text-right font-mono text-[9px] tracking-[0.15em] text-faint">
        BUDGET {m.target}
        {m.suffix}
      </p>
    </div>
  );
}

/* deterministic pseudo-random throughput bars */
function Sparkline({ seed }: { seed: number }) {
  const reduced = useReducedMotion();
  let s = seed || 7;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const bars = Array.from({ length: 32 }, () => 25 + rand() * 70);
  return (
    <div className="flex h-16 items-end gap-[3px]">
      {bars.map((b, i) => (
        <motion.div
          key={i}
          className="flex-1 bg-cyan/50"
          initial={{ height: reduced ? `${b}%` : "4%" }}
          animate={{ height: `${b}%` }}
          transition={{ duration: 0.5, delay: i * 0.02, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ---------------- inspector drawer ---------------- */

export default function Inspector({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        sfx("close");
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={`${project.codename} inspector`}>
          <motion.div
            className="absolute inset-0 bg-void/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              sfx("close");
              onClose();
            }}
          />
          <motion.aside
            className="absolute right-0 top-0 h-full w-full max-w-3xl overflow-y-auto border-l border-linehi bg-abyss"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={
              reduced
                ? { duration: 0.01 }
                : { type: "spring", damping: 32, stiffness: 280 }
            }
          >
            {/* header */}
            <div className="sticky top-0 z-10 border-b border-line bg-abyss/95 backdrop-blur-md">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-dim">
                  <span className="text-cyan">INSPECTOR</span>
                  <span className="text-faint">/</span>
                  <span>UNIT-{project.index}</span>
                  <span
                    className="led-pulse ml-2 inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: STATUS_HEX[project.status], color: STATUS_HEX[project.status] }}
                  />
                  <span className="hidden sm:inline">{project.status}</span>
                </div>
                <button
                  onClick={() => {
                    sfx("close");
                    onClose();
                  }}
                  className="flex items-center gap-2 border border-line px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-dim transition-colors hover:border-alert/60 hover:text-alert"
                  aria-label="Close inspector"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" /> CLOSE [ESC]
                </button>
              </div>
            </div>

            <div className="px-6 py-8 sm:px-8">
              <p className="font-mono text-[10px] tracking-[0.3em] text-cyan/80">{project.classification}</p>
              <h3 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                <Scramble text={project.codename} />
              </h3>
              <p className="mt-2 font-mono text-[11px] tracking-[0.2em] text-faint">{project.year}</p>
              <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-dim">{project.description}</p>

              {/* architecture */}
              <div className="relative mt-10 border border-line bg-panel/50 p-4 sm:p-5">
                <Corners tone="border-cyan/40" />
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="flex items-center gap-2 font-display text-sm font-semibold tracking-[0.2em] text-ink">
                    <Cpu className="h-4 w-4 text-cyan" aria-hidden="true" /> NODE FLOW — LIVE TOPOLOGY
                  </h4>
                  <span className="font-mono text-[9px] tracking-[0.2em] text-faint">
                    {project.nodes.length} NODES / {project.edges.length} LINKS
                  </span>
                </div>
                <div className="blueprint-bg overflow-x-auto">
                  <div className="min-w-[640px]">
                    <ArchDiagram project={project} />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-3 font-mono text-[9px] tracking-[0.18em] text-dim">
                  {(Object.keys(KIND_HEX) as (keyof typeof KIND_HEX)[]).map((k) => (
                    <span key={k} className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: KIND_HEX[k] }} />
                      {k.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              {/* metrics */}
              <h4 className="mt-10 font-display text-sm font-semibold tracking-[0.2em] text-ink">
                TELEMETRY / BENCHMARKS
              </h4>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {project.metrics.map((m, i) =>
                  m.kind === "gauge" ? (
                    <Gauge key={m.label} m={m} delay={i * 0.1} />
                  ) : (
                    <Bar key={m.label} m={m} delay={i * 0.1} />
                  ),
                )}
              </div>

              {/* throughput */}
              <div className="mt-3 border border-line bg-abyss/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-mono text-[9px] tracking-[0.2em] text-dim">
                    THROUGHPUT — TRAILING 32 WINDOWS
                  </p>
                  <p className="flex items-center gap-2 font-mono text-[9px] tracking-[0.2em] text-mint">
                    <Led color="mint" size="h-1 w-1" /> STREAMING
                  </p>
                </div>
                <Sparkline seed={project.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)} />
              </div>

              {/* stack */}
              <h4 className="mt-10 font-display text-sm font-semibold tracking-[0.2em] text-ink">STACK MANIFEST</h4>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
              </div>

              {/* links */}
              <h4 className="mt-10 font-display text-sm font-semibold tracking-[0.2em] text-ink">ACCESS CHANNELS</h4>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {project.links.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => sfx("click")}
                    className="group flex flex-1 items-center justify-between border border-line bg-panel/60 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-ink transition-colors hover:border-cyan/60 hover:text-cyan"
                  >
                    {l.label}
                    <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                  </a>
                ))}
              </div>

              <p className="mt-10 border-t border-line pt-5 text-center font-mono text-[9px] tracking-[0.3em] text-faint">
                END OF UNIT-{project.index} DUMP — ESC TO RETURN TO MATRIX
              </p>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
