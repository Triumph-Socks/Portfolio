import { useEffect, useRef, useState } from "react";
import { Pause, Play, Plus, RotateCcw, Zap } from "lucide-react";
import { sfx } from "../lib/audio";
import { Led, Reveal, SectionHead } from "./ui";

/* ---------------- force-directed node lab ---------------- */

interface PNode {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: number;
}
interface PLink {
  a: number;
  b: number;
}

const TYPES = [
  { name: "INGEST", color: "#38e1ff" },
  { name: "PROCESS", color: "#3ddc97" },
  { name: "STORE", color: "#ffb02e" },
  { name: "RELAY", color: "#d9e7ea" },
];

function seedCluster(w: number, h: number): { nodes: PNode[]; links: PLink[] } {
  const nodes: PNode[] = [];
  const links: PLink[] = [];
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = Math.min(w, h) * 0.28;
    nodes.push({
      id: i,
      x: w / 2 + Math.cos(a) * r * (0.6 + Math.random() * 0.5),
      y: h / 2 + Math.sin(a) * r * (0.6 + Math.random() * 0.5),
      vx: (Math.random() - 0.5) * 1.4,
      vy: (Math.random() - 0.5) * 1.4,
      type: i % TYPES.length,
    });
    if (i > 0) links.push({ a: i, b: Math.floor(Math.random() * i) });
  }
  for (let i = 0; i < 6; i++) {
    links.push({
      a: Math.floor(Math.random() * n),
      b: Math.floor(Math.random() * n),
    });
  }
  return { nodes, links: links.filter((l) => l.a !== l.b) };
}

