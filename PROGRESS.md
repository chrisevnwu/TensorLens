# TensorLens — Autonomous Build Progress Log

> Automatically updated by the coding agent upon completing each milestone (`M0`–`M15`).

| Milestone | Status | Summary | Tests Passed | Build Status | Commit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `M0` | Complete | bootstrap the static React workspace and verification pipeline | 1 Vitest + 2 Playwright | Pass | `feat(M0)` |
| `M1` | Complete | ship the bilingual explorer and application shell | 5 Vitest + 4 Playwright | Pass | `feat(M1)` |
| `M2` | Complete | implement numerical kernels and the shared lab workbench | 58 Vitest + 4 Playwright | Pass | `feat(M2)` |
| `M3` | Complete | teach byte-level BPE through ranked merges and byte inspection | 75 Vitest + 8 Playwright | Pass | `feat(M3)` |
| `M4` | Pending | Lab 02: Embeddings & RoPE Geometry | — | — | — |
| `M5` | Pending | Lab 03: Multi-Head Attention Debugger | — | — | — |
| `M6` | Pending | Lab 04: LayerNorm, RMSNorm & Residual Stream | — | — | — |
| `M7` | Pending | Lab 05: KV Cache & Prefill/Decode Profiler | — | — | — |
| `M8` | Pending | Lab 06: FlashAttention Tiling & SRAM Simulator | — | — | — |
| `M9` | Pending | Lab 07: MoE Router & Load Balancing Sandbox | — | — | — |
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
