import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import { NAV_SECTIONS, PROJECTS } from "../data";
import { sfx } from "../lib/audio";

export interface PaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenProject: (id: string) => void;
  audioOn: boolean;
  onToggleAudio: () => void;
}

interface Cmd {
  id: string;
  kind: "NAV" | "UNIT" | "SYS";
  label: string;
  hint: string;
  run: () => void;
}

export default function CommandPalette({ open, onClose, onOpenProject, audioOn, onToggleAudio }: PaletteProps) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const reduced = useReducedMotion();

  const cmds = useMemo<Cmd[]>(
    () => [
      ...NAV_SECTIONS.map((s) => ({
        id: `nav-${s.id}`,
        kind: "NAV" as const,
        label: s.label,
        hint: `SECTION ${s.code}`,
        run: () => {
          document.getElementById(s.id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
        },
      })),
      ...PROJECTS.map((p) => ({
        id: `unit-${p.id}`,
        kind: "UNIT" as const,
        label: `Inspect ${p.codename}`,
        hint: p.classification,
        run: () => onOpenProject(p.id),
      })),
      {
        id: "sys-audio",
        kind: "SYS",
        label: audioOn ? "Disable interface audio" : "Enable interface audio",
        hint: "TOGGLE SFX",
        run: onToggleAudio,
      },
      {
        id: "sys-top",
        kind: "SYS",
        label: "Return to telemetry root",
        hint: "SCROLL TOP",
        run: () => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }),
      },
    ],
    [audioOn, onOpenProject, onToggleAudio, reduced],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return cmds;
    return cmds.filter((c) => c.label.toLowerCase().includes(needle) || c.hint.toLowerCase().includes(needle));
  }, [cmds, q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        sfx("close");
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => (filtered.length ? (a + 1) % filtered.length : 0));
        sfx("tick");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (filtered.length ? (a - 1 + filtered.length) % filtered.length : 0));
        sfx("tick");
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[active];
        if (cmd) {
          sfx("click");
          cmd.run();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, active, onClose]);

  useEffect(() => {
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const KIND_TONE: Record<Cmd["kind"], string> = {
    NAV: "text-cyan border-cyan/40",
    UNIT: "text-mint border-mint/40",
    SYS: "text-amber border-amber/40",
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <div
            className="absolute inset-0 bg-void/75 backdrop-blur-sm"
            onClick={() => {
              sfx("close");
              onClose();
            }}
          />
          <motion.div
            className="relative w-full max-w-xl border border-linehi bg-abyss shadow-[0_0_60px_rgba(56,225,255,0.08)]"
            initial={reduced ? false : { opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <Search className="h-4 w-4 text-cyan" aria-hidden="true" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="query: section, unit, system command…"
                className="w-full bg-transparent font-mono text-sm text-ink outline-none placeholder:text-faint"
                aria-label="Command palette search"
              />
              <kbd className="border border-line px-1.5 py-0.5 font-mono text-[9px] text-faint">ESC</kbd>
            </div>

            <ul ref={listRef} className="max-h-72 overflow-y-auto py-1.5">
              {filtered.length === 0 && (
                <li className="px-4 py-6 text-center font-mono text-[11px] tracking-[0.2em] text-faint">
                  NO SIGNAL — 0 RESULTS FOR “{q.toUpperCase()}”
                </li>
              )}
              {filtered.map((c, i) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      sfx("click");
                      c.run();
                      onClose();
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full items-center gap-3 border-l-2 px-4 py-2.5 text-left transition-colors ${
                      i === active
                        ? "border-cyan bg-raise/80"
                        : "border-transparent hover:bg-raise/40"
                    }`}
                  >
                    <span
                      className={`border px-1.5 py-0.5 font-mono text-[8px] tracking-[0.2em] ${KIND_TONE[c.kind]}`}
                    >
                      {c.kind}
                    </span>
                    <span className={`font-mono text-[13px] ${i === active ? "text-ink" : "text-dim"}`}>
                      {c.label}
                    </span>
                    <span className="ml-auto font-mono text-[9px] tracking-[0.18em] text-faint">{c.hint}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-5 border-t border-line px-4 py-2.5 font-mono text-[9px] tracking-[0.2em] text-faint">
              <span>↑↓ NAVIGATE</span>
              <span>↵ SELECT</span>
              <span>ESC DISMISS</span>
              <span className="ml-auto text-cyan/70">{filtered.length} SIGNALS</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
