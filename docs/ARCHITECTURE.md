# TensorLens — Technical Architecture & Developer Guide

This document defines the locked technology stack, folder structure, pure TypeScript math engine APIs, Lab Plugin SDK, rendering primitives, i18n type-safety contract, and verification infrastructure.

---

## 1. Locked Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Build Tool** | Vite 6 + `@vitejs/plugin-react` | Instant HMR, clean ES module chunking, `base: './'` static Pages output |
| **Language** | TypeScript 5.7+ (`strict: true`, `noUncheckedIndexedAccess: true`) | Compile-time numerical & i18n safety |
| **UI Framework** | React 19 | Modern concurrent rendering, clean hooks |
| **Routing** | `react-router-dom` v7 (`HashRouter`) | Zero-404 deep linking & shareable query URLs on GitHub Pages |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) + Semantic CSS Custom Properties | Fast utility workflow + zero-flicker Dark/Light theme parity |
| **State** | Zustand 5 (with `persist` middleware) | Minimal boilerplate for global theme, locale, progress, command palette |
| **Math Typesetting** | `katex` (CSS & fonts bundled locally via npm) | Authentic publication-grade equations offline |
| **Icons** | `lucide-react` | Crisp geometric icons matching Linear-style UI |
| **Unit & Component Tests** | Vitest + `@testing-library/react` + `jsdom` | Fast math invariant & component testing |
| **E2E & Visual Verification** | Playwright (`@playwright/test`) | Real browser console-error, layout-overflow, theme/i18n, and interaction verification |
| **Linting** | ESLint 9 (flat config) + `typescript-eslint` + `eslint-plugin-react-hooks` | Enforces hook discipline and clean TS |
| **Package Manager** | `npm` (Node >= 20 LTS) | Universally available in CI and sandbox environments |

> **Dependency Discipline**: Do NOT install heavyweight charting wrappers (`echarts`, `chart.js`, `plotly`, `three`, `@tensorflow/tfjs`). Every visualization in TensorLens uses lightweight, custom-crafted SVG + HiDPI 2D Canvas backed by `src/engine/`, yielding smoother interactivity, exact theme coherence, and tiny bundles.

---

## 2. Repository Directory Structure

