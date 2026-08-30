/* ============================================================
 * SYS.MONITOR — central data model
 * All telemetry content (projects, event logs, navigation)
 * is authored here so components stay purely presentational.
 * ============================================================ */

export type NodeKind = "client" | "edge" | "service" | "data" | "cache" | "ext";

export interface ArchNode {
  id: string;
  label: string;
  kind: NodeKind;
  tier: number; // 0..3  → left-to-right flow column
  slot: number; // 0..3  → vertical lane inside a tier
}

export interface ArchEdge {
  from: string;
  to: string;
}

export interface ProjectMetric {
  label: string;
  value: number;
  suffix: string;
  target: number; // bar/gauge full-scale reference
  kind: "gauge" | "bar";
  decimals?: number;
}

export type Accent = "cyan" | "mint" | "amber";

export interface Project {
  id: string;
  index: string;
  codename: string;
  classification: string;
  status: "ACTIVE" | "STABLE" | "ARCHIVED";
  year: string;
  summary: string;
  description: string;
  accent: Accent;
  tech: string[];
  metrics: ProjectMetric[];
  nodes: ArchNode[];
  edges: ArchEdge[];
  links: { label: string; href: string }[];
}

export interface LogEntry {
  ts: string;
  type: "DEPLOY" | "SHIP" | "RESEARCH" | "INCIDENT" | "PROMO" | "PATCH";
  category: "DATA" | "FULLSTACK" | "UIUX" | "RESEARCH";
  title: string;
  detail: string;
}

/* ---------- layout helper: normalized node positions ---------- */

export interface LaidNode extends ArchNode {
  nx: number; // 0..1 horizontal
  ny: number; // 0..1 vertical
}

export function layoutNodes(p: Project): LaidNode[] {
  const maxT = Math.max(...p.nodes.map((n) => n.tier));
  const maxS = Math.max(...p.nodes.map((n) => n.slot), 1);
  return p.nodes.map((n) => ({
    ...n,
    nx: maxT === 0 ? 0 : n.tier / maxT,
    ny: n.slot / maxS,
  }));
}

/* ---------- accent + status color maps ---------- */

export const ACCENT_TEXT: Record<Accent, string> = {
  cyan: "text-cyan",
  mint: "text-mint",
  amber: "text-amber",
};
export const ACCENT_HEX: Record<Accent, string> = {
  cyan: "#38e1ff",
  mint: "#3ddc97",
  amber: "#ffb02e",
};
export const KIND_HEX: Record<NodeKind, string> = {
  client: "#d9e7ea",
  edge: "#7e99a1",
  service: "#3ddc97",
  data: "#ffb02e",
  cache: "#38e1ff",
  ext: "#ff5470",
};
export const STATUS_HEX: Record<Project["status"], string> = {
  ACTIVE: "#3ddc97",
  STABLE: "#38e1ff",
  ARCHIVED: "#7e99a1",
};

/* ---------------------------- projects ---------------------------- */

