# TensorLens — Autonomous Build Progress Log

> Automatically updated by the coding agent upon completing each milestone (`M0`–`M16`).

| Milestone | Status | Summary | Tests Passed | Build Status | Commit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `M0` | Complete | bootstrap the static React workspace and verification pipeline | 1 Vitest + 2 Playwright | Pass | `7c96b10` |
| `M1` | Complete | ship the bilingual explorer and application shell | 5 Vitest + 4 Playwright | Pass | `21633ec` |
| `M2` | Complete | implement numerical kernels and the shared lab workbench | 58 Vitest + 4 Playwright | Pass | `8262930` |
| `M3` | Complete | teach byte-level BPE through ranked merges and byte inspection | 75 Vitest + 8 Playwright | Pass | `e4b01df` |
| `M4` | Complete | visualize RoPE rotations and relative-position invariance | 95 Vitest + 12 Playwright | Pass | `981e9cc` |
| `M5` | Complete | trace real multi-head attention and shared KV projections | 118 Vitest + 16 Playwright | Pass | `351ea6b` |
| `M6` | Complete | inspect exact layer Jacobians and residual signal propagation | 144 Vitest + 20 Playwright | Pass | `100fd2b` |
| `M7` | Complete | profile cache reuse, memory budgets and hardware rooflines | 161 Vitest + 24 Playwright | Pass | `51c5b5f` |
| `M8` | Complete | trace tiled FlashAttention and SRAM traffic | 175 Vitest + 28 Playwright | Pass | `84acfbd` |
| `M9` | Complete | simulate sparse expert routing and load balancing | 190 Vitest + 32 Playwright | Pass | `ff036ec` |
| `M10` | Complete | inspect floating-point encodings and quantify tensor precision loss | 235 Vitest + 36 Playwright | Pass | `557f53d` |
| `M11` | Complete | trace sampling filters and search competing token sequences | 255 Vitest + 40 Playwright | Pass | `a7851a1` |
| `M12` | Complete | fit low-rank adapters against exact SVD reconstruction bounds | 282 Vitest + 44 Playwright | Pass | `34b3a30` |
| `M13` | Complete | trace reverse-mode gradients and race five optimizers | 311 Vitest + 48 Playwright | Pass | `00171ab` |
| `M14` | Complete | compare guided diffusion and flow on matched particle clouds | 348 Vitest + 52 Playwright | Pass | `20a6356` |
| `M15` | Complete | publish the bilingual release and verify all twelve labs | 395 Vitest + 126 Playwright | Pass | `feat(M15)` |
| `M16` | Complete | add token loss, hybrid retrieval and preference learning | 438 Vitest + 270 Playwright | Pass | `feat(M16)` |

## Detailed Milestone Notes

*(Agent appends concise technical notes, bundle sizes, and any environment observations per completed milestone below.)*

### M0 — bootstrap the static React workspace and verification pipeline

Added Vite 6 and React 19, strict TypeScript, separate Node and jsdom test projects, production-preview Chromium checks, and GitHub Actions CI and Pages workflows. Installed the Playwright Chromium runtime locally.

All five gates passed. 1 Vitest + 2 Playwright. Built JavaScript totals 68.1 KiB gzip across all chunks.

### M1 — ship the bilingual explorer and application shell

Added the typed catalog, persisted preferences and progress, command palette, responsive catalog and projected torus-knot hero. Confirmed keyboard navigation, bilingual search, reload persistence, catalog filters and both viewports in Chromium. GitHub Pages injects the repository URL at build time.

All five gates passed. 5 Vitest + 4 Playwright. Built JavaScript totals 96.6 KiB gzip across all chunks.

### M2 — implement numerical kernels and the shared lab workbench

Added deterministic PRNG, matrix operations, Jacobi SVD, reverse-mode autodiff, IEEE codecs and colormaps under src/engine/math. Added responsive LabShell, controls, typed URL codec, KaTeX, heatmap, HiDPI canvas, challenge persistence and snapshot export. An independent Chromium check downloaded a 2× composite PNG with canvas, inline SVG and text.

