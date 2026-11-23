# TensorLens — Autonomous Execution Roadmap (`M0` – `M15`)

> **Instructions for Codex**: Execute milestones strictly in order (`M0` → `M15`) following `AGENTS.md`.
> After passing every gate for a milestone, mark its checkboxes `[x]`, append metrics to `PROGRESS.md`, commit cleanly (`feat(M<k>): ...`), and proceed directly to the next milestone without pausing.

---

## Milestone 0 (`M0`): Project Bootstrap, Tooling & CI Foundation
**Goal**: Initialize the Vite + React 19 + TypeScript strict workspace with Tailwind v4, Vitest, Playwright, ESLint, and GitHub Actions workflows.

- [x] Initialize `package.json` with scripts: `dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `test:watch`, `test:e2e`.
- [x] Install core dependencies (`react`, `react-dom`, `react-router-dom`, `zustand`, `katex`, `lucide-react`) and devDependencies (`vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `typescript`, `@types/react`, `@types/react-dom`, `@types/katex`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@playwright/test`, `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `globals`).
- [x] Configure `tsconfig.json` (`strict: true`, `noUncheckedIndexedAccess: true`), `vite.config.ts` (`base: './'`, vendor manualChunks), `vitest.config.ts`, `playwright.config.ts`, and `eslint.config.js`.
- [x] Create `index.html`, `src/main.tsx`, minimal `src/App.tsx`, `LICENSE` (MIT), `.gitignore`, `.github/workflows/ci.yml`, and `.github/workflows/deploy.yml`.
- [x] Create initial sanity test (`src/App.test.tsx`) and `e2e/smoke.spec.ts`.
- [x] **Gate**: `npm run typecheck && npm run lint && npm run test && npm run build` passes cleanly (plus `npm run test:e2e` if Chromium available).

---

## Milestone 1 (`M1`): Design System, Typed EN/ZH i18n, Global Shell & Landing Page
**Goal**: Ship the polished Linear/3Blue1Brown visual system, Dark/Light themes, compile-time safe EN/ZH switching, global header, `⌘K` Command Palette, and Home Explorer page with live ambient hero canvas.

- [x] Implement `src/styles/tokens.css` (complete Dark & Light semantic variables from `docs/PRD.md`) and `src/styles/globals.css` (Tailwind v4, KaTeX CSS import, `tabular-nums`, reduced-motion rules).
- [x] Implement `src/store/useAppStore.ts` (persisted Zustand store: `theme`, `locale`, `completedChallenges`, `lastVisitedLabId`, side-panel collapse states).
- [x] Implement `src/i18n/types.ts`, `src/i18n/common.ts`, and `src/i18n/index.ts` with `ExactStringTree` compile-time EN/ZH parity.
- [x] Implement `src/labs/types.ts` and `src/labs/registry.ts` metadata for all 12 labs (with clean chapter definitions and `LabPreviewIcon.tsx` custom schematic SVG icon for every lab).
- [x] Build `src/components/layout/AppHeader.tsx` (Logo, Lab Switcher, `⌘K` trigger, Progress Ring, `EN | 中文` toggle, Dark/Light toggle, GitHub link) and `src/components/layout/CommandPalette.tsx` (bilingual fuzzy search across labs, tags, actions).
- [x] Build `src/pages/HomePage.tsx` (60fps HiDPI ambient attention-arc/vector-field hero canvas respecting `prefers-reduced-motion`, 4-chapter tabs, difficulty filter, 12-lab responsive card grid showing progress) and `src/pages/LabPage.tsx` with ErrorBoundary + Suspense.
- [x] Update `e2e/smoke.spec.ts` to verify Home render, EN/ZH switching, Dark/Light theme switching, `⌘K` open/search/close, and zero overflow at `1440x900` and `390x844`.
- [x] **Gate**: `npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e`.

---

