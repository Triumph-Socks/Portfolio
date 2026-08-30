import { NAV_SECTIONS, OPERATOR } from "../data";
import { useClockUTC } from "../hooks";
import { sfx } from "../lib/audio";
import { Led } from "./ui";

export default function Footer() {
  const clock = useClockUTC();
  return (
    <footer className="relative border-t border-line bg-void">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-lg font-bold tracking-[0.2em] text-ink">
            SYS<span className="text-cyan">.</span>MONITOR
          </p>
          <p className="mt-3 max-w-xs font-mono text-[11px] leading-6 text-faint">
            OPERATIONAL TELEMETRY &amp; SYSTEM ARCHITECTURE PORTFOLIO —
            <span className="text-dim"> {OPERATOR.name}</span>, FULL-STACK SYSTEMS ENGINEER.
          </p>
          <p className="mt-4 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-mint">
            <Led color="mint" /> ALL CHANNELS MONITORED
          </p>
        </div>

        <nav className="md:col-span-4" aria-label="Footer navigation">
          <p className="mb-4 font-mono text-[10px] tracking-[0.3em] text-faint">INDEX</p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {NAV_SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={() => sfx("click")}
                  className="group flex items-center gap-2 font-mono text-[11px] tracking-[0.15em] text-dim transition-colors hover:text-cyan"
                >
                  <span className="text-faint transition-colors group-hover:text-cyan">{s.code}</span>
                  {s.label.toUpperCase()}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-3">
          <p className="mb-4 font-mono text-[10px] tracking-[0.3em] text-faint">BUILD MANIFEST</p>
          <dl className="space-y-1.5 font-mono text-[10px] tracking-[0.12em] text-dim">
            <div className="flex justify-between gap-4">
              <dt className="text-faint">STACK</dt>
              <dd>REACT / FRAMER / CANVAS</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-faint">HASH</dt>
              <dd className="text-cyan">0x7F3A·9C21</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-faint">UTC</dt>
              <dd>{clock}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-faint">TEMPLATES</dt>
              <dd className="text-alert">0 USED</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="border-t border-line/70">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-4 font-mono text-[9px] tracking-[0.25em] text-faint sm:px-6">
          <span>© 2026 K. VASQUEZ — DESIGNED &amp; BUILT ON THE OPERATING TABLE</span>
          <span className="flex items-center gap-2">
            END OF STREAM <span className="cursor-blink text-cyan">▮</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