All five gates passed. 58 Vitest + 4 Playwright. Built JavaScript totals 96.6 KiB gzip across all chunks.

### M3 — teach byte-level BPE through ranked merges and byte inspection

Implemented src/engine/labs/bpe-tokenizer and its lazy workbench, recursive merge inspection, byte-aligned corpus highlights, bilingual missions, URL replay and a real PNG download. Chromium verified that a clicked depth-three merge completes the challenge and shared Unicode input survives reopening. Engine-first checkpoint: 71 tests passed before implementing the lab UI and translations.

All five gates passed. 75 Vitest + 8 Playwright. Built JavaScript totals 185.4 KiB gzip across all chunks.

### M4 — visualize RoPE rotations and relative-position invariance

Added deterministic query and key embeddings, multi-plane rotations, signed-distance score curves, sinusoidal comparison, PI and NTK scaling. The lab links a draggable score marker, selected plane and workbench stepper. Chromium verified the displayed dot product stays fixed during a common shift. Engine-first checkpoint: 92 tests passed before implementing the lab UI and translations.

All five gates passed. 95 Vitest + 12 Playwright. Built JavaScript totals 193.1 KiB gzip across all chunks.

### M5 — trace real multi-head attention and shared KV projections

Added seeded Q/K/V projections, masked softmax, exact AV and output projections, linked arc and heatmap inspection, and a six-stage bilingual debugger. Browser checks inspect a future cell in both mask modes, verify zero leakage and measure the drop from 288 to 144 KV projection parameters under GQA. Engine-first checkpoint: 113 tests passed before implementing the lab UI and translations.

All five gates passed. 118 Vitest + 16 Playwright. Built JavaScript totals 204.0 KiB gzip across all chunks.

### M6 — inspect exact layer Jacobians and residual signal propagation

Added a seeded 32-channel network, analytic normalization and activation VJPs, signed trajectory plots and layer/channel inspection. Independent finite differences validate the default output-channel probe. The unit lower bound is proven and tested for the translation direction of a Pre-LayerNorm residual network; arbitrary RMSNorm residual derivatives can contract. A 216-configuration depth-32 sweep stayed finite, with declared ±1e12 branch saturation in 16 extreme combinations. Engine-first checkpoint: 141 tests passed before implementing the lab UI and translations.

All five gates passed. 144 Vitest + 20 Playwright. Built JavaScript totals 212.2 KiB gzip across all chunks.

### M7 — profile cache reuse, memory budgets and hardware rooflines

Added nine deterministic prefill/decode frames with equal cached and uncached outputs, exact storage calculators, hardware profiles, editable architectures and a log-log roofline. High-level throughput is a peak-rate estimate, with two BF16 activation buffers; the MoE preset uses a dense-equivalent timing estimate. Tests verify real FLOP counts, OOM thresholds, cache rescue, and custom-model URL replay. Engine-first checkpoint: 157 tests passed before implementing the lab UI and translations.

All five gates passed. 161 Vitest + 24 Playwright. Built JavaScript totals 222.6 KiB gzip across all chunks.

### M8 — trace tiled FlashAttention and SRAM traffic

Implemented exact online-softmax tile updates, causal skips, an independent materialized baseline, per-phase memory transfers and an SRAM-constrained real-scale IO chart. An additional 162-case sweep across seeds, dimensions, tile sizes and masks matched analytical byte counts and found a maximum absolute output error below 6.67e-16. Engine-first checkpoint: 172 tests passed before implementing the lab UI and translations.

All five gates passed. 175 Vitest + 28 Playwright. Built JavaScript totals 231.7 KiB gzip across all chunks.

### M9 — simulate sparse expert routing and load balancing