export default function Playground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<PNode[]>([]);
  const linksRef = useRef<PLink[]>([]);
  const nextIdRef = useRef(100);
  const dragRef = useRef<PNode | null>(null);
  const pausedRef = useRef(false);
  const sizeRef = useRef({ w: 600, h: 440 });
  const mouseRef = useRef({ x: -9999, y: -9999 });

  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState({ nodes: 0, links: 0, temp: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let { nodes, links } = seedCluster(600, 440);
    nodesRef.current = nodes;
    linksRef.current = links;

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      sizeRef.current = { w: r.width, h: r.height };
      canvas.width = Math.floor(r.width * dpr);
      canvas.height = Math.floor(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    nodes = seedCluster(sizeRef.current.w, sizeRef.current.h).nodes;
    nodesRef.current = nodes;

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const step = () => {
      const { w, h } = sizeRef.current;
      const ns = nodesRef.current;
      const ls = linksRef.current;

      if (!pausedRef.current) {
        // pairwise repulsion
        for (let i = 0; i < ns.length; i++) {
          for (let j = i + 1; j < ns.length; j++) {
            const a = ns[i];
            const b = ns[j];
            let dx = a.x - b.x;
            let dy = a.y - b.y;
            let d2 = dx * dx + dy * dy;
            if (d2 < 1) {
              dx = Math.random() - 0.5;
              dy = Math.random() - 0.5;
              d2 = 1;
            }
            if (d2 < 160 * 160) {
              const d = Math.sqrt(d2);
              const f = 260 / d2;
              const fx = (dx / d) * f;
              const fy = (dy / d) * f;
              a.vx += fx;
              a.vy += fy;
              b.vx -= fx;
              b.vy -= fy;
            }
          }
        }
        // springs
        for (const l of ls) {
          const a = ns.find((x) => x.id === l.a);
          const b = ns.find((x) => x.id === l.b);
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.max(1, Math.hypot(dx, dy));
          const f = (d - 92) * 0.012;
          const fx = (dx / d) * f;
          const fy = (dy / d) * f;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
        // gravity + integrate
        for (const nd of ns) {
          nd.vx += (w / 2 - nd.x) * 0.0012;
          nd.vy += (h / 2 - nd.y) * 0.0012;
          nd.vx *= 0.88;
          nd.vy *= 0.88;
          if (dragRef.current === nd) {
            nd.vx = 0;
            nd.vy = 0;
            continue;
          }
          nd.x += nd.vx;
          nd.y += nd.vy;
          nd.x = Math.max(14, Math.min(w - 14, nd.x));
          nd.y = Math.max(14, Math.min(h - 14, nd.y));
        }
      }

      // draw
      ctx.clearRect(0, 0, w, h);
      for (const l of ls) {
        const a = ns.find((x) => x.id === l.a);
        const b = ns.find((x) => x.id === l.b);
        if (!a || !b) continue;
        ctx.strokeStyle = "rgba(56,225,255,0.14)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (const nd of ns) {
        const t = TYPES[nd.type];
        const hovered = Math.hypot(nd.x - mouseRef.current.x, nd.y - mouseRef.current.y) < 16;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = hovered || dragRef.current === nd ? 18 : 9;
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, hovered ? 7.5 : 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(4,8,11,0.9)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    // stats poll
    const statId = window.setInterval(() => {
      const ns = nodesRef.current;
      const avg =
        ns.reduce((s, n) => s + Math.hypot(n.vx, n.vy), 0) / Math.max(1, ns.length);
      setStats({ nodes: ns.length, links: linksRef.current.length, temp: Math.round(avg * 100) });
    }, 400);

    // pointer interaction
    const toLocal = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onDown = (e: PointerEvent) => {
      const p = toLocal(e);
      const hit = nodesRef.current.find((n) => Math.hypot(n.x - p.x, n.y - p.y) < 16);
      if (hit) {
        dragRef.current = hit;
        canvas.setPointerCapture(e.pointerId);
        sfx("click");
      }
    };
    const onMove = (e: PointerEvent) => {
      const p = toLocal(e);
      mouseRef.current = p;
      if (dragRef.current) {
        dragRef.current.x = p.x;
        dragRef.current.y = p.y;
        dragRef.current.vx = 0;
        dragRef.current.vy = 0;
        canvas.style.cursor = "grabbing";
      } else {
        const hit = nodesRef.current.some((n) => Math.hypot(n.x - p.x, n.y - p.y) < 16);
        canvas.style.cursor = hit ? "grab" : "crosshair";
      }
    };
    const onUp = () => {
      dragRef.current = null;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", () => {
      mouseRef.current = { x: -9999, y: -9999 };
      dragRef.current = null;
    });

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(statId);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
    };
  }, []);

  /* ---- controls ---- */
  const addNode = () => {
    sfx("click");
    const { w, h } = sizeRef.current;
    const ns = nodesRef.current;
    const id = nextIdRef.current++;
    const node: PNode = {
      id,
      x: w / 2 + (Math.random() - 0.5) * 120,
      y: h / 2 + (Math.random() - 0.5) * 120,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      type: id % TYPES.length,
    };
    ns.push(node);
    if (ns.length > 1) {
      const target = ns[Math.floor(Math.random() * (ns.length - 1))];
      linksRef.current.push({ a: id, b: target.id });
      if (Math.random() > 0.5 && ns.length > 2) {
        const t2 = ns[Math.floor(Math.random() * (ns.length - 1))];
        if (t2.id !== id && t2.id !== target.id) linksRef.current.push({ a: id, b: t2.id });
      }
    }
  };

  const reheat = () => {
    sfx("open");
    for (const n of nodesRef.current) {
      n.vx += (Math.random() - 0.5) * 9;
      n.vy += (Math.random() - 0.5) * 9;
    }
  };

  const togglePause = () => {
    sfx("click");
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  };

  const reset = () => {
    sfx("close");
    const { w, h } = sizeRef.current;
    const seeded = seedCluster(w, h);
    nodesRef.current = seeded.nodes;
    linksRef.current = seeded.links;
    nextIdRef.current = 100;
    pausedRef.current = false;
    setPaused(false);
  };

  const btn =
    "flex items-center gap-2 border border-line bg-panel/80 px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-dim transition-colors hover:border-cyan/60 hover:text-cyan";

  return (
    <section id="playground" className="relative mx-auto w-full max-w-[1440px] scroll-mt-16 px-4 py-20 sm:px-6 lg:py-28">
      <SectionHead
        code="04"
        kicker="LIVE PLAYGROUND"
        title="NODE LAB"
        desc="A real force-directed simulation running in your browser — drag nodes, inject load, reheat the cluster. This is the same physics that powers SYNAPSE."
      />

      <Reveal>
        <div className="relative border border-line bg-panel/60">
          {/* console header */}
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
            <span className="mr-2 flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-mint">
              <Led color="mint" /> SIM RUNNING
            </span>
            <button className={btn} onClick={addNode}>
              <Plus className="h-3 w-3" aria-hidden="true" /> INJECT NODE
            </button>
            <button className={btn} onClick={reheat}>
              <Zap className="h-3 w-3" aria-hidden="true" /> REHEAT
            </button>
            <button className={btn} onClick={togglePause} aria-pressed={paused}>
              {paused ? <Play className="h-3 w-3" aria-hidden="true" /> : <Pause className="h-3 w-3" aria-hidden="true" />}
              {paused ? "RESUME" : "PAUSE"}
            </button>
            <button className={btn} onClick={reset}>
              <RotateCcw className="h-3 w-3" aria-hidden="true" /> RESET
            </button>
            <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[10px] tracking-[0.18em] text-dim">
              <span>
                NODES <span className="text-cyan">{stats.nodes}</span>
              </span>
              <span>
                LINKS <span className="text-cyan">{stats.links}</span>
              </span>
              <span>
                TEMP <span className={stats.temp > 250 ? "text-amber" : "text-mint"}>{stats.temp}</span>
              </span>
            </div>
          </div>

          <div ref={wrapRef} className="relative h-[380px] w-full overflow-hidden sm:h-[440px]">
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" aria-label="Interactive force-directed node graph" />
            <span className="pointer-events-none absolute bottom-3 left-4 font-mono text-[9px] tracking-[0.3em] text-faint">
              DRAG NODES · PHYSICS LIVE · SPRING K=0.012
            </span>
            <span className="pointer-events-none absolute right-4 top-3 font-mono text-[9px] tracking-[0.3em] text-faint">
              SANDBOX 04-A
            </span>
          </div>

          {/* legend */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line px-4 py-3 font-mono text-[9px] tracking-[0.2em] text-dim">
            {TYPES.map((t) => (
              <span key={t.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color, boxShadow: `0 0 8px ${t.color}` }} />
                {t.name}
              </span>
            ))}
            <span className="ml-auto text-faint">REPEL 260 / REST 92PX / DAMP 0.88</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
