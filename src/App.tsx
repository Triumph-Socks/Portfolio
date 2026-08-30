import { useCallback, useEffect, useState } from "react";
import { PROJECTS, TICKER_ITEMS } from "./data";
import { setSfxEnabled, sfx } from "./lib/audio";
import StatusBar from "./components/StatusBar";
import Hero from "./components/Hero";
import Projects from "./components/Projects";
import Inspector from "./components/Inspector";
import EventLog from "./components/EventLog";
import Playground from "./components/Playground";
import Contact from "./components/Contact";
import CommandPalette from "./components/CommandPalette";
import Footer from "./components/Footer";
import { Ticker } from "./components/ui";

/* layered ambient background: grid, glows, CRT scanlines, sweep beam */
function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div className="bg-gridlines absolute inset-0 opacity-60" />
      <div className="absolute -top-48 left-[-12%] h-[46rem] w-[46rem] rounded-full bg-cyan/[0.05] blur-[140px]" />
      <div className="absolute bottom-[-22%] right-[-12%] h-[44rem] w-[44rem] rounded-full bg-mint/[0.04] blur-[150px]" />
      <div className="absolute right-[18%] top-[30%] h-[26rem] w-[26rem] rounded-full bg-amber/[0.025] blur-[120px]" />
      <div className="crt-overlay absolute inset-0" />
      <div className="scan-beam absolute inset-x-0 top-0 h-32" />
    </div>
  );
}

export default function App() {
  const [audioOn, setAudioOn] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setSfxEnabled(audioOn);
  }, [audioOn]);

  /* global hotkey: CMD/CTRL + K */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => {
          sfx(o ? "close" : "open");
          return !o;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleAudio = useCallback(() => {
    const next = !audioOn;
    if (audioOn) sfx("close");
    setSfxEnabled(next);
    setAudioOn(next);
    if (next) window.setTimeout(() => sfx("open"), 40);
  }, [audioOn]);

  const openProject = useCallback((id: string) => {
    sfx("open");
    setActiveId(id);
  }, []);

  const closeInspector = useCallback(() => setActiveId(null), []);

  const activeProject = PROJECTS.find((p) => p.id === activeId) ?? null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-void font-body text-ink">
      <BackgroundFX />

      <div className="relative z-10">
        <StatusBar
          audioOn={audioOn}
          onToggleAudio={toggleAudio}
          onPalette={() => setPaletteOpen(true)}
        />

        <main>
          <Hero />
          <Ticker items={TICKER_ITEMS} />
          <Projects onInspect={openProject} />
          <EventLog />
          <Playground />
          <Contact />
        </main>

        <Footer />
      </div>

      <Inspector project={activeProject} onClose={closeInspector} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenProject={openProject}
        audioOn={audioOn}
        onToggleAudio={toggleAudio}
      />
    </div>
  );
}