Added a seeded 30-update linear router, capacity-ranked weighted dispatch, analytical Switch gradients and selection-only balancing biases. The Sankey and inspector report dropped assignments and fully dropped tokens separately. An additional sweep of 324 configurations and 10,044 frames conserved all routes, with gate-sum error at most 2.23e-16. Engine-first checkpoint: 187 tests passed before implementing the lab UI and translations.

All five gates passed. 190 Vitest + 32 Playwright. Built JavaScript totals 239.1 KiB gzip across all chunks.

### M10 — inspect floating-point encodings and quantify tensor precision loss

Implemented five editable floating-point formats and nine tensor quantizers, including the QLoRA NF4 codebook, per-group scale overhead and reversible channel migration. Two isolated spikes of magnitude 20 in distinct channels give 8.082 dB with per-tensor INT4 and 21.921 dB with group-of-eight NF4. Verified all histogram counts and independent SQNR across 432 configurations. FP32 rounding is checked against Math.fround, including for the nonrepresentable decimal 3.1415927. Engine-first checkpoint: 232 tests passed before implementing the lab UI and translations.

All five gates passed. 235 Vitest + 36 Playwright. Built JavaScript totals 250.7 KiB gzip across all chunks.

### M11 — trace sampling filters and search competing token sequences

Added six ordered probability stages, editable logits for 16-token contexts, seeded draws and length-normalized beam expansion with early terminal paths. The width-two trap solution has joint probability 0.33626 versus 0.108864 for greedy decoding. Independent sweeps checked 648 sampling configurations and 300 beam searches against exhaustive enumeration. Engine-first checkpoint: 252 tests passed before implementing the lab UI and translations.

All five gates passed. 255 Vitest + 40 Playwright. Built JavaScript totals 262.2 KiB gzip across all chunks.

### M12 — fit low-rank adapters against exact SVD reconstruction bounds

Added three seeded update families, Jacobi decompositions, analytical gradients and alternating gradient descent with exact per-factor line searches. At rank 3 the intrinsic task reached MSE 5.272601327e-6 at step 100, matching the SVD floor. Reviewed 90 training configurations and separate BF16/FP32/NF4 memory estimates. The physical diagram compares W0 + (alpha/r)BA with W0 + deltaW; the residual compares only the two updates. Engine-first checkpoint: 279 tests passed before implementing the lab UI and translations.

All five gates passed. 282 Vitest + 44 Playwright. Built JavaScript totals 271.2 KiB gzip across all chunks.

### M13 — trace reverse-mode gradients and race five optimizers

Implemented three scalar circuits, edge-by-edge reverse adjoints, finite-difference checks, four analytical loss surfaces, five optimizers, and three LR schedules. A 450-circuit sweep measured a maximum smooth-point gradient error below 3.73e-8. Tested 1,440 optimizer trajectories at parameter extremes, keeping divergence explicit and the last finite state inspectable. The default Adam ravine run reached loss 0.000558 at step 100. Engine-first checkpoint: 308 tests passed before implementing the lab UI and translations.

All five gates passed. 311 Vitest + 48 Playwright. Built JavaScript totals 285.8 KiB gzip across all chunks.

### M14 — compare guided diffusion and flow on matched particle clouds

Added four seeded two-class manifolds, exact empirical mixture fields, strided DDPM, deterministic DDIM, midpoint flow, quiver grids and a cancellable local Web Worker. Across 288 configurations, 864 full solvers produced 4,095,360 finite coordinates. On the 20-step unconditional cosine moons run, mean manifold distance decreased 94.65% for DDIM and 97.02% for flow. All three guided solvers reached 100% Class A purity at CFG 2 for this seed. Engine-first checkpoint: 344 tests passed before implementing the lab UI and translations.

All five gates passed. 348 Vitest + 52 Playwright. Built JavaScript totals 299.4 KiB gzip across all chunks.

### M15 — publish the bilingual release and verify all twelve labs

