# TensorLens — Autonomous Build Progress Log

> Automatically updated by the coding agent upon completing each milestone (`M0`–`M15`).

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
| `M9` | Complete | simulate sparse expert routing and load balancing | 190 Vitest + 32 Playwright | Pass | `feat(M9)` |
| `M10` | Pending | Lab 08: Quantization & Precision Loss Lab | — | — | — |
| `M11` | Pending | Lab 09: Decoding & Sampling Playground | — | — | — |
| `M12` | Pending | Lab 10: LoRA & Low-Rank SVD Lab | — | — | — |
| `M13` | Pending | Lab 11: Autograd & Optimizers Arena | — | — | — |
| `M14` | Pending | Lab 12: Diffusion & Flow Matching Denoising Lab | — | — | — |
| `M15` | Pending | Final polish, 12-lab audit & open-source release pack | — | — | — |

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