## Milestone 2 (`M2`): Core Pure-TS Math Engine & Shared Workbench SDK
**Goal**: Build and exhaustively unit-test the shared pure TypeScript numerical library (`src/engine/math/`) and all shared workbench UI/viz components (`LabShell`, `FormulaBar`, controls, `HiDPICanvas`, `MatrixHeatmap`, PNG exporter, URL state sync).

- [x] Implement pure math engine modules (zero React/DOM imports):
  - `src/engine/math/prng.ts` (Mulberry32 + Box-Muller + shuffle)
  - `src/engine/math/matrix.ts` (`Matrix`, `stableSoftmax`, `logSumExp`, `dotProduct`, `cosineSimilarity`, `shannonEntropy`, `layerNormVector`, `rmsNormVector`, `mse`, `sqnrDb`)
  - `src/engine/math/svd.ts` (Deterministic Jacobi SVD + `reconstructRankR`)
  - `src/engine/math/autograd.ts` (Scalar reverse-mode `Value` DAG + `backwardTrace()`)
  - `src/engine/math/ieee754.ts` (FP32, FP16, BF16, FP8 E4M3, FP8 E5M2 bit codecs)
  - `src/engine/math/colormaps.ts` (Theme-aware sequential, diverging, categorical color ramps)
- [x] Write exhaustive Vitest math invariant tests in `src/engine/math/__tests__/` verifying SVD precision `< 1e-8`, autograd vs numerical finite diffs `< 1e-5`, IEEE-754 edge cases (BF16 vs FP16 overflow, FP8 E4M3 max 448), softmax stability, and PRNG determinism.
- [x] Build shared workbench & UI primitives:
  - `src/components/layout/LabShell.tsx` (4-zone responsive workbench, keyboard shortcuts `Space`/`←`/`→`/`R`, Share URL toast, PNG export button, Prev/Next Lab footer, automatic challenge persistence)
  - `src/components/controls/` (`SliderControl`, `SegmentedControl`, `ToggleControl`, `SelectControl`, `PresetBar`, `StepController`)
  - `src/components/viz/` (`FormulaBar`, `HiDPICanvas`, `MatrixHeatmap`, `MetricCard`, `ChallengePanel`)
  - `src/components/utils/` (`useThemePalette`, `useSimulationLoop`, `useLabUrlState`, `exportSnapshot`)
- [x] Write component unit tests for `LabShell`, `FormulaBar`, `ChallengePanel`, and `useLabUrlState`.
- [x] **Gate**: `npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e`.

---

## Milestone 3 (`M3`): Lab 01 — BPE Tokenizer & Subword Lab (`bpe-tokenizer`)
**Spec**: `docs/LAB_SPECS.md` § Lab 01

- [x] Implement `src/engine/labs/bpe-tokenizer/` (real UTF-8 byte-level BPE trainer, merge-tree builder, encoder/decoder, 3 presets) + Vitest invariant suite (UTF-8 CJK/Emoji round-trip identity, monotonic compression, determinism).
- [x] Add `src/i18n/labs/bpe-tokenizer.ts` (100% EN + ZH).
- [x] Build `src/labs/bpe-tokenizer/` (color-coded token chips, recursive binary BPE merge-tree inspector, dual compression/token-count SVG curve, Stepper, URL codec, 3 auto-verified Guided Challenges).
- [x] Wire lazy route in `src/labs/registry.ts` and add Playwright E2E check in `e2e/labs.spec.ts`.
- [x] **Gate**: `npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e`.

---

## Milestone 4 (`M4`): Lab 02 — Embeddings & RoPE Geometry (`embeddings-rope`)
**Spec**: `docs/LAB_SPECS.md` § Lab 02

- [x] Implement `src/engine/labs/embeddings-rope/` (RoPE complex-plane rotations, Sinusoidal PE, PI & NTK-Aware scaling, relative-distance decay curves) + Vitest invariant suite (orthogonality `1e-10`, relative shift invariance `1e-10`, origin identity, NTK scaling monotonicity).
- [x] Add `src/i18n/labs/embeddings-rope.ts` (100% EN + ZH).
- [x] Build `src/labs/embeddings-rope/` (multi-plane 2D polar wheel SVG grid, relative distance decay SVG plot, `Shift Both` invariance slider, URL codec, 3 Guided Challenges).
- [x] Wire lazy route in `src/labs/registry.ts` and add E2E check.
- [x] **Gate**: `npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e`.

