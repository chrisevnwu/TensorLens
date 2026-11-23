# TensorLens — Product Requirements Document (PRD)

> **Product Name**: **TensorLens** — *Interactive AI & LLM Internals Lab*
> **Chinese Subtitle**: **TensorLens — 现代 AI 与大模型底层原理交互实验室**
> **License**: MIT Open Source
> **Deployment**: 100% Static Web App (GitHub Pages / Vercel / Local Offline) — Zero Backend, Zero API Keys.

---

## 1. Product Vision & Positioning

### 1.1 Problem Statement
Modern AI/LLM concepts (BPE subwords, RoPE rotation, Scaled Dot-Product Attention, KV Cache memory bottlenecks, FlashAttention SRAM tiling, MoE load balancing, INT4/NF4 quantization, Flow Matching) are notoriously hard to internalize from static equations or passive videos alone. Existing tutorials either oversimplify with fake diagrams or require spinning up PyTorch notebooks and GPUs.

### 1.2 Solution
**TensorLens** is an open-source, browser-native interactive laboratory featuring **18 mathematically authentic visual sandboxes** spanning the entire modern LLM & generative AI stack. Every visualization is backed by real, deterministic TypeScript numerical engines running locally at 60fps — allowing users to tweak parameters, inject edge cases (outliers, network collapses, temperature extremes), step forward/backward through computations, and inspect exact tensor values in real time.

### 1.3 Core Product Pillars
1. **Real Math, Not Mock Animations**: Every pixel reflects live computations (actual dot products, IEEE-754 bit rounding, Online Softmax tile rescaling, Jacobi SVD, reverse-mode autograd, closed-form diffusion score fields).
2. **Unified Lab Workbench**: All 18 labs share one cohesive, Linear/3Blue1Brown-inspired precision workbench so learners never have to relearn UI navigation.
3. **Active Discovery (Guided Challenges)**: Every lab includes 3 bite-sized interactive missions ("Cause softmax saturation by disabling $\sqrt{d_k}$ scaling", "Eliminate token dropping in MoE") that auto-verify as the user experiments.
4. **Global Open-Source First**: Default English UI with one-click Simplified Chinese switching, shareable deep-link URLs capturing exact experiment parameters, and PNG/SVG snapshot export for blog posts, slides, and classrooms.

---

## 2. Target Audience

- **ML / AI Engineers & Software Developers**: Building intuition for inference optimization (KV Cache, GQA/MLA, FlashAttention, Quantization, LoRA).
- **CS Students & Researchers**: Exploring mathematical mechanisms interactively alongside papers and textbooks.
- **Tech Educators, Bloggers & Conference Speakers**: Exporting high-DPI light/dark diagrams and sharing live interactive links (`#/labs/rope?base=500000&m=12`) directly in articles and talks.

---

## 3. Curriculum & 18-Lab Catalog

The 18 labs are organized into **4 progressive chapters** forming a complete learning journey:

