import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Github, Linkedin, Mail, ArrowUpRight } from "lucide-react";
import { OPERATOR } from "../data";
import { sfx } from "../lib/audio";
import { Corners, Led, Reveal, SectionHead } from "./ui";

type Phase = "idle" | "tx" | "done";

const TX_LINES = [
  "ENCRYPTING PAYLOAD — AES-256-GCM ......... OK",
  "ROUTING VIA MAIL RELAY 04 (FRA) .......... OK",
  "TRANSMITTED — ACK 200 OK",
];

const CHANNELS = [
  { label: "GITHUB", handle: "@kvasquez-sys", href: OPERATOR.github, Icon: Github },
  { label: "LINKEDIN", handle: "/in/kai-vasquez", href: OPERATOR.linkedin, Icon: Linkedin },
  { label: "DIRECT MAIL", handle: OPERATOR.email, href: `mailto:${OPERATOR.email}`, Icon: Mail },
];

interface Errors {
  callsign?: string;
  freq?: string;
  payload?: string;
}

export default function Contact() {
  const [callsign, setCallsign] = useState("");
  const [freq, setFreq] = useState("");
  const [payload, setPayload] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [phase, setPhase] = useState<Phase>("idle");
  const [txStep, setTxStep] = useState(0);
  const [txId, setTxId] = useState("");
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const validate = (): boolean => {
    const next: Errors = {};
    if (callsign.trim().length < 2) next.callsign = "ERR: callsign too short (min 2 chars)";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(freq)) next.freq = "ERR: invalid return frequency — expected addr@domain.tld";
    if (payload.trim().length < 10) next.payload = "ERR: payload below minimum size (10 chars)";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const transmit = (e: FormEvent) => {
    e.preventDefault();
    if (phase !== "idle") return;
    if (!validate()) {
      sfx("error");
      return;
    }
    sfx("click");
    setTxId(`TX-${Math.random().toString(16).slice(2, 7).toUpperCase()}`);
    setPhase("tx");
    setTxStep(0);
    TX_LINES.forEach((_, i) => {
      timersRef.current.push(
        window.setTimeout(() => {
          setTxStep(i + 1);
          sfx("tick");
          if (i === TX_LINES.length - 1) {
            timersRef.current.push(
              window.setTimeout(() => {
                setPhase("done");
                sfx("success");
              }, 550),
            );
          }
        }, 620 * (i + 1)),
      );
    });
  };

  const resetForm = () => {
    sfx("close");
    setPhase("idle");
    setTxStep(0);
    setCallsign("");
    setFreq("");
    setPayload("");
    setErrors({});
  };

  const inputCls = (bad?: string) =>
    `w-full border-b bg-transparent py-2 font-mono text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-cyan ${
      bad ? "border-alert/70" : "border-line"
    }`;

  return (
    <section id="link" className="relative border-t border-line bg-abyss/40">
      <div className="mx-auto w-full max-w-[1440px] scroll-mt-16 px-4 py-20 sm:px-6 lg:py-28">
        <SectionHead
          code="05"
          kicker="DIRECT SIGNAL LINK"
          title="ESTABLISH CONTACT"
          desc="One operator, no gatekeepers. Validate a transmission below or hit a direct channel — acknowledgement inside 24 hours."
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* channels */}
          <Reveal className="lg:col-span-5">
            <div className="flex h-full flex-col gap-3">
              {CHANNELS.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith("mailto") ? undefined : "_blank"}
                  rel="noreferrer"
                  onClick={() => sfx("click")}
                  onMouseEnter={() => sfx("hover")}
                  className="group relative flex items-center gap-4 border border-line bg-panel/70 px-5 py-4 transition-all duration-300 hover:border-cyan/60 hover:bg-raise hover:glow-soft"
                >
                  <Corners tone="border-transparent group-hover:border-cyan/50" size="h-2 w-2" />
                  <c.Icon className="h-5 w-5 text-cyan" aria-hidden="true" />
                  <span className="font-display text-sm font-semibold tracking-[0.18em] text-ink transition-colors group-hover:text-cyan">
                    {c.label}
                  </span>
                  <span className="ml-auto font-mono text-[11px] text-dim">{c.handle}</span>
                  <ArrowUpRight
                    className="h-4 w-4 text-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan"
                    aria-hidden="true"
                  />
                </a>
              ))}

              <div className="mt-4 border border-line bg-panel/70 p-5 font-mono text-[11px] leading-6 text-dim">
                <p className="flex items-center gap-2 text-mint">
                  <Led color="mint" /> OPEN TO STAFF-LEVEL CONTRACTS
                </p>
                <p className="mt-3 text-faint">
                  PGP <span className="text-dim">{OPERATOR.pgp}</span>
                </p>
                <p className="text-faint">
                  TIMEZONE <span className="text-dim">CET (UTC+1) — async-first</span>
                </p>
                <p className="text-faint">
                  SLA <span className="text-dim">ACK &lt; 24H</span>
                </p>
              </div>
            </div>
          </Reveal>

          {/* terminal form */}
          <Reveal delay={0.12} className="lg:col-span-7">
            <div className="relative border border-linehi bg-abyss">
              <Corners />
              <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-alert/70" />
                <span className="h-2 w-2 rounded-full bg-amber/70" />
                <span className="h-2 w-2 rounded-full bg-mint/70" />
                <span className="ml-3 font-mono text-[10px] tracking-[0.25em] text-faint">
                  uplink.sh — {OPERATOR.email}
                </span>
              </div>

              <form onSubmit={transmit} className="px-5 py-6 font-mono text-sm sm:px-7" noValidate>
                <p className="text-dim">
                  <span className="text-mint">visitor@grid</span>
                  <span className="text-faint">:~$</span> ./uplink --operator="K. VASQUEZ"
                </p>

                {phase !== "done" && (
                  <>
                    <div className="mt-7">
                      <label htmlFor="callsign" className="text-[10px] tracking-[0.25em] text-dim">
                        <span className="text-cyan">&gt;</span> CALLSIGN / NAME
                      </label>
                      <input
                        id="callsign"
                        value={callsign}
                        onChange={(e) => setCallsign(e.target.value)}
                        placeholder="operator identity"
                        className={inputCls(errors.callsign)}
                        autoComplete="name"
                      />
                      <AnimatePresence>
                        {errors.callsign && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-1.5 text-[11px] text-alert"
                          >
                            {errors.callsign}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="mt-6">
                      <label htmlFor="freq" className="text-[10px] tracking-[0.25em] text-dim">
                        <span className="text-cyan">&gt;</span> RETURN FREQUENCY / EMAIL
                      </label>
                      <input
                        id="freq"
                        type="email"
                        value={freq}
                        onChange={(e) => setFreq(e.target.value)}
                        placeholder="you@station.dev"
                        className={inputCls(errors.freq)}
                        autoComplete="email"
                      />
                      <AnimatePresence>
                        {errors.freq && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-1.5 text-[11px] text-alert"
                          >
                            {errors.freq}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="mt-6">
                      <label htmlFor="payload" className="text-[10px] tracking-[0.25em] text-dim">
                        <span className="text-cyan">&gt;</span> PAYLOAD / MESSAGE
                      </label>
                      <textarea
                        id="payload"
                        value={payload}
                        onChange={(e) => setPayload(e.target.value)}
                        placeholder="describe the system you need built…"
                        rows={4}
                        className={`${inputCls(errors.payload)} resize-none leading-relaxed`}
                      />
                      <AnimatePresence>
                        {errors.payload && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-1.5 text-[11px] text-alert"
                          >
                            {errors.payload}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <button
                        type="submit"
                        disabled={phase === "tx"}
                        onMouseEnter={() => sfx("hover")}
                        className="group flex items-center gap-3 border border-cyan/50 bg-cyan/10 px-6 py-3 font-display text-sm font-semibold tracking-[0.22em] text-cyan transition-all duration-300 hover:bg-cyan/20 hover:glow-soft disabled:opacity-60"
                      >
                        {phase === "tx" ? "TRANSMITTING…" : "TRANSMIT ▸"}
                        <span className={`h-1.5 w-1.5 rounded-full bg-cyan ${phase === "tx" ? "led-pulse" : ""}`} />
                      </button>
                      <span className="text-[10px] tracking-[0.2em] text-faint">
                        ENCRYPTED IN TRANSIT — NO TRACKERS ON THIS GRID
                      </span>
                    </div>

                    {phase === "tx" && (
                      <div className="mt-7 border-t border-line pt-4 text-[12px] leading-6">
                        {TX_LINES.slice(0, txStep).map((l, i) => (
                          <motion.p
                            key={l}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={i === TX_LINES.length - 1 ? "text-mint" : "text-dim"}
                          >
                            <span className="mr-2 text-cyan">[{txId}]</span>
                            {l}
                          </motion.p>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {phase === "done" && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-7"
                  >
                    <div className="border border-mint/40 bg-mint/5 p-6">
                      <p className="flex items-center gap-3 font-display text-lg font-bold tracking-[0.12em] text-mint">
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.4" />
                          <path d="M8 12.5l2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        SIGNAL RECEIVED
                      </p>
                      <p className="mt-3 text-[12px] leading-6 text-dim">
                        <span className="text-mint">[{txId}]</span> payload acknowledged by operator relay.
                        Expect return transmission at <span className="text-ink">{freq}</span> within 24 hours.
                      </p>
                      <button
                        type="button"
                        onClick={resetForm}
                        onMouseEnter={() => sfx("hover")}
                        className="mt-5 border border-line px-4 py-2 text-[11px] tracking-[0.2em] text-dim transition-colors hover:border-cyan/60 hover:text-cyan"
                      >
                        ⟲ TRANSMIT AGAIN
                      </button>
                    </div>
                  </motion.div>
                )}
              </form>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