---

## Milestone 5 (`M5`): Lab 03 — Multi-Head Attention Debugger (`attention-debugger`)
**Spec**: `docs/LAB_SPECS.md` § Lab 03

- [x] Implement `src/engine/labs/attention-debugger/` (multi-head $QKV$, toggleable $1/\sqrt{d_k}$ scaling, Causal/Bidirectional/Sliding Window masks, Softmax entropy, MHA/GQA/MQA topology metrics) + Vitest invariant suite.
- [x] Add `src/i18n/labs/attention-debugger.ts` (100% EN + ZH).
- [x] Build `src/labs/attention-debugger/` (6-stage Stepper, interactive Attention Heatmap + Token-to-Token Bézier Arc Diagram with cross-hover cell breakdown, MHA/GQA/MQA wiring SVG, URL codec, 3 Guided Challenges).
- [x] Wire lazy route in `src/labs/registry.ts` and add E2E check.
- [x] **Gate**: `npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e`.

---

## Milestone 6 (`M6`): Lab 04 — LayerNorm, RMSNorm & Residual Stream (`norm-residual`)
**Spec**: `docs/LAB_SPECS.md` § Lab 04

- [x] Implement `src/engine/labs/norm-residual/` (deep 4..32-layer forward + Jacobian gradient-norm simulator supporting Pre-Norm, Post-Norm, No Norm, LayerNorm, RMSNorm, Residual toggle, ReLU/GELU/SwiGLU, outlier injection) + Vitest invariant suite.
- [x] Add `src/i18n/labs/norm-residual.ts` (100% EN + ZH).
- [x] Build `src/labs/norm-residual/` (dual forward-norm & backward-gradient depth trajectory SVG charts, interactive 32-channel LayerNorm vs RMSNorm slice inspector, Stepper across layers, URL codec, 3 Guided Challenges).
- [x] Wire lazy route in `src/labs/registry.ts` and add E2E check.
- [x] **Gate**: `npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e`.

---

## Milestone 7 (`M7`): Lab 05 — KV Cache & Prefill/Decode Profiler (`kv-cache-profiler`)
**Spec**: `docs/LAB_SPECS.md` § Lab 05

- [x] Implement `src/engine/labs/kv-cache-profiler/` (autoregressive Prefill/Decode trace comparing Cache vs No-Cache, real-scale VRAM & arithmetic intensity calculator for MHA/GQA/MQA/MLA + H100/A100/4090/M4 Max hardware profiles) + Vitest invariant suite.
- [x] Add `src/i18n/labs/kv-cache-profiler.ts` (100% EN + ZH).
- [x] Build `src/labs/kv-cache-profiler/` (animated Prefill/Decode token-step matrix SVG, VRAM budget bar with OOM alert, interactive Log-Log GPU Roofline SVG plot, Stepper, URL codec, 3 Guided Challenges).
- [x] Wire lazy route in `src/labs/registry.ts` and add E2E check.
- [x] **Gate**: `npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e`.

---

## Milestone 8 (`M8`): Lab 06 — FlashAttention Tiling & SRAM Simulator (`flash-attention`)
**Spec**: `docs/LAB_SPECS.md` § Lab 06

- [x] Implement `src/engine/labs/flash-attention/` (exact block-tiled FlashAttention-2 Online Softmax trace with causal block-skipping, HBM IO byte accounting, asymptotic scaling curve) + Vitest invariant suite proving `maxAbsDiff(flash, naive) < 1e-10`.
- [x] Add `src/i18n/labs/flash-attention.ts` (100% EN + ZH).
- [x] Build `src/labs/flash-attention/` (HBM ↔ On-Chip SRAM hardware block diagram SVG, live $m_i, l_i, e^{m_i - m_i^{\text{new}}}$ tile inspector, virtual $N \times N$ tile status grid, HBM IO race counter, Stepper, URL codec, 3 Guided Challenges).
- [x] Wire lazy route in `src/labs/registry.ts` and add E2E check.
- [x] **Gate**: `npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e`.