| Chapter | # | Lab ID | English Title | Chinese Title | Core Mechanism Visualized |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **I. Sequence & Attention** | 01 | `bpe-tokenizer` | BPE Tokenizer & Subword Lab | 分词器与 BPE 合并实验室 | Byte-level BPE merge tree, UTF-8 byte fallback, CJK vs EN compression |
| | 02 | `embeddings-rope` | Embeddings & RoPE Geometry | 词嵌入与 RoPE 旋转位置编码 | 2D complex rotation planes, relative-distance invariance, NTK/YaRN context scaling |
| | 03 | `attention-debugger` | Multi-Head Attention Debugger | 自注意力与多头注意力调试器 | $QKV \to QK^T/\sqrt{d_k} \to \text{Mask} \to \text{Softmax} \to V$ stepper, MHA/MQA/GQA topology |
| **II. Architecture & Inference** | 04 | `norm-residual` | LayerNorm, RMSNorm & Residual Stream | 归一化与残差流实验室 | Pre-Norm vs Post-Norm, LayerNorm vs RMSNorm, SwiGLU, multi-layer variance propagation |
| | 05 | `kv-cache-profiler` | KV Cache & Prefill/Decode Profiler | KV Cache 与推理显存剖析器 | Autoregressive $O(n^2)$ vs $O(n)$, Prefill/Decode timeline, Roofline model, MHA/GQA/MLA VRAM |
| | 06 | `flash-attention` | FlashAttention Tiling & SRAM Simulator | FlashAttention 分块与显存层级模拟 | GPU HBM vs SRAM blocks, Online Softmax $(m_i, l_i)$ rescaling, HBM byte traffic counter |
| | 07 | `moe-routing` | MoE Router & Load Balancing | MoE 稀疏路由与负载均衡沙盒 | Token-to-Expert Sankey routing, Top-$K$ gating, capacity factor token drops, expert collapse vs aux-loss |
| **III. Efficiency & Alignment** | 08 | `quantization` | Quantization & Precision Loss Lab | 量化与精度损失实验室 | IEEE-754 bit inspector (FP32/BF16/FP8), INT8/INT4/NF4, group-wise vs per-tensor outlier resilience |
| | 09 | `decoding-sampling` | Decoding & Sampling Playground | 文本解码与采样策略实验室 | Temperature, Top-$K$, Top-$P$, Min-$P$, repetition penalty, Beam Search tree & Monte Carlo rollouts |
| | 10 | `lora-svd` | LoRA & Low-Rank SVD Lab | LoRA 低秩微调与 SVD 谱分析 | Frozen $W_0 + \frac{\alpha}{r}BA$, live SVD spectrum, in-browser gradient fitting, Full FT vs LoRA vs QLoRA memory |
| **IV. Training & Generative** | 11 | `backprop-optimizers` | Autograd & Optimizers Arena | 反向传播计算图与优化器竞技场 | Interactive forward/backward DAG + SGD/Momentum/RMSProp/Adam/AdamW 2D loss landscape race |
| | 12 | `diffusion-flow` | Diffusion & Flow Matching Lab | 扩散模型与 Flow Matching 去噪实验室 | Forward noise schedule, exact analytical score field, DDPM vs DDIM vs Flow Matching & CFG |
| **IV. Training & Generative** | 13 | `language-model-loss` | Next-Token Loss & Perplexity | 下一词元损失与困惑度 | Score the observed token, mask positions, compare confidence at equal accuracy |
| **II. Architecture & Inference** | 14 | `hybrid-retrieval` | Hybrid Retrieval & Rank Fusion | 混合检索与排序融合 | Inspect BM25, cosine similarity, reciprocal rank fusion and Recall@K |
| **III. Efficiency & Alignment** | 15 | `preference-dpo` | Direct Preference Optimization | 直接偏好优化（DPO） | Fit a two-completion policy using preference pairs and a frozen reference |
| **III. Efficiency & Alignment** | 16 | `knowledge-distillation` | Knowledge Distillation | 知识蒸馏 | Compare two students as the teacher changes its runner-up |
| **II. Architecture & Inference** | 17 | `speculative-decoding` | Speculative Decoding | 投机解码 | Verify draft blocks and recover the target token distribution |
| **IV. Training & Generative** | 18 | `image-text-contrastive` | Image–Text Contrastive Learning | 图文对比学习 | Match shapes to captions by inspecting both directions of a contrastive loss |

---

## 4. Information Architecture & Core Pages

### 4.1 Global Navigation Shell
- **Top Header (`56px` fixed height)**:
  - Left: TensorLens geometric logo + link to Home, plus active Lab breadcrumb & quick switcher dropdown.
  - Center/Right:
    - Command Palette trigger (`⌘K` / `Ctrl+K`) — instant fuzzy search across all 18 labs, concepts, and presets in both English and Chinese.
    - Progress Ring pill (e.g., `4 / 54 Challenges`) linking to progress overview.
    - Language switcher (`EN | 中文`) — instant zero-reload switching persisted in `localStorage`.
    - Theme toggle (Dark / Light) — instant zero-flicker CSS variable swap persisted in `localStorage` (respecting `prefers-color-scheme` on first visit, defaulting to Dark on unspecified).
    - GitHub repository icon link.

### 4.2 Landing / Explorer Page (`#/`)
- **Hero Section**:
  - High-craft animated ambient hero canvas (subtle interactive vector-field / attention-arc mesh running live at 60fps in the background, honoring `prefers-reduced-motion`).
  - Clear value proposition headline, subtitle, primary CTA ("Start with Lab 01: BPE Tokenizer" or "Continue where you left off"), and secondary CTA ("Browse All 18 Labs").
  - Compact 3-stat strip: `18 Interactive Labs` · `54 Guided Challenges` · `100% Browser-Native Math`.
- **Interactive Learning Path & Filterable Catalog**:
  - Chapter tabs (`All`, `I. Sequence & Attention`, `II. Architecture & Inference`, `III. Efficiency & Alignment`, `IV. Training & Generative`) + Difficulty filter (`Foundational`, `Intermediate`, `Advanced`).
  - Lab cards arranged in a clean responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile). Each card shows:
    - Lab number (`01`–`18`), difficulty badge, and completion indicator (`0/3`–`3/3` challenges).
    - Custom crisp SVG schematic preview icon unique to that lab.
    - Title, one-line punchy description, and 2–3 concept tags (e.g. `Online Softmax`, `SRAM`, `HBM`).