export const PROJECTS: Project[] = [
  {
    id: "pulsegrid",
    index: "01",
    codename: "PULSEGRID",
    classification: "REALTIME INFRA TELEMETRY",
    status: "ACTIVE",
    year: "2024 — NOW",
    accent: "cyan",
    summary:
      "Streaming telemetry platform ingesting 40k events/sec across 300+ nodes, surfacing anomalies to operators in under a second.",
    description:
      "Pulsegrid replaces a legacy polling stack with a push-first pipeline: edge gateways pre-aggregate host metrics, a stream processor applies windowed anomaly detection, and the operator console renders live topology over WebSocket fan-out. The hot path holds a 50ms p95 latency budget end-to-end, enforced by synthetic probes in CI.",
    tech: ["Next.js", "WebSockets", "TimescaleDB", "Redis", "Grafana SDK", "Tailwind", "Zod"],
    metrics: [
      { label: "P95 INGEST LATENCY", value: 12, suffix: "ms", target: 50, kind: "bar" },
      { label: "EVENT THROUGHPUT", value: 40, suffix: "k/s", target: 50, kind: "bar" },
      { label: "LIGHTHOUSE", value: 98, suffix: "", target: 100, kind: "gauge" },
      { label: "UPTIME 90D", value: 99.98, suffix: "%", target: 100, kind: "gauge", decimals: 2 },
    ],
    nodes: [
      { id: "console", label: "OPERATOR CONSOLE", kind: "client", tier: 0, slot: 1 },
      { id: "gateway", label: "EDGE GATEWAY", kind: "edge", tier: 1, slot: 1 },
      { id: "stream", label: "STREAM PROCESSOR", kind: "service", tier: 2, slot: 1 },
      { id: "tsdb", label: "TIMESCALEDB", kind: "data", tier: 3, slot: 0 },
      { id: "redis", label: "REDIS RING", kind: "cache", tier: 3, slot: 1 },
      { id: "relay", label: "ALERT RELAY", kind: "ext", tier: 3, slot: 2 },
    ],
    edges: [
      { from: "console", to: "gateway" },
      { from: "gateway", to: "stream" },
      { from: "stream", to: "tsdb" },
      { from: "stream", to: "redis" },
      { from: "stream", to: "relay" },
      { from: "tsdb", to: "console" },
    ],
    links: [
      { label: "LIVE DEPLOY", href: "https://pulsegrid.vasquez.systems" },
      { label: "SOURCE", href: "https://github.com/kvasquez-sys/pulsegrid" },
    ],
  },
  {
    id: "ledgerline",
    index: "02",
    codename: "LEDGERLINE",
    classification: "OFFLINE-FIRST FIELD OPS",
    status: "STABLE",
    year: "2023",
    accent: "mint",
    summary:
      "Field-capture PWA for remote survey teams: 100% offline capture with CRDT-merged sync and an SMS uplink fallback for dead zones.",
    description:
      "Surveyors in zero-connectivity zones log observations into an IndexedDB vault; a sync orchestrator reconciles with the server over CRDT deltas whenever a link exists, and degrades to compressed SMS uplink as a last mile. 1,200 devices deployed across 14 regions with zero recorded data-loss events.",
    tech: ["React", "Service Workers", "IndexedDB", "Yjs / CRDT", "PostgreSQL", "Mapbox GL", "Vite"],
    metrics: [
      { label: "OFFLINE CAPTURE", value: 100, suffix: "%", target: 100, kind: "gauge" },
      { label: "SYNC VELOCITY", value: 480, suffix: "ops/s", target: 600, kind: "bar" },
      { label: "COLD LOAD", value: 1.2, suffix: "s", target: 3, kind: "bar", decimals: 1 },
      { label: "LIGHTHOUSE", value: 97, suffix: "", target: 100, kind: "gauge" },
    ],
    nodes: [
      { id: "pwa", label: "FIELD PWA", kind: "client", tier: 0, slot: 0 },
      { id: "idb", label: "INDEXEDDB VAULT", kind: "cache", tier: 1, slot: 0 },
      { id: "orch", label: "SYNC ORCHESTRATOR", kind: "service", tier: 2, slot: 1 },
      { id: "pg", label: "POSTGRESQL", kind: "data", tier: 3, slot: 1 },
      { id: "sms", label: "SMS UPLINK", kind: "ext", tier: 3, slot: 2 },
    ],
    edges: [
      { from: "pwa", to: "idb" },
      { from: "pwa", to: "orch" },
      { from: "idb", to: "orch" },
      { from: "orch", to: "pg" },
      { from: "orch", to: "sms" },
    ],
    links: [
      { label: "CASE FILE", href: "https://github.com/kvasquez-sys/ledgerline" },
      { label: "FIELD REPORT", href: "https://vasquez.systems/writing/ledgerline" },
    ],
  },
  {
    id: "synapse",
    index: "03",
    codename: "SYNAPSE",
    classification: "KNOWLEDGE GRAPH EXPLORER",
    status: "ACTIVE",
    year: "2025",
    accent: "amber",
    summary:
      "WebGL force-graph explorer rendering 120k-node research corpora with semantic clustering at a locked 60fps.",
    description:
      "Synapse streams a Neo4j citation fabric into partitioned d3-force workers, then renders the layout with a custom GLSL point/edge pipeline. Semantic clusters are precomputed server-side and surfaced as hull overlays, letting researchers traverse a decade of corpus in a single viewport without LOD pop-in.",
    tech: ["React Three Fiber", "d3-force", "Neo4j", "Web Workers", "GLSL", "Zustand"],
    metrics: [
      { label: "NODES @ 60FPS", value: 120, suffix: "k", target: 150, kind: "gauge" },
      { label: "CLUSTER RECALL", value: 94, suffix: "%", target: 100, kind: "gauge" },
      { label: "FRAME BUDGET", value: 11.8, suffix: "ms", target: 16, kind: "bar", decimals: 1 },
      { label: "GPU MEMORY", value: 310, suffix: "MB", target: 512, kind: "bar" },
    ],
    nodes: [
      { id: "explorer", label: "GRAPH EXPLORER", kind: "client", tier: 0, slot: 1 },
      { id: "workers", label: "FORCE WORKERS", kind: "service", tier: 1, slot: 0 },
      { id: "gl", label: "WEBGL RENDERER", kind: "service", tier: 1, slot: 2 },
      { id: "api", label: "QUERY EDGE", kind: "edge", tier: 2, slot: 1 },
      { id: "neo", label: "NEO4J FABRIC", kind: "data", tier: 3, slot: 1 },
    ],
    edges: [
      { from: "explorer", to: "workers" },
      { from: "explorer", to: "gl" },
      { from: "workers", to: "gl" },
      { from: "explorer", to: "api" },
      { from: "api", to: "neo" },
      { from: "workers", to: "api" },
    ],
    links: [
      { label: "LIVE DEMO", href: "https://synapse.vasquez.systems" },
      { label: "SOURCE", href: "https://github.com/kvasquez-sys/synapse" },
    ],
  },
  {
    id: "forge",
    index: "04",
    codename: "FORGE",
    classification: "PIPELINE ORCHESTRATOR",
    status: "STABLE",
    year: "2022",
    accent: "cyan",
    summary:
      "CI/CD control plane scheduling 12k builds/month across hybrid runners with predictive artifact caching.",
    description:
      "Forge's scheduler models the build graph as a DAG, predicts artifact reuse from historical fingerprints, and warms runner caches before demand. Queue p50 dropped from 38s to 4.1s after rollout; the Go control plane gossips state over NATS with a React control surface for pipeline surgeons.",
    tech: ["Go", "gRPC", "Kubernetes", "NATS", "React", "Recharts", "Terraform"],
    metrics: [
      { label: "BUILDS / MONTH", value: 12.4, suffix: "k", target: 15, kind: "bar", decimals: 1 },
      { label: "CACHE HIT RATE", value: 87, suffix: "%", target: 100, kind: "gauge" },
      { label: "QUEUE P50", value: 4.1, suffix: "s", target: 10, kind: "bar", decimals: 1 },
      { label: "MTTR", value: 6, suffix: "min", target: 15, kind: "bar" },
    ],
    nodes: [
      { id: "dash", label: "CONTROL PLANE UI", kind: "client", tier: 0, slot: 1 },
      { id: "sched", label: "DAG SCHEDULER", kind: "service", tier: 1, slot: 1 },
      { id: "nats", label: "NATS BUS", kind: "service", tier: 2, slot: 0 },
      { id: "runners", label: "HYBRID RUNNERS", kind: "edge", tier: 2, slot: 2 },
      { id: "cache", label: "ARTIFACT CACHE", kind: "cache", tier: 3, slot: 0 },
      { id: "k8s", label: "K8S STATE", kind: "data", tier: 3, slot: 2 },
    ],
    edges: [
      { from: "dash", to: "sched" },
      { from: "sched", to: "nats" },
      { from: "sched", to: "runners" },
      { from: "nats", to: "runners" },
      { from: "runners", to: "cache" },
      { from: "runners", to: "k8s" },
    ],
    links: [
      { label: "ARCHITECTURE RFC", href: "https://vasquez.systems/writing/forge-rfc" },
      { label: "SOURCE", href: "https://github.com/kvasquez-sys/forge" },
    ],
  },
  {
    id: "echobase",
    index: "05",
    codename: "ECHOBASE",
    classification: "REALTIME COLLAB CANVAS",
    status: "ARCHIVED",
    year: "2021",
    accent: "mint",
    summary:
      "CRDT-backed collaborative whiteboard with presence mesh, voice hints, and lossless offline merge — 256 concurrent editors per room.",
    description:
      "Echobase pairs a WebRTC SFU presence mesh with a Yjs document core so every stroke, sticky and cursor survives partitions. The canvas engine was rewritten to a tile-based renderer that held 60fps through 30k production sessions before the project was sunset and its merge layer donated upstream.",
    tech: ["WebRTC", "Yjs", "Fastify", "Canvas API", "Redis Pub/Sub", "React"],
    metrics: [
      { label: "CONCURRENT EDITORS", value: 256, suffix: "", target: 300, kind: "bar" },
      { label: "SYNC ROUNDTRIP", value: 48, suffix: "ms", target: 100, kind: "bar" },
      { label: "SESSIONS SERVED", value: 30, suffix: "k", target: 40, kind: "bar" },
      { label: "MERGE INTEGRITY", value: 100, suffix: "%", target: 100, kind: "gauge" },
    ],
    nodes: [
      { id: "canvas", label: "CANVAS CLIENT", kind: "client", tier: 0, slot: 0 },
      { id: "presence", label: "PRESENCE MESH", kind: "client", tier: 0, slot: 2 },
      { id: "rtc", label: "WEBRTC SFU", kind: "edge", tier: 1, slot: 1 },
      { id: "crdt", label: "CRDT MERGER", kind: "service", tier: 2, slot: 1 },
      { id: "redis", label: "REDIS PUB/SUB", kind: "cache", tier: 3, slot: 0 },
      { id: "pg", label: "PG JOURNAL", kind: "data", tier: 3, slot: 2 },
    ],
    edges: [
      { from: "canvas", to: "rtc" },
      { from: "presence", to: "rtc" },
      { from: "rtc", to: "crdt" },
      { from: "crdt", to: "redis" },
      { from: "crdt", to: "pg" },
    ],
    links: [
      { label: "CASE FILE", href: "https://github.com/kvasquez-sys/echobase" },
      { label: "POSTMORTEM", href: "https://vasquez.systems/writing/echobase-sunset" },
    ],
  },
];

