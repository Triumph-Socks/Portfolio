import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ACCENT_TEXT,
  KIND_HEX,
  STATUS_HEX,
  layoutNodes,
  PROJECTS,
  type Project,
} from "../data";
import { sfx } from "../lib/audio";
import { Chip, Corners, SectionHead } from "./ui";

/* ------------ miniature blueprint schematic ------------ */

export function Schematic({ project, className = "" }: { project: Project; className?: string }) {
  const laid = layoutNodes(project);
  const byId = new Map(laid.map((n) => [n.id, n]));
  const P = (n: (typeof laid)[number]) => ({ x: 10 + n.nx * 234, y: 12 + n.ny * 92 });
  const accent = KIND_HEX[project.nodes[2]?.kind ?? "service"];

  return (
    <svg viewBox="0 0 300 130" className={className} aria-hidden="true" fill="none">
      {project.edges.map((e, i) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        const pa = P(a);
        const pb = P(b);
        return (
          <line
            key={i}
            x1={pa.x + 18}
            y1={pa.y + 8}
            x2={pb.x + 18}
            y2={pb.y + 8}
            stroke={i === 0 ? accent : "#2a4a56"}
            strokeOpacity={i === 0 ? 0.8 : 0.55}
            strokeWidth="1"
            className="flow-dash"
          />
        );
      })}
      {laid.map((n) => {
        const p = P(n);
        return (
          <g key={n.id}>
            <rect x={p.x} y={p.y} width="36" height="16" rx="2" fill="#0b151c" stroke={KIND_HEX[n.kind]} strokeOpacity="0.75" />
            <circle cx={p.x + 31} cy={p.y + 4.5} r="1.6" fill={KIND_HEX[n.kind]} />
          </g>
        );
      })}
    </svg>
  );
}

/* ------------ status helpers ------------ */

const STATUS_TEXT: Record<Project["status"], string> = {
  ACTIVE: "text-mint",
  STABLE: "text-cyan",
  ARCHIVED: "text-dim",
};
const STATUS_LED: Record<Project["status"], string> = {
  ACTIVE: "mint",
  STABLE: "cyan",
  ARCHIVED: "dim",
};

/* ------------ card ------------ */

function ProjectCard({
  p,
  wide,
  onInspect,
}: {
  p: Project;
  wide: boolean;
  onInspect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => {
        sfx("open");
        onInspect(p.id);
      }}
      onMouseEnter={() => sfx("hover")}
      aria-label={`Open inspector for ${p.codename}`}
      className="group relative flex h-full w-full flex-col overflow-hidden border border-line bg-panel/70 text-left backdrop-blur-sm transition-all duration-300 hover:border-cyan/55 hover:bg-raise/80 hover:glow-soft"
    >
      <span className="blueprint-bg pointer-events-none absolute inset-0 opacity-35" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan/[0.07] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      <Corners tone="border-faint/70 group-hover:border-cyan/70" />

      <div className={`relative flex flex-1 flex-col p-6 ${wide ? "md:grid md:grid-cols-[1.15fr_1fr] md:gap-8" : ""}`}>
        <div className="flex flex-col">
          <div className="mb-5 flex items-start justify-between">
            <span className="font-display text-5xl font-bold leading-none text-faint/35 transition-colors duration-300 group-hover:text-cyan/30">
              {p.index}
            </span>
            <span
              className={`mt-1 flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] ${STATUS_TEXT[p.status]}`}
            >
              <span
                className="led-pulse inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: STATUS_HEX[p.status], color: STATUS_HEX[p.status] }}
              />
              {p.status}
            </span>
          </div>

          <p className="font-mono text-[10px] tracking-[0.3em] text-cyan/80">{p.classification}</p>
          <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink transition-colors duration-300 group-hover:text-cyan xl:text-3xl">
            {p.codename}
          </h3>
          <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-faint">{p.year}</p>
          <p className="mt-4 text-sm leading-relaxed text-dim">{p.summary}</p>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {p.tech.slice(0, wide ? 7 : 4).map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
            {p.tech.length > (wide ? 7 : 4) && (
              <Chip accent>+{p.tech.length - (wide ? 7 : 4)}</Chip>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-line pt-4 font-mono text-[10px] tracking-[0.25em] text-dim">
            <span className={`font-semibold ${ACCENT_TEXT[p.accent]}`}>
              OPEN INSPECTOR ⌁
            </span>
            <span className="text-faint">{p.nodes.length} NODES / {p.edges.length} LINKS</span>
          </div>
        </div>

        {/* schematic preview */}
        <div
          className={`relative mt-6 border border-line/70 bg-abyss/70 p-3 transition-colors duration-300 group-hover:border-cyan/30 ${
            wide ? "md:mt-0 md:self-center" : ""
          }`}
        >
          <span className="absolute left-2 top-1.5 font-mono text-[8px] tracking-[0.3em] text-faint">
            SCHEMATIC — REV {p.index}
          </span>
          <Schematic project={p} className={`w-full ${wide ? "h-44" : "h-28"} pt-3`} />
        </div>
      </div>
    </button>
  );
}

/* ------------ section ------------ */

const SPANS = [
  "col-span-12 md:col-span-7",
  "col-span-12 md:col-span-5",
  "col-span-12 md:col-span-5",
  "col-span-12 md:col-span-7",
  "col-span-12",
];

export default function Projects({ onInspect }: { onInspect: (id: string) => void }) {
  const reduced = useReducedMotion();
  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
  const item: Variants = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section id="schematics" className="relative mx-auto w-full max-w-[1440px] scroll-mt-16 px-4 py-20 sm:px-6 lg:py-28">
      <SectionHead
        code="02"
        kicker="ARCHITECTURAL SCHEMATICS"
        title="PROJECT MATRIX"
        desc="Five production systems, drawn as their own architecture. Open any unit to pull live telemetry, node flow and benchmark traces."
      />

      <motion.div
        className="grid grid-cols-12 gap-4"
        variants={container}
        initial={reduced ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
      >
        {PROJECTS.map((p, i) => (
          <motion.div key={p.id} variants={item} className={SPANS[i % SPANS.length]}>
            <ProjectCard p={p} wide={i === PROJECTS.length - 1} onInspect={onInspect} />
          </motion.div>
        ))}
      </motion.div>

      <p className="mt-6 text-center font-mono text-[10px] tracking-[0.3em] text-faint">
        5 SCHEMATICS IN BUFFER — <span className="text-cyan/70">CLICK ANY UNIT TO OPEN LIVE INSPECTOR</span>
      </p>
    </section>
  );
}