### 4.3 Unified 4-Zone Lab Workbench (`#/labs/:labId`)
Every one of the 18 labs MUST render inside the standardized **`LabShell`** layout:

```text
+-----------------------------------------------------------------------+
| Global Header (56px): Logo | Chapter / Lab Switcher | ⌘K | EN/中 | ☀/☾ |
+-----------------------------------------------------------------------+
| Lab Action Bar (44px): Title | Presets | Share URL | Export PNG | Reset |
+-----------------+-----------------------------------+-----------------+
| Left Control    | Center Visualization Stage        | Right Inspector |
| Panel (280-310) |                                   | Drawer (300-340)|
|                 | +-------------------------------+ |                 |
| [Presets]       | | Live KaTeX Formula Bar        | | [Key Metrics]   |
| [Parameters]    | +-------------------------------+ |  KPI Grid (2x2) |
|  - Sliders      |                                   |                 |
|  - Segmented    |   Primary SVG / Canvas Stage      | [Live Inspector]|
|  - Toggles      |   (Hover/Click cross-linked,      |  Hovered cell / |
|                 |    fluid resize, HiDPI crisp)     |  token / node   |
| [Guided         |                                   |  numerical data |
|  Challenges]    | +-------------------------------+ |                 |
|  [ ] Mission 1  | | Stepper / Playback Controls   | | [Concept Guide] |
|  [x] Mission 2  | | ⏮ ◀ ▶ ⏭  Step 2/6  [Speed 1x] | |  Current step   |
|  [ ] Mission 3  | +-------------------------------+ |  explanation &  |
|                 |                                   |  LLM context    |
+-----------------+-----------------------------------+-----------------+
| Bottom Lab Navigation Strip: ← Previous Lab | Next Lab →              |
+-----------------------------------------------------------------------+
```

#### Responsive Breakpoints
- **Desktop (`>= 1280px`)**: Full 3-column workbench (`Left Rail` + `Center Stage` + `Right Inspector`, with collapse toggles for both side panels to give the visualization full width).
- **Tablet (`768px – 1279px`)**: Left Controls + Center Stage visible; Right Inspector collapses into a toggleable slide-over drawer or tabbed section below the stage.
- **Mobile (`< 768px`)**: Stacked vertical flow: Action Bar → Primary Stage + Stepper → Tabbed Drawer (`Controls` | `Inspector & Math` | `Challenges`). Zero horizontal page overflow allowed.

### 4.4 Shared Cross-Lab Productivity Features
1. **Shareable Experiment URLs**: Clicking **Share URL** encodes the current lab parameters (and active step) into URL query params (`#/labs/quantization?fmt=int4&group=32&outlier=8.5`), copies to clipboard, and shows a toast confirmation. Opening that URL restores the exact experiment state.
2. **One-Click Snapshot Export**: Clicking **Export PNG** captures the active visualization stage (supporting both Canvas and inline SVG serialization with theme background and subtle TensorLens watermark footer) and downloads a crisp 2× HiDPI PNG.
3. **Guided Challenges System**:
   - Each lab defines 3 concrete missions designed to teach an "aha!" moment.
   - As the user adjusts controls or steps through computations, the app evaluates each mission's predicate in real time.
   - When achieved, the mission checks off with a subtle celebration pulse, saves completion to `localStorage`, and unlocks an expandable "Why this happened" insight note.
4. **Keyboard Shortcuts**:
   - `⌘K` / `Ctrl+K`: Open Global Command Palette.
   - `Space`: Play / Pause active simulation or stepper (when not focused in a text input).
   - `←` / `→`: Previous / Next step in Stepper labs.
   - `R`: Reset current lab to active preset defaults.
   - `Escape`: Close modals/command palette/drawers.

---

## 5. Design System & Visual Direction

### 5.1 Aesthetic Identity
**Modern Geek Lab** — inspired by **Linear** (crisp borders, disciplined hierarchy, subtle translucent surfaces, keyboard-first ergonomics) and **3Blue1Brown** (luminous mathematical accents, clear vector geometry, high-contrast visual encoding against deep slate canvases).

### 5.2 Semantic Color Tokens (Dark & Light Parity)

