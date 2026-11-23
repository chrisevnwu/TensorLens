# TensorLens — Autonomous Build Progress Log

> Automatically updated by the coding agent upon completing each milestone (`M0`–`M15`).

| Milestone | Status | Summary | Tests Passed | Build Status | Commit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `M0` | Complete | bootstrap the static React workspace and verification pipeline | 1 Vitest + 2 Playwright | Pass | `feat(M0)` |
| `M1` | Pending | Design system, EN/ZH i18n, global shell & landing page | — | — | — |
| `M2` | Pending | Core pure-TS math engine & shared workbench SDK | — | — | — |
| `M3` | Pending | Lab 01: BPE Tokenizer & Subword Lab | — | — | — |
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