```text
tensorlens/
├── AGENTS.md                        # Autonomous Codex execution contract
├── ROADMAP.md                       # Milestones and their verification gates
├── PROGRESS.md                      # Live execution log updated by agent per milestone
├── README.md                        # English GitHub README (finalized in M15)
├── README.zh-CN.md                  # Chinese GitHub README (finalized in M15)
├── CONTRIBUTING.md                  # Contributor & "Add a Lab" guide (M15)
├── LICENSE                          # MIT License
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.js
├── index.html
├── .github/
│   └── workflows/
│       ├── ci.yml                   # Typecheck + Lint + Unit Tests + Build + E2E
│       └── deploy.yml               # Static GitHub Pages deployment
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   └── LAB_SPECS.md
├── e2e/
│   ├── smoke.spec.ts                # Core shell, routing, theme, i18n, Cmd+K
│   └── labs.spec.ts                 # All registered labs render, interact, zero console/overflow errors
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── styles/
    │   ├── tokens.css               # Semantic CSS variables for Dark & Light themes
    │   └── globals.css              # Tailwind import, KaTeX overrides, tabular-nums, scrollbars
    ├── store/
    │   └── useAppStore.ts           # Theme, locale, challenge progress, UI panel prefs
    ├── i18n/
    │   ├── index.ts                 # Typed dictionary registry & useI18n() hook
    │   ├── types.ts                 # Recursive DeepStringSchema type utility
    │   ├── common.ts                # Global shell, landing, workbench chrome (en + zh)
    │   └── labs/
    │       ├── bpe-tokenizer.ts
    │       ├── embeddings-rope.ts
    │       ├── attention-debugger.ts
    │       ├── norm-residual.ts
    │       ├── kv-cache-profiler.ts
    │       ├── flash-attention.ts
    │       ├── moe-routing.ts
    │       ├── quantization.ts
    │       ├── decoding-sampling.ts
    │       ├── lora-svd.ts
    │       ├── backprop-optimizers.ts
    │       └── diffusion-flow.ts
    ├── engine/                      # ZERO React / DOM imports allowed!
    │   ├── math/
    │   │   ├── prng.ts              # Mulberry32 + Box-Muller Gaussian + shuffle
    │   │   ├── matrix.ts            # Float64Array Matrix ops, softmax, norms, metrics
    │   │   ├── svd.ts               # Deterministic Jacobi SVD & low-rank reconstruction
    │   │   ├── autograd.ts          # Scalar reverse-mode autodiff DAG engine
    │   │   ├── ieee754.ts           # Bit-level FP32/FP16/BF16/FP8 codecs
    │   │   ├── colormaps.ts         # Perceptually uniform sequential/diverging/categorical maps
    │   │   └── __tests__/           # Core math unit tests
    │   └── labs/
    │       ├── bpe-tokenizer/       # engine.ts + presets.ts + __tests__/engine.test.ts
    │       ├── embeddings-rope/
    │       ├── attention-debugger/
    │       ├── norm-residual/
    │       ├── kv-cache-profiler/
    │       ├── flash-attention/
    │       ├── moe-routing/
    │       ├── quantization/
    │       ├── decoding-sampling/
    │       ├── lora-svd/
    │       ├── backprop-optimizers/
    │       └── diffusion-flow/
    ├── components/
    │   ├── layout/
    │   │   ├── AppHeader.tsx        # Top nav, lab switcher, Cmd+K, progress pill, EN/ZH, theme
    │   │   ├── CommandPalette.tsx   # Fuzzy search across labs, concepts, actions
    │   │   └── LabShell.tsx         # Standardized 4-zone workbench + shortcuts + export
    │   ├── controls/
    │   │   ├── SliderControl.tsx
    │   │   ├── SegmentedControl.tsx
    │   │   ├── ToggleControl.tsx
    │   │   ├── SelectControl.tsx
    │   │   ├── PresetBar.tsx
    │   │   └── StepController.tsx   # Play/Pause/Prev/Next/Speed/Progress bar
    │   ├── viz/
    │   │   ├── FormulaBar.tsx       # Memoized KaTeX formula display
    │   │   ├── HiDPICanvas.tsx      # ResizeObserver + DPR-scaled Canvas component
    │   │   ├── MatrixHeatmap.tsx    # Interactive Canvas/SVG heatmap + hover coordinate
    │   │   ├── MetricCard.tsx       # Tabular-nums KPI readout with delta/status tone
    │   │   ├── ChallengePanel.tsx   # Guided challenges with live status badges
    │   │   └── LabPreviewIcon.tsx   # Crisp schematic SVG icons for the catalog cards
    │   └── utils/
    │       ├── useThemePalette.ts   # Reads live CSS variables for Canvas rendering
    │       ├── useSimulationLoop.ts # Visibility-aware requestAnimationFrame hook
    │       ├── useLabUrlState.ts    # URL search params <-> Lab state sync
    │       └── exportSnapshot.ts    # HiDPI 2x PNG export for Canvas & SVG stages
    ├── pages/
    │   ├── HomePage.tsx             # Ambient hero canvas + 4-chapter filterable catalog
    │   └── LabPage.tsx              # Route loader resolving registry + Suspense fallback
    └── labs/
        ├── types.ts                 # LabDefinition, ChapterId, ChallengeItem contracts
        ├── registry.ts              # Central ordered array of all lazy-loaded labs
        └── <lab-id>/                # Lab component + focused viz subcomponents
```

---

## 3. Core Pure-TypeScript Math Engine Specification (`src/engine/math/`)

All numerical code MUST be deterministic, pure, and strictly typed.

### 3.1 `prng.ts`
```ts
export interface SeededRng {
  /** Uniform float in [0, 1) */
  next(): number;
  /** Standard normal N(0, 1) via Box-Muller */
  nextGaussian(mean?: number, std?: number): number;
  /** Uniform integer in [min, max] inclusive */
  nextInt(min: number, max: number): number;
  /** Deterministic Fisher-Yates copy */
  shuffle<T>(items: readonly T[]): T[];
}

export function createRng(seed: number): SeededRng;
```
- Implementation: Mulberry32 (`seed |= 0; ...`) with cached Box-Muller spare value. Never call `Math.random()` anywhere in `src/engine/`.