| Token | Dark Theme (Default) | Light Theme | Usage |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#0B0D12` | `#F8FAFC` | Main app background |
| `--bg-surface` | `#12161F` | `#FFFFFF` | Cards, panels, workbench rails |
| `--bg-elevated` | `#1A202E` | `#F1F5F9` | Hover rows, active pills, tooltips |
| `--border-subtle` | `rgba(255,255,255,0.08)` | `rgba(15,23,42,0.09)` | Hairline structural dividers |
| `--border-strong` | `rgba(255,255,255,0.16)` | `rgba(15,23,42,0.18)` | Active inputs, focused cards |
| `--text-primary` | `#F1F5F9` | `#0F172A` | Headings, key metrics |
| `--text-secondary` | `#94A3B8` | `#475569` | Descriptions, axis labels |
| `--text-muted` | `#64748B` | `#64748B` | Hints, secondary metadata |
| `--accent-primary` | `#38BDF8` (Cyan/Sky) | `#0284C7` | Active selection, Query ($Q$), primary flows |
| `--accent-secondary` | `#A78BFA` (Violet) | `#7C3AED` | Key ($K$), RoPE angles, secondary trajectories |
| `--accent-tertiary` | `#34D399` (Emerald) | `#059669` | Value ($V$), completed challenges, optimal bounds |
| `--accent-warn` | `#FBBF24` (Amber) | `#D97706` | Quantization error, capacity warning, outliers |
| `--accent-danger` | `#FB7185` (Rose) | `#E11D48` | Token drops, divergence, overflow, gradient explosion |

### 5.3 Data Visualization Colormaps (Colorblind-Safe)
- **Sequential Attention / Density Ramp**: Custom perceptually uniform **Viridis/Plasma-inspired** ramp (`--bg-elevated` → `#1E3A8A` → `#0EA5E9` → `#34D399` → `#FDE047` in dark mode; crisp white-to-indigo-to-cyan ramp in light mode).
- **Diverging Signed Tensor Ramp** (negative ↔ zero ↔ positive for weights, logits, gradients, quantization errors): Rose (`#E11D48`) ↔ Neutral Surface ↔ Sky (`#0284C7`).
- **Categorical Series (up to 8 experts / heads / optimizers)**: Perceptually distinct palette (`Sky`, `Violet`, `Emerald`, `Amber`, `Rose`, `Teal`, `Orange`, `Indigo`).

### 5.4 Typography & Numeric Precision
- **UI Sans**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `"PingFang SC"`, `"Noto Sans SC"`, `sans-serif`.
- **Code / Tensors / Metrics**: `JetBrains Mono`, `ui-monospace`, `SFMono-Regular`, `monospace` with `font-variant-numeric: tabular-nums` enforced on ALL numeric readouts, sliders, matrix cells, and tables so live updates never jitter horizontally.
- **Equations**: Rendered via **KaTeX** with live variable substitution highlights matching the active visual accent color (e.g., $Q$ in cyan, $K$ in violet, $V$ in emerald).

### 5.5 Motion & Micro-Interactions
- Transitions are fast and functional (`150ms–220ms cubic-bezier(0.16, 1, 0.3, 1)`).
- Simulation loops target `60fps` via `requestAnimationFrame` with delta-time clamping.
- Respect `@media (prefers-reduced-motion: reduce)` by disabling ambient landing animations and snapping transitions.

---

## 6. Bilingual i18n Specification

- **Default Locale**: English (`en`).
- **Secondary Locale**: Simplified Chinese (`zh`).
- **Technical Terminology Consistency**: Keep globally recognized ML abbreviations and identifiers clear in Chinese mode by using natural bilingual phrasing on first mention or keeping canonical symbols (e.g., `KV Cache 显存缓存`, `RoPE 旋转位置编码`, `Top-P 核采样`, `Online Softmax 在线归一化`, `Per-Group 分组量化`).
- **Zero Untranslated Leakage**: All labels, challenge prompts, step explanations, preset names, KPI tooltips, and landing page copy MUST switch cleanly without page reload.

---

## 7. Non-Functional Requirements

| Category | Requirement |
| :--- | :--- |
| **Performance** | Initial landing page JS bundle `< 200 KB` gzipped (each lab lazy-loaded in its own chunk). Interactive parameter drag latency `< 16ms` (60fps) for all sliders. |
| **Determinism** | Identical parameters + seed ALWAYS produce bit-identical numerical results across runs and browsers. |
| **Accessibility** | All interactive buttons/sliders/tabs keyboard-navigable, proper `aria-label` on icon buttons, WCAG AA contrast in both themes. |
| **Offline & Static** | Zero runtime external API calls. Fonts degrade gracefully to system fonts offline; KaTeX CSS/fonts bundled locally via npm. |
| **Browser Support** | Latest 2 versions of Chrome, Safari, Firefox, and Edge on desktop and mobile viewports. |
| **Open-Source Readiness** | Root `README.md` (EN) + `README.zh-CN.md` (ZH), `LICENSE` (MIT), `CONTRIBUTING.md` (with step-by-step guide to author Lab #13 using the plugin SDK), GitHub Actions CI + GitHub Pages deploy workflow. |