/* --------------------------- event logs --------------------------- */

export const LOGS: LogEntry[] = [
  {
    ts: "2025-11-02 14:32:07",
    type: "DEPLOY",
    category: "DATA",
    title: "Pulsegrid v3 cutover — zero-downtime migration of 2.1B rows",
    detail:
      "Dual-write bridge held p95 under budget through a 6-hour backfill; old cluster drained and decommissioned with no operator-visible blip.",
  },
  {
    ts: "2025-08-14 09:05:41",
    type: "RESEARCH",
    category: "RESEARCH",
    title: "Published: “Latency Budgets for Edge Telemetry” (SysTelemetry ’25)",
    detail:
      "Field study of 14 edge fleets; proposes a budget-split model adopted internally across three product teams.",
  },
  {
    ts: "2025-05-30 18:22:10",
    type: "SHIP",
    category: "FULLSTACK",
    title: "Synapse graph explorer → public beta",
    detail:
      "120k-node WebGL explorer opened to 400 research seats; week-one feedback drove hull-overlay clustering v2.",
  },
  {
    ts: "2025-02-11 11:47:56",
    type: "PROMO",
    category: "FULLSTACK",
    title: "Promoted → Staff Systems Engineer, Helios Labs",
    detail:
      "Scope expanded to cross-team architecture review and the internal latency-budget guild.",
  },
  {
    ts: "2024-09-19 03:12:33",
    type: "INCIDENT",
    category: "DATA",
    title: "Mitigated cascade failure in Redis ring — MTTR 6m04s",
    detail:
      "Hot-shard eviction storm contained by pre-staged read replicas; postmortem added automated shard rebalancing.",
  },
  {
    ts: "2024-06-07 15:30:02",
    type: "SHIP",
    category: "UIUX",
    title: "ATLAS design system v2 — 140 components, 9 themes",
    detail:
      "Token pipeline rebuilt on CSS layers; contrast regression tests now block CI on every component PR.",
  },
  {
    ts: "2024-01-25 10:18:45",
    type: "RESEARCH",
    category: "RESEARCH",
    title: "Internal paper: CRDT merge strategies under long partitions",
    detail:
      "Benchmarked 5 merge policies across 72h simulated partitions; tombstone-free RGA variant selected for Ledgerline v2.",
  },
  {
    ts: "2023-10-03 07:55:19",
    type: "SHIP",
    category: "FULLSTACK",
    title: "Ledgerline field rollout — 1,200 devices, 14 regions",
    detail:
      "Zero data-loss events across 9 months of offline-first operation; SMS uplink used 3.1% of the time, as modeled.",
  },
  {
    ts: "2023-03-18 21:09:44",
    type: "DEPLOY",
    category: "DATA",
    title: "Kafka → NATS migration complete, infra spend −38%",
    detail:
      "Replaced 11-topic cluster with NATS JetStream; consumer lag SLOs tightened from 5s to 800ms.",
  },
  {
    ts: "2022-08-22 13:41:28",
    type: "SHIP",
    category: "FULLSTACK",
    title: "Forge orchestrator → GA across all product orgs",
    detail:
      "12k builds/month scheduled with 87% predictive cache hits; queue p50 cut from 38s to 4.1s.",
  },
  {
    ts: "2021-12-05 17:26:51",
    type: "PATCH",
    category: "UIUX",
    title: "Echobase canvas engine rewrite — locked 60fps at 256 editors",
    detail:
      "Tile-based renderer replaced DOM compositing; frame budget variance dropped 74%.",
  },
  {
    ts: "2020-04-16 12:00:00",
    type: "RESEARCH",
    category: "RESEARCH",
    title: "M.Sc. thesis defended: adaptive sampling in sensor meshes",
    detail:
      "Energy-aware sampling schedules extended mesh lifetime 2.3× in simulation; dataset released publicly.",
  },
  {
    ts: "2019-07-09 09:00:00",
    type: "PROMO",
    category: "FULLSTACK",
    title: "Joined Helios Labs — Platform Engineering pod",
    detail:
      "First rotation: on-call for the ingest tier; wrote the runbooks still in use today.",
  },
];