### 3.2 `matrix.ts`
```ts
export class Matrix {
  readonly rows: number;
  readonly cols: number;
  readonly data: Float64Array;

  constructor(rows: number, cols: number, data?: Float64Array);
  static zeros(rows: number, cols: number): Matrix;
  static from2D(grid: readonly (readonly number[])[]): Matrix;
  static randomNormal(rows: number, cols: number, rng: SeededRng, std?: number): Matrix;
  static identity(n: number): Matrix;

  get(r: number, c: number): number;
  set(r: number, c: number, value: number): void;
  row(r: number): Float64Array;
  to2D(): number[][];
  clone(): Matrix;
  transpose(): Matrix;
  matmul(other: Matrix): Matrix;
  add(other: Matrix): Matrix;
  sub(other: Matrix): Matrix;
  scale(factor: number): Matrix;
  map(fn: (value: number, r: number, c: number) => number): Matrix;
  frobeniusNorm(): number;
}

export function stableSoftmax(logits: readonly number[] | Float64Array, temperature?: number): number[];
export function logSumExp(values: readonly number[] | Float64Array): number;
export function dotProduct(a: ArrayLike<number>, b: ArrayLike<number>): number;
export function cosineSimilarity(a: ArrayLike<number>, b: ArrayLike<number>): number;
export function shannonEntropy(probs: readonly number[]): number; // in nats or bits (specify base)
export function layerNormVector(x: readonly number[], eps?: number): { out: number[]; mean: number; variance: number };
export function rmsNormVector(x: readonly number[], eps?: number): { out: number[]; rms: number };
export function mse(a: ArrayLike<number>, b: ArrayLike<number>): number;
export function sqnrDb(original: ArrayLike<number>, quantized: ArrayLike<number>): number;
```
- Numerical guardrails: `stableSoftmax` MUST subtract `max(logits)` before `Math.exp`, and mask `-Infinity` positions to exact `0` (handling all-`-Infinity` rows gracefully as uniform or zero without `NaN`).

### 3.3 `svd.ts`
```ts
export interface SVDResult {
  U: Matrix;          // m x k (orthonormal columns)
  S: number[];        // singular values sorted descending (length k = min(m, n))
  V: Matrix;          // n x k (orthonormal columns, so A ≈ U * diag(S) * V^T)
  totalEnergy: number; // sum(s_i^2)
}

export function computeSVD(matrix: Matrix, maxSweeps?: number): SVDResult;
export function reconstructRankR(svd: SVDResult, rank: number): Matrix;
```
- Algorithm: One-sided Jacobi SVD (works cleanly on rectangular $m \times n$ matrices; if $m < n$, transpose, run Jacobi, swap $U$ and $V$). Sort singular values descending and ensure non-negative singular values. Must verify $\|A - U\Sigma V^T\|_F < 10^{-8}$ in unit tests!

### 3.4 `autograd.ts`
```ts
export type AutogradOp =
  | 'input' | 'param' | 'add' | 'sub' | 'mul' | 'div'
  | 'pow' | 'exp' | 'log' | 'relu' | 'gelu' | 'tanh' | 'sigmoid';

export interface AutogradNodeSnapshot {
  id: string;
  label: string;
  op: AutogradOp;
  value: number;
  grad: number;
  parentIds: string[];
  localGradFormula: string;
}

export class Value {
  readonly id: string;
  label: string;
  readonly op: AutogradOp;
  value: number;
  grad: number;
  readonly parents: Value[];
  // Supports full reverse-mode backward() AND step-by-step topological traversal!
  add(other: Value | number, label?: string): Value;
  sub(other: Value | number, label?: string): Value;
  mul(other: Value | number, label?: string): Value;
  div(other: Value | number, label?: string): Value;
  pow(exponent: number, label?: string): Value;
  relu(label?: string): Value;
  gelu(label?: string): Value;
  tanh(label?: string): Value;
  sigmoid(label?: string): Value;
  exp(label?: string): Value;
  log(label?: string): Value;
  topologicalOrder(): Value[];
  backward(): void;
  /** Returns per-step snapshots propagating gradients one node at a time in reverse topo order */
  backwardTrace(): AutogradNodeSnapshot[][];
}
```

