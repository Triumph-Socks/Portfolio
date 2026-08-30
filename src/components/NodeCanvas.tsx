import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

interface CNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  c: string;
  tw: number;
}

/**
 * Ambient telemetry mesh — drifting data nodes that link up when close
 * and lean toward the cursor. Renders a single static frame when the
 * user prefers reduced motion.
 */
export default function NodeCanvas({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999 };
    let nodes: CNode[] = [];
    const palette = ["56,225,255", "61,220,151", "126,153,161"];

    const seed = () => {
      const count = Math.max(36, Math.min(90, Math.floor((w * h) / 17000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: 1 + Math.random() * 1.7,
        c: palette[Math.floor(Math.random() * palette.length)],
        tw: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const linkDist = 132;

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 240 * 240 && d2 > 1) {
          const d = Math.sqrt(d2);
          const f = (1 - d / 240) * 0.022;
          n.vx += (dx / d) * f;
          n.vy += (dy / d) * f;
        }
        n.vx *= 0.985;
        n.vy *= 0.985;
        const sp = Math.hypot(n.vx, n.vy);
        if (sp > 0.62) {
          n.vx *= 0.62 / sp;
          n.vy *= 0.62 / sp;
        }
        if (n.x < -24) n.x = w + 24;
        if (n.x > w + 24) n.x = -24;
        if (n.y < -24) n.y = h + 24;
        if (n.y > h + 24) n.y = -24;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < linkDist) {
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const near = Math.hypot(mx - mouse.x, my - mouse.y) < 190;
            const alpha = (1 - d / linkDist) * (near ? 0.5 : 0.15);
            ctx.strokeStyle = `rgba(${near ? "56,225,255" : "96,144,158"},${alpha})`;
            ctx.lineWidth = near ? 1 : 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        const near = Math.hypot(n.x - mouse.x, n.y - mouse.y) < 190;
        const twinkle = 0.55 + 0.45 * Math.sin(t / 900 + n.tw);
        ctx.fillStyle = `rgba(${n.c},${near ? 0.95 : 0.22 + 0.45 * twinkle})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, near ? n.r + 1 : n.r, 0, Math.PI * 2);
        ctx.fill();
        if (near) {
          ctx.strokeStyle = `rgba(${n.c},0.22)`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (reduced) {
      draw(0);
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