/* ----------------------------- navigation ----------------------------- */

export interface NavSection {
  id: string;
  code: string;
  label: string;
}

export const NAV_SECTIONS: NavSection[] = [
  { id: "telemetry", code: "01", label: "Central Telemetry" },
  { id: "schematics", code: "02", label: "Architectural Schematics" },
  { id: "logs", code: "03", label: "System Event Logs" },
  { id: "playground", code: "04", label: "Live Node Lab" },
  { id: "link", code: "05", label: "Direct Signal Link" },
];

export const TICKER_ITEMS: string[] = [
  "NEXT.JS", "TYPESCRIPT", "GO", "WEBSOCKETS", "WEBGL / GLSL", "POSTGRESQL",
  "TIMESCALEDB", "REDIS", "NATS", "KUBERNETES", "D3-FORCE", "YJS / CRDT",
  "SERVICE WORKERS", "INDEXEDDB", "REACT THREE FIBER", "TERRAFORM", "FRAMER MOTION",
];

export const OPERATOR = {
  name: "KAI VASQUEZ",
  role: "FULL-STACK SYSTEMS ENGINEER",
  email: "kai@vasquez.systems",
  github: "https://github.com/kvasquez-sys",
  linkedin: "https://www.linkedin.com/in/kai-vasquez",
  pgp: "4F2A 99C1 0B7E D3A8 61E0  2C47 88BD 05F3 A91E 77C2",
};