### 3.5 `ieee754.ts`
```ts
export type FloatFormat = 'fp32' | 'fp16' | 'bf16' | 'fp8_e4m3' | 'fp8_e5m2';

export interface FloatBitBreakdown {
  format: FloatFormat;
  original: number;
  represented: number;
  absError: number;
  signBit: 0 | 1;
  exponentBits: number[]; // MSB -> LSB
  mantissaBits: number[]; // MSB -> LSB
  exponentBias: number;
  isSubnormal: boolean;
  isInf: boolean;
  isNaN: boolean;
}

export function inspectFloatFormat(value: number, format: FloatFormat): FloatBitBreakdown;
export function quantizeFloatFormat(value: number, format: FloatFormat): number;
```
- Uses `DataView` / `Float32Array` + `Uint32Array` bit operations for exact IEEE-754 FP32/FP16/BF16 and OCP FP8 (`E4M3` bias=7 max=448 no Inf, `E5M2` bias=15 max=57344) round-to-nearest-even semantics.

### 3.6 `colormaps.ts`
- Exports pure RGBA/CSS color functions accepting `theme: 'dark' | 'light'`:
  - `sequentialColor(t: number, theme: ThemeMode): string` (`t` clamped to `[0, 1]`)
  - `divergingColor(v: number, maxAbs: number, theme: ThemeMode): string` (`v / maxAbs` clamped to `[-1, 1]`)
  - `categoricalColor(index: number, theme: ThemeMode): string` (8 distinct colors)

---

## 4. Lab Plugin Contract & Registry (`src/labs/`)

```ts
export type ChapterId =
  | 'sequence-attention'
  | 'architecture-inference'
  | 'efficiency-alignment'
  | 'training-generative';

export type LabDifficulty = 'foundational' | 'intermediate' | 'advanced';

export interface ChallengeStatus {
  id: string;
  title: string;
  description: string;
  insight: string;       // Shown once completed
  completed: boolean;
}

export interface LabDefinition {
  id: string;            // URL slug, e.g. 'attention-debugger'
  number: number;        // 1..12
  chapter: ChapterId;
  difficulty: LabDifficulty;
  tags: string[];        // Technical keywords (for display & Cmd+K search)
  component: React.LazyExoticComponent<React.ComponentType>;
}
```

- `src/labs/registry.ts` exports `LAB_REGISTRY: readonly LabDefinition[]` ordered by lab number, plus helper selectors `getLabById(id)`, `getAdjacentLabs(id)`, `CHAPTER_ORDER`.
- Every lab route `#/labs/:labId` renders through `LabPage.tsx` wrapped in `<ErrorBoundary>` and `<Suspense fallback={<LabSkeleton />}>`.

---

## 5. Standardized Workbench & Rendering Patterns

### 5.1 `LabShell` Props Contract
```ts
export interface LabShellProps {
  labId: string;
  title: string;
  subtitle: string;
  presets?: Array<{ id: string; label: string; active: boolean; onSelect: () => void }>;
  onReset: () => void;
  getShareUrl?: () => string;       // Defaults to current window.location.href
  controls: React.ReactNode;        // Left Rail parameters
  challenges: ChallengeStatus[];    // Left Rail bottom / mobile tab
  formula?: React.ReactNode;        // Top of Center Stage (FormulaBar)
  stage: React.ReactNode;           // Main SVG / Canvas area (ref attached for PNG export)
  stepper?: React.ReactNode;        // Bottom of Center Stage (StepController)
  metrics: Array<{ label: string; value: string; hint?: string; tone?: 'neutral' | 'accent' | 'good' | 'warn' | 'danger' }>;
  inspector?: React.ReactNode;      // Live hovered/selected element readout
  explainer: React.ReactNode;       // Contextual "What's happening" + "In Real LLMs" notes
}
```
- **Automatic Challenge Persistence**: Whenever any item in `challenges` transitions to `completed: true`, `LabShell` automatically calls `useAppStore.getState().markChallengeCompleted(labId, challenge.id)` so progress persists across visits and reflects in the Header Progress Ring and Home Page cards.

### 5.2 HiDPI Canvas + Theme Reactivity
Canvas elements do not automatically resolve CSS variables inside `ctx.fillStyle`. Therefore:
- Provide `useThemePalette()` returning resolved concrete RGB/Hex strings read via `getComputedStyle(document.documentElement)` whenever `theme` changes.
- `HiDPICanvas` tracks container dimensions with `ResizeObserver`, resizes `canvas.width = Math.round(width * dpr)`, `canvas.height = Math.round(height * dpr)`, sets `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`, and invokes `onRender(ctx, { width, height, dpr, palette })`.