---

## Milestone 9 (`M9`): Lab 07 — MoE Router & Load Balancing Sandbox (`moe-routing`)
**Spec**: `docs/LAB_SPECS.md` § Lab 07

- [x] Implement `src/engine/labs/moe-routing/` (Top-$K$ softmax gating, capacity factor overflow & token dropping, $\mathcal{L}_{\text{aux}}$ calculation, 30-step router training dynamics comparing `None`, `Aux Loss`, and `Loss-Free Bias`) + Vitest invariant suite.
- [x] Add `src/i18n/labs/moe-routing.ts` (100% EN + ZH).
- [x] Build `src/labs/moe-routing/` (interactive Token→Expert Sankey routing SVG with capacity ceiling lines & dropped-token dashed paths, cross-hover inspector, load-balance trajectory chart, Stepper, URL codec, 3 Guided Challenges).
- [x] Wire lazy route in `src/labs/registry.ts` and add E2E check.
- [x] **Gate**: `npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e`.

---

## Milestone 10 (`M10`): Lab 08 — Quantization & Precision Loss Lab (`quantization`)
**Spec**: `docs/LAB_SPECS.md` § Lab 08

- [ ] Implement `src/engine/labs/quantization/` (FP16/BF16/FP8/INT8/INT4/NF4 group-wise quantization, channel outlier injection, SmoothQuant channel scaling, bit-flipper inspector, exact MSE/SQNR/Cosine Sim metrics) + Vitest invariant suite.
- [ ] Add `src/i18n/labs/quantization.ts` (100% EN + ZH).
- [ ] Build `src/labs/quantization/` (Dual mode: synchronized Original/Dequantized/Error heatmaps + quantization-grid histogram overlay AND clickable IEEE-754/FP8 bit-box laboratory, URL codec, 3 Guided Challenges).
- [ ] Wire lazy route in `src/labs/registry.ts` and add E2E check.
- [ ] **Gate**: `npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e`.

---

## Milestone 11 (`M11`): Lab 09 — Decoding & Sampling Playground (`decoding-sampling`)
**Spec**: `docs/LAB_SPECS.md` § Lab 09

- [ ] Implement `src/engine/labs/decoding-sampling/` (ordered Penalty → Temperature → Top-$K$ → Top-$P$ → Min-$P$ pipeline, seeded Monte Carlo rollouts, real Beam Search tree with length penalty & curated Greedy Trap preset) + Vitest invariant suite.
- [ ] Add `src/i18n/labs/decoding-sampling.ts` (100% EN + ZH).
- [ ] Build `src/labs/decoding-sampling/` (Dual mode: interactive sorted bar + cumulative mass chart with Sample 1×/100× roulette animation AND interactive Beam Search tree SVG with Stepper, URL codec, 3 Guided Challenges).
- [ ] Wire lazy route in `src/labs/registry.ts` and add E2E check.
- [ ] **Gate**: `npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e`.

---

## Milestone 12 (`M12`): Lab 10 — LoRA & Low-Rank SVD Lab (`lora-svd`)
**Spec**: `docs/LAB_SPECS.md` § Lab 10

- [ ] Implement `src/engine/labs/lora-svd/` (Jacobi SVD target decomposition, Eckart-Young rank-$r$ floor, live analytical-gradient $B \cdot A$ adapter trainer with toggleable $B=0$ init, Full FT vs LoRA vs QLoRA LLM VRAM calculator) + Vitest invariant suite.
- [ ] Add `src/i18n/labs/lora-svd.ts` (100% EN + ZH).
- [ ] Build `src/labs/lora-svd/` (physical $W_0 + \frac{\alpha}{r}BA$ heatmap factorization diagram, SVD scree plot + live training loss curve vs SVD floor, 7B–70B VRAM comparison bar, Stepper, URL codec, 3 Guided Challenges).
- [ ] Wire lazy route in `src/labs/registry.ts` and add E2E check.
- [ ] **Gate**: `npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e`.