Shipped 12 bilingual labs and 36 guided challenges. Reached all 36 completion states in real Chromium sessions. Verified that all 45 preset shortcuts reproduce the full workbench button state, including its step, and accept explicit URL overrides. The command palette searches presets in both languages and restores same-lab browser history.

The 96-case browser matrix covers each lab in both languages, both themes, and at 1440×900 and 390×844. Every case changed a preset and step, opened the copied link in a fresh document, and checked the restored state. Download checks read the PNG signature, exact 2× dimensions and nonblank stage pixels. The matrix recorded zero page errors, console warnings/errors or horizontal overflow. All 12 labs also recovered from four malformed URL configurations each.

Runtime network inspection measured 99,613 bytes of gzipped JavaScript on the landing page. Each of the 12 lab entries was fetched on first navigation, with zero cross-origin HTTP requests in the landing and route sweep. The production build now enforces the 200 kB landing budget and separate dynamic lab entries. Audited bilingual dictionaries and source reachability, removed the obsolete route placeholder, and fixed the light-theme selected mantissa text to reach 4.81:1 contrast. Added English and Chinese READMEs, real workbench screenshots, and a contributor guide for Lab 13. GitHub Pages deployment is configured for a repository with an upstream remote.

All five gates passed. 395 Vitest + 126 Playwright. Built JavaScript totals 304.4 KiB gzip across all chunks.

### Post-release — responsive inspection and reproducible exports

The tablet inspector opens beside the stage and restores keyboard focus after dismissal or rotation. Phone users can move between the graph and the active parameters. The catalog keeps its filters and originating card when returning from a lab. Bilingual lab and preset searches work together in the command palette, including short landscape screens.

Narrow chart axes now use readable type, wide charts map pointer coordinates through their actual SVG transform, and scrolling across a chart on a phone preserves the selected step. Quantization and LoRA support precise matrix-cell inspection with the keyboard. Diffusion compares the selected particle's path length and displacement across solvers. Share links preserve the selected particle, residual channel, FlashAttention sequence length, KV probe and long attention tokens. PNG export freezes all visual layers at click time and clips scrolled content to its visible area.

Additional browser sweeps exercised all 12 labs at five phone and tablet widths, in both languages and both themes (240 configurations). Thirty long-input cases covered BPE and attention with continuous ASCII, Chinese, emoji and URL punctuation. Slow-decoding LoRA exports retained the values from the selected frame, and exported BPE tokens stayed inside the scrolled panel.

All five verification gates passed. Vitest ran 397 tests. Playwright ran 228 tests on desktop and mobile Chromium, tablet WebKit and laptop Firefox. The landing page loaded 100,124 bytes of gzipped JavaScript, with separate lazy entries for all 12 labs.


### M16 — prediction, retrieval and preference learning

Three new offline, bilingual workbenches bring the catalog to 15 labs and 45 guided challenges. Each exposes its intermediate calculations through keyboard-accessible controls, presets, shareable selections and PNG export.

- **Next-token loss and perplexity.** Two predictors can both score 6/7 correct and assign different losses to the held-out sequence. A uniform four-note predictor has perplexity 4. An empty scoring mask leaves the mean and perplexity undefined.
- **Hybrid retrieval and rank fusion.** BM25 and three explicitly authored topic features rank six repair cards. With the mixed query, D02 ranks second on both source lists and first after reciprocal rank fusion at a smoothing constant of 60.
- **Direct preference optimization.** In the reversal preset, 2 of 20 votes favor A while the frozen policy generates A with probability 0.8. After 60 gradient updates, the policy generates A with probability about 0.308 and predicts an A-preference frequency of about 0.100.

All nine new challenges were solved on desktop and mobile. A separate layout sweep exercised each new lab at 320, 390, 820 and 1440 CSS pixels, in both languages and both themes. All 48 combinations had zero horizontal overflow or browser warnings and errors.

All five verification gates passed. 438 Vitest tests and 270 Playwright tests passed. The production landing bundle used 101,312 bytes gzip and all 15 lab entries loaded separately.
