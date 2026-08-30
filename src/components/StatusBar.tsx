import { Volume2, VolumeX, TerminalSquare } from "lucide-react";
import { useClockUTC, useJitter, useUptime } from "../hooks";
import { sfx } from "../lib/audio";
import { Led } from "./ui";

interface Props {
  audioOn: boolean;
  onToggleAudio: () => void;
  onPalette: () => void;
}

export default function StatusBar({ audioOn, onToggleAudio, onPalette }: Props) {
  const clock = useClockUTC();
  const uptime = useUptime();
  const latency = useJitter(14, 22);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-void/85 backdrop-blur-md">
      <div className="mx-auto flex h-10 w-full max-w-[1440px] items-center gap-4 px-4 sm:px-6">
        {/* identity */}
        <a href="#telemetry" className="flex items-center gap-2.5" onClick={() => sfx("click")}>
          <span className="relative grid h-5 w-5 place-items-center">
            <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
              <circle cx="5" cy="6" r="2" fill="#38e1ff" />
              <circle cx="15" cy="5" r="1.6" fill="#3ddc97" />
              <circle cx="13" cy="15" r="2" fill="#ffb02e" />
              <path d="M5 6L15 5L13 15L5 6Z" stroke="#38e1ff" strokeOpacity="0.5" fill="none" />
            </svg>
          </span>
          <span className="font-display text-sm font-bold tracking-[0.2em] text-ink">
            SYS<span className="text-cyan">.</span>MONITOR
          </span>
          <span className="hidden font-mono text-[10px] text-faint md:inline">v3.2.1</span>
        </a>

        <span className="hidden items-center gap-2 border-l border-line pl-4 font-mono text-[10px] tracking-[0.2em] text-mint sm:flex">
          <Led color="mint" /> SYSTEM NOMINAL
        </span>

        {/* live readouts */}
        <div className="ml-auto flex items-center gap-4 font-mono text-[10px] tracking-[0.15em] text-dim sm:gap-5">
          <span className="hidden items-center gap-1.5 lg:flex">
            <span className="text-faint">LAT</span>
            <span className={latency > 30 ? "text-amber" : "text-cyan"}>{latency}ms</span>
          </span>
          <span className="hidden items-center gap-1.5 md:flex">
            <span className="text-faint">UP</span>
            <span className="text-ink">{uptime}</span>
          </span>
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="text-faint">UTC</span>
            <span className="text-ink">{clock}</span>
          </span>
          <span className="hidden items-center gap-1.5 text-mint lg:flex">
            <Led color="cyan" size="h-1 w-1" /> STREAMS ACTIVE
          </span>

          {/* command palette */}
          <button
            onClick={() => {
              sfx("open");
              onPalette();
            }}
            className="flex items-center gap-1.5 border border-line bg-panel/80 px-2 py-1 text-dim transition-colors hover:border-cyan/60 hover:text-cyan"
            aria-label="Open command palette"
          >
            <TerminalSquare className="h-3 w-3" aria-hidden="true" />
            <span className="hidden sm:inline">CMD</span>
            <kbd className="border border-line px-1 text-[9px]">K</kbd>
          </button>

          {/* audio toggle */}
          <button
            onClick={() => {
              onToggleAudio();
            }}
            className={`flex items-center gap-1.5 border px-2 py-1 transition-colors ${
              audioOn
                ? "border-cyan/40 bg-cyan/5 text-cyan"
                : "border-line bg-panel/80 text-faint hover:text-dim"
            }`}
            aria-label={audioOn ? "Mute interface audio" : "Enable interface audio"}
            aria-pressed={audioOn}
          >
            {audioOn ? (
              <Volume2 className="h-3 w-3" aria-hidden="true" />
            ) : (
              <VolumeX className="h-3 w-3" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{audioOn ? "SFX ON" : "SFX OFF"}</span>
          </button>
        </div>
      </div>
      {/* hairline telemetry strip */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />
    </header>
  );
}