---

## Milestone 13 (`M13`): Lab 11 — Autograd & Optimizers Arena (`backprop-optimizers`)
**Spec**: `docs/LAB_SPECS.md` § Lab 11

- [ ] Implement `src/engine/labs/backprop-optimizers/` (3 live reverse-mode autograd micro-circuits with finite-difference verification + 4 analytical 2D landscapes + 5 simultaneous optimizers SGD/Momentum/RMSProp/Adam/AdamW + 3 LR schedules) + Vitest invariant suite.
- [ ] Add `src/i18n/labs/backprop-optimizers.ts` (100% EN + ZH).
- [ ] Build `src/labs/backprop-optimizers/` (Dual mode: 60fps HiDPI Canvas click-to-drop 2D contour optimizer race with loss & LR sparklines AND interactive layered Autograd DAG SVG with reverse step-by-step chain-rule highlighter, URL codec, 3 Guided Challenges).
- [ ] Wire lazy route in `src/labs/registry.ts` and add E2E check.
- [ ] **Gate**: `npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e`.

---

## Milestone 14 (`M14`): Lab 12 — Diffusion & Flow Matching Denoising Lab (`diffusion-flow`)
**Spec**: `docs/LAB_SPECS.md` § Lab 12

- [ ] Implement `src/engine/labs/diffusion-flow/` (4 2D distributions with binary classes, Linear/Cosine noise schedules, exact closed-form empirical-GMM score denoiser, CFG guidance, DDPM / DDIM / Flow Matching ODE solvers, vector field grid evaluator, straightness & manifold distance metrics) + Vitest invariant suite.
- [ ] Add `src/i18n/labs/diffusion-flow.ts` (100% EN + ZH).
- [ ] Build `src/labs/diffusion-flow/` (60fps HiDPI Canvas particle swarm + glowing hero trails + dynamic 16×16 score/velocity quiver grid + synchronized 3-way `Compare All 3` canvas view + $\bar\alpha_t$/SNR SVG chart, Stepper, URL codec, 3 Guided Challenges).
- [ ] Wire lazy route in `src/labs/registry.ts` and add E2E check.
- [ ] **Gate**: `npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e`.

---

## Milestone 15 (`M15`): Final Polish, Full 12-Lab Audit & Open-Source Release Pack
**Goal**: Elevate the entire repository to showcase-ready open-source quality with full 12-lab verification, bundle optimization, and bilingual GitHub documentation.

- [ ] Audit bundle sizes from `npm run build`: confirm initial landing chunk is lean (`< 200 KB` gzipped) and all 12 labs load as separate lazy chunks.
- [ ] Run full Playwright E2E suite across ALL 12 labs in BOTH `en` and `zh`, BOTH `dark` and `light` themes, and BOTH desktop (`1440x900`) and mobile (`390x844`): verify zero console errors, zero page errors, zero horizontal overflow, and working Share URL + Export PNG triggers.
- [ ] Audit i18n dictionaries and components for zero hardcoded untranslated strings, zero `TODO`/`FIXME` comments, and zero unused files.
- [ ] Author publication-grade `README.md` (English) and `README.zh-CN.md` (Chinese) with badges, feature highlights, complete 12-lab table, architecture overview, local development commands, and GitHub Pages deployment instructions.
- [ ] Author `CONTRIBUTING.md` documenting how contributors can add **Lab #13** cleanly using the `LabDefinition` SDK, pure math engine, and typed i18n pattern.
- [ ] Final clean verification: `npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e`, update `PROGRESS.md` with final summary stats, and create final release commit.