### 5.3 PNG Snapshot Exporter (`exportSnapshot.ts`)
- Given the stage container DOM element:
  1. Creates an offscreen 2× HiDPI export canvas filled with `--bg-canvas`.
  2. Composites any child `<canvas>` elements cleanly AND serializes any inline `<svg>` elements (inlining computed font/color styles) via `XMLSerializer` → Blob URL → `Image` → `drawImage`.
  3. Draws a crisp bottom caption strip: `TensorLens · <Lab Title>` in subtle muted text.
  4. Triggers download `<labId>-snapshot.png`.

### 5.4 URL State Codec (`useLabUrlState.ts`)
```ts
export interface UrlStateCodec<T> {
  encode(state: T): Record<string, string>;
  decode(params: URLSearchParams, fallback: T): T;
}
```
- On mount, initializes lab state via `codec.decode(searchParams, defaultState)` with strict clamping/validation so malformed URL params NEVER crash a lab.
- Updates URL search params cleanly (debounced 150ms via `replaceState`) so the user can copy the URL or click **Share URL** at any moment.

---

## 6. Compile-Time Safe Bilingual i18n Architecture (`src/i18n/`)

To guarantee 100% parity between English and Chinese without runtime missing-key surprises:

```ts
// src/i18n/types.ts
export type Locale = 'en' | 'zh';

export type ExactStringTree<T> = {
  [K in keyof T]: T[K] extends string ? string : ExactStringTree<T[K]>;
};
```

Each dictionary module (e.g., `src/i18n/labs/attention-debugger.ts`) exports:
```ts
export const attentionEn = {
  title: 'Multi-Head Attention Debugger',
  // ...
} as const;

export const attentionZh: ExactStringTree<typeof attentionEn> = {
  title: '自注意力与多头注意力调试器',
  // TypeScript FAILS compilation if ANY key is missing or extra!
};
```
- `useI18n()` exposes `{ locale, setLocale, toggleLocale, common, lab }` where `common` is the typed `en`/`zh` global dictionary and `lab` gives typed access to any lab dictionary.

---

## 7. Build, Vite Chunking & GitHub Pages Configuration

### `vite.config.ts` Requirements
- `base: './'` so static assets resolve properly regardless of repository subpath (`/tensorlens/` on GitHub Pages) or root domain.
- `build.rollupOptions.output.manualChunks`:
  - `react-vendor`: `react`, `react-dom`, `react-router-dom`, `zustand`
  - `katex`: `katex`
  - Each lab (`src/labs/<id>/`) is split automatically via `React.lazy`.

### `package.json` Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 4173 --strictPort",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

---

## 8. Testing & Verification Pyramid

| Tier | Tool | Scope & Required Assertions |
| :--- | :--- | :--- |
| **1. Static Type & i18n Parity** | `npm run typecheck` | Zero TS errors, strict null/index checks, 100% EN/ZH key match |
| **2. Lint** | `npm run lint` | Zero warnings/errors across `src/` and `e2e/` |
| **3. Math Invariant Unit Tests** | `npm run test` (Vitest) | Every `src/engine/math/*` and `src/engine/labs/*` mathematical invariant, edge cases, determinism, zero `NaN`/`Infinity` |
| **4. Component Smoke Tests** | `npm run test` (Vitest + RTL) | Renders `HomePage` and each implemented Lab under `en`/`zh` without throwing |
| **5. Production Bundle Check** | `npm run build` | Clean Vite production build, verify lazy chunks generated |
| **6. E2E & Visual Layout Gate** | `npm run test:e2e` (Playwright) | Visits Home + all implemented `#/labs/:id` routes at `1440x900` and `390x844`; asserts zero `console.error`, zero `pageerror`, zero horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`), verifies EN/ZH switch, Dark/Light toggle, `⌘K` palette, and interactive slider/stepper response |

### CI Workflows (`.github/workflows/`)
- `ci.yml`: Triggers on push & PR to `main`; runs `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, and Playwright E2E with Chromium.
- `deploy.yml`: Triggers on push to `main` (and `workflow_dispatch`); builds `dist/` and deploys via `actions/upload-pages-artifact` + `actions/deploy-pages`.
