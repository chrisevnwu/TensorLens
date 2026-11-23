# TensorLens — 12 Interactive Lab Specifications

This document is the authoritative mathematical, functional, visual, and testing specification for every lab (`01` through `12`). Every formula here MUST be implemented authentically in `src/engine/labs/<lab-id>/` with zero faked numbers.

---

## Chapter I: Sequence & Attention

---

### Lab 01: BPE Tokenizer & Subword Lab (`bpe-tokenizer`)
- **Difficulty**: Foundational | **Tags**: `BPE`, `UTF-8`, `Subwords`, `Compression`

#### 1. Mathematical & Algorithmic Model
- Operates on real UTF-8 bytes (`new TextEncoder().encode(text)` → initial token IDs `0..255`).
- **Interactive BPE Training Mode**: Given a training corpus string and target `numMerges` (`0..60`):
  - Count all adjacent token pairs `(a, b)` inside pre-tokenized whitespace/punctuation word chunks (GPT-2-style pre-split so merges don't cross spaces unexpectedly, with a toggle to compare raw unsplit BPE vs pre-split BPE).
  - Select the highest-frequency pair; break ties deterministically by lexicographically smallest `(a, b)`.
  - Assign new token ID `256 + step`, replace all non-overlapping left-to-right occurrences of `(a, b)`, and record the merge rule `{ step, left, right, newId, count, bytes, displayText }`.
- **Encode / Decode Inspector**: Apply learned merge rules in exact rank order to any user-editable test input text; decode back to UTF-8 bytes via `TextDecoder` (gracefully marking incomplete multi-byte UTF-8 fragments with hex byte chips like `<0xE4>`).

#### 2. Presets & Controls
- **Presets**:
  1. `Multilingual Compare` (English + Chinese + Emoji + Python snippet)
  2. `Code Indentation` (Python/JSON with repeated spaces & brackets)
  3. `Morphology & Numbers` (English prefixes/suffixes + arithmetic digits like `2026`, `99999`)
- **Controls**:
  - Editable Training Corpus textarea (with preset selector)
  - Editable Test Prompt textarea
  - `numMerges` slider (`0` to `50`, default `20`)
  - `preTokenize` toggle (GPT-style word-boundary regex split ON/OFF)
  - `showByteHex` toggle (reveal raw UTF-8 hex bytes under every token chip)

#### 3. Visual Stage & Stepper
- **Tokenized Stream View**: Color-coded interactive token chips for the Test Prompt. Hovering/clicking any token highlights its binary **BPE Merge Tree** (showing recursive constituent sub-tokens down to raw UTF-8 bytes) in the Right Inspector.
- **Merge Timeline & Compression Chart (SVG)**: Dual curve showing `Token Count` (dropping) and `Chars / Token` compression ratio (rising) across merge steps `0..numMerges`, with a vertical playhead synced to the **Stepper**.
- **Stepper**: Steps `0..numMerges`, highlighting in the corpus all occurrences of the pair being merged at the current step.
- **Metrics**: `Token Count`, `UTF-8 Bytes`, `Chars / Token`, `Vocab Size`.

#### 4. Guided Challenges (3)
1. **UTF-8 Tax on CJK/Emoji**: Switch to or type Chinese/Emoji text at `0` merges and observe >2.5 bytes/char (`utf8Bytes / charCount >= 2.0 && currentStep === 0`).
2. **Double the Compression**: Advance merges until test prompt compression reaches `>= 2.2` bytes/token (`bytesPerToken >= 2.2`).
3. **Inspect a Recursive Merge**: Click a token chip whose merge tree depth is `>= 3` (`selectedTokenDepth >= 3`).

#### 5. Mandatory Engine Unit Tests
- Round-trip identity: `decode(encode(text, rules), vocab) === text` for ASCII, Chinese, Japanese, Emoji (`🚀🧠`), and mixed control punctuation.
- Monotonic compression: total token count on the training corpus is monotonically non-increasing as `step` increases from `0` to `numMerges`.
- Determinism: identical corpus & config produces identical merge rules on repeated runs.

---

### Lab 02: Embeddings & RoPE Positional Geometry (`embeddings-rope`)
- **Difficulty**: Intermediate | **Tags**: `RoPE`, `Sinusoidal`, `Long Context`, `NTK`

#### 1. Mathematical Model
- Embedding dimension $d \in \{8, 12, 16\}$ (default `8`, giving $d/2 = 4$ orthogonal 2D frequency planes $i = 0, \dots, d/2 - 1$).
- Base frequency $\theta_i = \text{base}^{-2i/d}$ (default $\text{base} = 10000$, customizable via slider / presets: `100` toy, `10,000` Llama 1/2, `500,000` Llama 3).
- **RoPE Transform** at position $m$ on each pair $(x_{2i}, x_{2i+1})$:
  $$\begin{pmatrix} x'_{2i} \\ x'_{2i+1} \end{pmatrix} = \begin{pmatrix} \cos(m_{\text{eff}} \theta_i) & -\sin(m_{\text{eff}} \theta_i) \\ \sin(m_{\text{eff}} \theta_i) & \cos(m_{\text{eff}} \theta_i) \end{pmatrix} \begin{pmatrix} x_{2i} \\ x_{2i+1} \end{pmatrix}$$
- **Long-Context Scaling Modes** with scale factor $s \in [1, 8]$:
  - `none`: $m_{\text{eff}} = m$, $\theta_i = \text{base}^{-2i/d}$
  - `pi` (Position Interpolation): $m_{\text{eff}} = m / s$
  - `ntk` (NTK-Aware Scaling): $\text{base}' = \text{base} \cdot s^{d/(d-2)}$
- **Comparison Mode**: Also compute classic Additive Sinusoidal PE $\text{PE}(m, 2i) = \sin(m \theta_i), \text{PE}(m, 2i+1) = \cos(m \theta_i)$ and compare dot-product decay curves $\langle q_m, k_n \rangle$ vs relative distance $\Delta = m - n$.

#### 2. Controls & Presets
- **Presets**: `Standard RoPE (base=10k)`, `Llama-3 Long Context (base=500k)`, `High-Frequency Demo (base=100)`, `Position Interpolation (4x)`.
- **Controls**:
  - Query position $m$ slider (`0..64`, default `12`)
  - Key position $n$ slider (`0..64`, default `5`)
  - `Shift Both (m+k, n+k)` offset slider (`0..32`) to prove relative invariance live!
  - `ropeBase` selector/slider (`100`, `1000`, `10000`, `500000`)
  - `dim` segmented control (`8`, `12`, `16`)
  - `scalingMode` segmented control (`None`, `PI`, `NTK`) + `scaleFactor` slider (`1..8`)
  - `compareSinusoidal` toggle

#### 3. Visual Stage
- **Multi-Plane 2D Polar Wheel Grid (SVG)**: Displays all $d/2$ 2D rotation planes side-by-side (`Plane 0: High Freq` → `Plane d/2-1: Low Freq`), showing original $q, k$ ghost vectors, rotated $R_m q$ (Cyan) and $R_n k$ (Violet), and the highlighted arc angle $(m - n)\theta_i$ between them!
- **Relative Distance Decay Plot (SVG)**: Curves of $\langle R_m q, R_n k \rangle$ across $\Delta \in [0, 64]$ comparing `None`, `PI`, and `NTK` (or Sinusoidal vs RoPE), with a live draggable marker at current $|m - n|$.
- **Metrics**: `Relative Offset (m - n)`, `RoPE Dot Product`, `Absolute Norm Preservation (||Rq||/||q||)`, `Fastest Plane Angle`.

#### 4. Guided Challenges (3)
1. **Verify Relative-Distance Invariance**: Move the `Shift Both` offset slider (`offset >= 5`) while keeping $m - n$ unchanged and observe exact dot-product invariance.
2. **Norm Preservation**: Inspect rotating vectors at $m \ge 20$ and confirm `||R_m q|| === ||q||` (orthogonal rotation preserves vector length).
3. **Long-Context Extrapolation**: Switch `scalingMode` to `NTK` with `scaleFactor >= 4` and observe how high-frequency planes retain sharp local resolution compared to naive `PI`.

#### 5. Mandatory Engine Unit Tests
- Exact orthogonality: $\|R_m x\|_2 = \|x\|_2$ within `1e-10` for arbitrary $m, x, \text{base}$.
- Exact relative invariance: $\text{dot}(R_m q, R_n k) = \text{dot}(R_{m+c} q, R_{n+c} k)$ within `1e-10` for any shift $c \in \mathbb{Z}$.
- Zero rotation at origin: $R_0 x = x$ exactly.
- NTK effective base strictly increases when $s > 1$ and $d > 2$.

---

### Lab 03: Multi-Head Attention Debugger (`attention-debugger`)
- **Difficulty**: Foundational | **Tags**: `Self-Attention`, `Softmax`, `Causal Mask`, `MHA/GQA/MQA`

#### 1. Mathematical Model
- Preset short meaningful sentences (5–7 tokens, e.g., `["The", "cat", "sat", "on", "the", "mat"]`, `["LLM", "attends", "to", "past", "tokens", "only"]`, or user custom comma/space tokens up to 8 tokens).
- Deterministic seeded embeddings $X \in \mathbb{R}^{N \times d}$ ($d = 12$) and head projections $W_Q^{(h)}, W_K^{(h)}, W_V^{(h)} \in \mathbb{R}^{d \times d_k}$ structured so different heads visibly specialize (e.g., Head 0: local previous-token focus; Head 1: self/identity focus; Head 2: semantic similarity; Head 3: broad context).
- Pipeline computations:
  1. $Q = X W_Q$, $K = X W_K$, $V = X W_V$
  2. Raw scores $S = (\sigma_{\text{scale}} Q)(\sigma_{\text{scale}} K)^T$ (where `logitScale` slider $\in [0.5, 4.0]$ lets users simulate larger embedding dims/magnitudes)
  3. Scaled scores: $S' = S / \sqrt{d_k}$ if `useScaling` is ON, else $S' = S$
  4. Masking: `causal` ($S'_{ij} = -\infty$ for $j > i$), `bidirectional` (none), or `sliding` ($j > i$ or $i - j \ge w$)
  5. Softmax weights $A = \text{rowSoftmax}(S')$, plus mean Shannon entropy $H = -\frac{1}{N}\sum_{i,j} A_{ij} \ln(A_{ij} + \epsilon)$
  6. Output $O = A V$ and multi-head concat $O_{\text{all}} W_O$.
- **Attention Topology Comparator**: Computes exact KV projection parameter counts and KV head sharing links for `MHA` ($H_{kv}=H_q$), `GQA` ($H_{kv}=2$), and `MQA` ($H_{kv}=1$).

#### 2. Controls & Presets
- **Presets**: `Causal Decoder (GPT)`, `Bidirectional Encoder (BERT)`, `Softmax Saturation Demo` (scaling OFF + high logitScale), `Sliding Window (Mistral)`.
- **Controls**:
  - Editable token chips (up to 8 tokens)
  - `numHeads` (`1`, `2`, `4`), active `selectedHead` tab (`0..H-1`)
  - `useScaling` toggle (`1/√d_k` ON/OFF)
  - `logitScale` slider (`0.5` to `4.0`, default `1.0`)
  - `maskType` segmented (`Causal`, `Bidirectional`, `Sliding Window`) + `windowSize` slider (`2..5`)
  - `topology` segmented (`MHA`, `GQA`, `MQA`)

#### 3. Visual Stage & Stepper
- **6-Stage Stepper**: `1. Embeddings X` → `2. Project Q,K,V` → `3. Scores QKᵀ` → `4. Scale & Mask` → `5. Softmax Weights` → `6. Weighted Output AV`.
- **Interactive Stage**:
  - Top/Center: Live **Attention Heatmap Matrix** (`N × N`) paired side-by-side with an interactive **Token-to-Token Attention Arc Diagram** (curved Bézier ribbons whose thickness & opacity equal $A_{ij}$).
  - Hovering ANY cell $(i, j)$ or token $i$ cross-highlights the query vector $q_i$, key vector $k_j$, exact dot-product terms $\sum_m q_{im} k_{jm}$, raw score, scaled score, softmax weight, and value contribution $A_{ij} v_j$ in the Right Inspector!
  - Bottom sub-panel: Visual **MHA / GQA / MQA Head-Sharing Wiring Diagram** (SVG) showing how Query heads map to Key/Value heads.
- **Metrics**: `Mean Attention Entropy`, `Max Weight Peak`, `KV Head Sharing Ratio`, `Active Mask Density`.

#### 4. Guided Challenges (3)
1. **Trigger Softmax Saturation**: Turn `useScaling` OFF and raise `logitScale >= 2.5` until `meanEntropy < 0.35` (weights collapse toward one-hot spikes).
2. **Prevent Future Leakage**: Switch from `Bidirectional` to `Causal` mask and verify upper-triangular entries become exact `0.000`.
3. **Switch to GQA Memory Sharing**: Select `GQA` with `4` query heads and inspect the 2× KV head reduction in the topology diagram.

#### 5. Mandatory Engine Unit Tests
- Every row of $A$ sums to `1.0` within `1e-10`.
- Under `causal` mask, $A_{ij} === 0$ for all $j > i$.
- Under `sliding` mask with window $w$, $A_{ij} === 0$ for $j > i$ and for $i - j \ge w$.
- Disabling scaling with `logitScale > 1` strictly decreases or equals mean entropy compared to scaled scores on non-constant rows.
- Zero `NaN`/`Infinity` even when `logitScale = 4.0` or single-token input $N = 1$.

---

## Chapter II: Architecture & Inference

---

### Lab 04: LayerNorm, RMSNorm & Residual Stream (`norm-residual`)
- **Difficulty**: Intermediate | **Tags**: `Pre-Norm`, `RMSNorm`, `Residual`, `SwiGLU`

#### 1. Mathematical Model
- Simulates a real deep Transformer stack of $L \in [4, 32]$ layers with hidden width $d = 32$ and deterministic seeded weights $W_l \sim \mathcal{N}(0, \sigma_w^2 / d)$ (user-adjustable weight gain $\sigma_w \in [0.5, 2.0]$).
- Architecture modes:
  - `none`: $x_{l+1} = F_l(x_l)$ (or $x_l + F_l(x_l)$ if residual ON)
  - `post-norm`: $x_{l+1} = \text{Norm}(x_l + F_l(x_l))$
  - `pre-norm`: $x_{l+1} = x_l + F_l(\text{Norm}(x_l))$
- Norm types:
  - `layernorm`: $\frac{x - \mu}{\sqrt{\sigma^2 + \epsilon}}$
  - `rmsnorm`: $\frac{x}{\sqrt{\frac{1}{d}\sum x_i^2 + \epsilon}}$
- Activation types inside $F_l$: `ReLU`, `GELU`, `SwiGLU` ($\text{SiLU}(xW_1) \odot (xW_3)$).
- **Outlier Injection**: Adds a configurable spike `+outlierMag` (`0..20`) to channel `0` at layer `0` to observe how LayerNorm shifts the mean of all other channels while RMSNorm scales purely by root-mean-square.
- Computes at every layer $l = 0 \dots L$: vector L2 norm, mean, std, max-abs value, cosine similarity to $x_0$, and a backward gradient-norm propagation trace (backpropagating a unit vector through the exact layer Jacobians!).

#### 2. Controls & Presets
- **Presets**: `Modern LLM (Pre-RMSNorm + SwiGLU)`, `Classic Transformer (Post-LayerNorm)`, `Exploding Deep Net (No Norm, No Residual)`, `Outlier Stress Test`.
- **Controls**:
  - `numLayers` slider (`4..32`, default `16`)
  - `placement` segmented (`Pre-Norm`, `Post-Norm`, `No Norm`)
  - `normType` segmented (`RMSNorm`, `LayerNorm`)
  - `useResidual` toggle (`ON` / `OFF`)
  - `activation` segmented (`SwiGLU`, `GELU`, `ReLU`)
  - `weightGain` slider (`0.5..1.8`, default `1.1`)
  - `outlierMag` slider (`0..20`, default `0`)

#### 3. Visual Stage
- **Depth Trajectory Charts (SVG/Canvas)**: Synchronized dual chart across layers $0 \to L$:
  1. **Forward Activation Norm & Spread** (L2 norm + min/max band on log/linear scale).
  2. **Backward Gradient Norm Proxy** (showing vanishing/exploding gradients immediately when Residual or Pre-Norm is removed!).
- **Interactive Layer Slice Inspector**: Click any layer $l$ along the trajectory (or scrub with Stepper) to view the 32-channel bar distribution before & after Normalization side-by-side (`LayerNorm` vs `RMSNorm` difference highlighted).
- **Metrics**: `Final Layer L2 Norm`, `Grad Norm Ratio (L0/LL)`, `Signal Cosine Preservation`, `RMSNorm FLOPs Saved`.

#### 4. Guided Challenges (3)
1. **Witness Signal Collapse / Explosion**: Turn `useResidual` OFF and `placement` to `No Norm` at `numLayers >= 16` and observe norm divergence (`normRatio > 10 || normRatio < 0.05`).
2. **Rescue Gradients with Pre-Norm + Residual**: Enable `Pre-Norm` + `useResidual` at `numLayers >= 24` and confirm gradient norm stays healthy (`gradRatio >= 0.2 && gradRatio <= 5.0`).
3. **Compare LayerNorm vs RMSNorm Under Outliers**: Set `outlierMag >= 10` and toggle between `LayerNorm` and `RMSNorm` to see mean-centering shift vs pure RMS scaling.

#### 5. Mandatory Engine Unit Tests
- `layerNormVector` output has `|mean| < 1e-10` and `|variance - 1| < 1e-5` (for non-constant inputs).
- `rmsNormVector` output has `|rms - 1| < 1e-5` (for non-zero inputs).
- Pre-Norm with Residual keeps backward gradient norm `>= 1.0` (identity shortcut floor) across arbitrary depth.
- Clamping/safety: even with `No Norm` and `weightGain = 1.8` at 32 layers, finite guards prevent UI-crashing `NaN`.

---

### Lab 05: KV Cache & Prefill/Decode Profiler (`kv-cache-profiler`)
- **Difficulty**: Intermediate | **Tags**: `KV Cache`, `Prefill`, `Decode`, `Roofline`, `GQA/MLA`

#### 1. Mathematical Model
- **Part A — Interactive Autoregressive Stepper (Toy Model, $L=1$, $S_p=4$ prompt tokens + up to $8$ generated tokens)**:
  - Side-by-side execution matrix comparing **Without KV Cache** (recomputes full $t \times t$ attention and all $t$ projections of $K, V$ at step $t$, total FLOPs $\propto \sum_{t=1}^T t^2 = O(T^3)$) vs **With KV Cache** (Prefill computes $S_p \times S_p$, each Decode step computes only $1 \times t$ query against cached $K_{1..t}, V_{1..t}$, total FLOPs $\propto O(T^2)$).
  - Visualizes exact active matrix shapes: Prefill $(S_p \times d) \times (d \times S_p)$ vs Decode $(1 \times d) \times (d \times t)$.
- **Part B — Real-Scale LLM VRAM & Roofline Profiler**:
  - Configurable architecture presets (`Llama-3 8B`, `Qwen-2.5 32B`, `Llama-3 70B`, `DeepSeek-V3 MLA`, `Custom`) + hardware presets (`NVIDIA H100 SXM: 989 TFLOPs FP16, 3.35 TB/s`, `A100 80GB: 312 TFLOPs, 2.0 TB/s`, `RTX 4090: 165 TFLOPs, 1.0 TB/s`, `Apple M4 Max: 54 TFLOPs, 0.55 TB/s`).
  - Exact memory formulas:
    - Model weights bytes $= N_{\text{params}} \times b_{\text{weight}}$
    - Standard MHA/GQA KV Cache bytes $= 2 \cdot L \cdot H_{kv} \cdot d_{\text{head}} \cdot B \cdot S \cdot b_{\text{kv}}$
    - MLA KV Cache bytes $= L \cdot (d_c + d_r) \cdot B \cdot S \cdot b_{\text{kv}}$
  - Exact Prefill vs Decode **Arithmetic Intensity** ($\text{FLOPs} / \text{Bytes Loaded}$):
    - Prefill AI $\approx B \cdot S_p / b_{\text{weight}}$ (typically high → **Compute-Bound**)
    - Decode AI $\approx 2 \cdot N_{\text{params}} \cdot B / (N_{\text{params}} \cdot b_{\text{weight}} + \text{KV Bytes})$ (typically low at $B=1$ → **Memory-Bandwidth-Bound**)
    - Predicted `TTFT` (Time-To-First-Token, ms) and `TPOT` (Time-Per-Output-Token, ms / tokens/sec).

#### 2. Controls & Presets
- **Controls**:
  - `mode` toggle (`With KV Cache` vs `No KV Cache` highlight, plus side-by-side)
  - Model Preset & Hardware Preset dropdowns
  - `attentionType` segmented (`MHA`, `GQA`, `MQA`, `MLA`)
  - `contextLength` slider (`512` to `131072` log-scaled, default `8192`)
  - `batchSize` slider (`1` to `64`, default `1`)
  - `kvPrecision` segmented (`FP16`, `FP8`, `INT4`)

#### 3. Visual Stage & Stepper
- **Top Panel — Animated Prefill/Decode Token Matrix (SVG)**: Stepper steps from `Prefill` through `Decode Step 1..8`, highlighting newly computed cells (Cyan), cached reused KV slots (Emerald), and redundant recomputations avoided (Amber hatched).
- **Bottom Split Panels**:
  - **Left: VRAM Budget Bar & Breakdown (SVG)** — stacked bar (`Model Weights` + `KV Cache` + `Activations`) against GPU VRAM ceiling (flashing Rose `OOM` if exceeded!).
  - **Right: Interactive Log-Log Roofline Plot (SVG)** — draws the GPU hardware ridge point ($\text{Peak FLOPs} / \text{Bandwidth}$) and plots live dots for **Prefill** and **Decode** so users immediately see why Decode moves right toward the ridge as Batch Size increases!
- **Metrics**: `KV Cache VRAM (GB)`, `Decode Speed (tok/s)`, `Prefill TTFT (ms)`, `Bottleneck Regime (Memory vs Compute)`.

#### 4. Guided Challenges (3)
1. **Trigger KV Cache OOM**: Push `contextLength` and `batchSize` under `MHA` + `FP16` until total VRAM exceeds GPU capacity (`isOom === true`).
2. **Rescue with GQA/MLA + FP8**: Reduce KV Cache VRAM by `>= 75%` from MHA-FP16 baseline using `GQA`/`MLA` and `FP8`/`INT4` (`kvSavingsRatio >= 0.75`).
3. **Climb the Roofline**: Increase `batchSize >= 32` to raise Decode arithmetic intensity by `> 10x` toward the hardware ridge point (`decodeAI >= 10 * singleBatchDecodeAI`).

#### 5. Mandatory Engine Unit Tests
- With KV Cache decode FLOPs at step $t$ is strictly lower than No-Cache FLOPs for all $t > 1$.
- KV Cache bytes scale linearly with `batchSize`, `contextLength`, `numLayers`, and `bytesPerElement`.
- For identical $L, H_q, d_{\text{head}}$: $\text{VRAM}_{\text{MHA}} > \text{VRAM}_{\text{GQA}} > \text{VRAM}_{\text{MQA}}$.
- Roofline achieved throughput is strictly bounded by `min(peakFlops, bandwidth * arithmeticIntensity)`.

---

### Lab 06: FlashAttention Tiling & SRAM Simulator (`flash-attention`)
- **Difficulty**: Advanced | **Tags**: `FlashAttention`, `Online Softmax`, `SRAM`, `IO-Aware`

#### 1. Mathematical & Algorithmic Model
- Real floating-point execution of **Standard Attention** vs **FlashAttention-2 Tiled Online Softmax** on deterministic seeded $Q, K, V \in \mathbb{R}^{N \times d}$ ($N \in \{8, 12, 16\}$, $d = 4$).
- Tile sizes $B_r, B_c \in \{2, 4, 8\}$ (dividing $N$).
- Records a complete **Step-by-Step Execution Trace** across every outer block $i \in [0, T_r)$ and inner block $j \in [0, T_c)$:
  - If `causalMask` is ON and entire block $(i, j)$ satisfies $\min(\text{row}_i) < \max(\text{col}_j)$ strictly in upper triangle (`iStart + Br - 1 < jStart`), **skip the entire tile** (highlighting causal block skipping speedup!).
  - Otherwise execute exact Online Softmax update in SRAM:
    $$S_{ij} = \frac{Q_i K_j^T}{\sqrt{d}}, \quad m_i^{\text{new}} = \max(m_i, \text{rowmax}(S_{ij}))$$
    $$P_{ij} = \exp(S_{ij} - m_i^{\text{new}}), \quad \alpha = \exp(m_i - m_i^{\text{new}})$$
    $$l_i^{\text{new}} = \alpha \odot l_i + \text{rowsum}(P_{ij}), \quad O_i^{\text{new}} = \text{diag}(\alpha) O_i + P_{ij} V_j$$
  - After all $j$ blocks for row tile $i$: $O_i \leftarrow O_i / l_i$, write $O_i$ back to HBM.
- **Exact HBM IO Counter** (in elements / bytes at 2 bytes/FP16):
  - Standard Attention HBM IO: Read $Q, K$ ($2Nd$), Write $S$ ($N^2$), Read $S$ ($N^2$), Write $P$ ($N^2$), Read $P, V$ ($N^2 + Nd$), Write $O$ ($Nd$) = $4N^2 + 4Nd$.
  - FlashAttention HBM IO: Per outer tile read $Q_i$ ($B_r d$), per unskipped inner tile read $K_j, V_j$ ($2 B_c d$), write $O_i$ ($B_r d$) — NEVER writes $S$ or $P$ to HBM!
- Also computes asymptotic scaling comparison curve for real sequence lengths $N \in [512, 32768]$ with configurable SRAM size $M$ (`64 KB`, `128 KB`, `228 KB` H100).

#### 2. Controls & Presets
- **Presets**: `Small Trace (N=8, Br=Bc=4)`, `Fine Tiles (N=12, Br=Bc=2)`, `Causal Block-Skipping (N=16, Br=Bc=4)`.
- **Controls**:
  - `seqLen` (`8`, `12`, `16`)
  - `blockBr` (`2`, `4`, `8`), `blockBc` (`2`, `4`, `8`)
  - `causalMask` toggle (`ON` / `OFF`)
  - `sramKB` slider (`64..256` KB, for the asymptotic IO comparison chart)

#### 3. Visual Stage & Stepper
- **Hardware Architecture Diagram (SVG)**:
  - **Left/Top (Slow HBM)**: Shows $Q, K, V, O$ grids with the currently loaded tiles $Q_i, K_j, V_j$ glowing and animated data bus arrows flowing into SRAM.
  - **Center (Fast On-Chip SRAM)**: Displays the active micro-tile $S_{ij}$, live running vectors $m_i$ (row max), $l_i$ (row sum), rescaling factor $e^{m_i - m_i^{\text{new}}}$, and partial accumulator $O_i$.
  - **Right (Virtual $N \times N$ Attention Matrix)**: Shows which tiles are `Done`, `Active`, `Pending`, or `Skipped (Causal)` — visually proving that the full $N \times N$ matrix is NEVER materialized in HBM!
- **Stepper**: Steps tile-by-tile (`Load Tile → Compute S_ij & Rescale m,l,O → Write O_i`) with animated HBM byte counters racing Standard vs FlashAttention.
- **Metrics**: `Flash HBM Traffic`, `Standard HBM Traffic`, `IO Speedup Ratio`, `Max |O_flash - O_naive|` (displays `< 1e-12` exactness proof!).

#### 4. Guided Challenges (3)
1. **Verify Exact Numerical Equivalence**: Run the tile stepper to completion and confirm `maxAbsError < 1e-10`.
2. **Activate Causal Block Skipping**: Enable `causalMask` at `N=16, Br=Bc=4` and observe skipped upper-triangular tiles (`skippedTiles >= 6`).
3. **Observe SRAM Block Size Impact**: Increase `blockBr` from `2` to `8` and confirm HBM reads of $K, V$ drop sharply (`hbmTrafficReduced`).

#### 5. Mandatory Engine Unit Tests
- Exact numerical equivalence: `maxAbsDiff(flashOutput, naiveAttentionOutput) < 1e-10` across all combinations of `seqLen ∈ {8, 12, 16}`, `Br, Bc ∈ {2, 4}`, and `causalMask ∈ {true, false}`!
- Causal block skipping skips exact expected count of strictly upper-triangular tiles and still matches naive causal attention within `1e-10`.
- HBM traffic for FlashAttention is strictly less than Standard Attention for sufficiently large $N$ / tile sizes.

---

### Lab 07: MoE Router & Load Balancing Sandbox (`moe-routing`)
- **Difficulty**: Intermediate | **Tags**: `MoE`, `Top-K Gating`, `Capacity Factor`, `Expert Collapse`

#### 1. Mathematical Model
- $T$ tokens ($T \in [8, 24]$, default `16`, labeled with semantic categories like `Code`, `Math`, `Prose`, `Logic`), $E$ experts ($E \in \{4, 6, 8\}$, default `6`), Top-$K$ routing ($K \in \{1, 2, 3\}$, default `2`).
- Each token $t$ has feature vector $x_t \in \mathbb{R}^8$; router computes logits $z_t = x_t W_r + b_{\text{bias}} + \epsilon_{\text{jitter}}$, probabilities $p_t = \text{softmax}(z_t)$.
- Select Top-$K$ experts per token, normalize gating weights $g_{t,e} = p_{t,e} / \sum_{e' \in \text{TopK}} p_{t,e'}$.
- **Capacity Factor Enforcement**: $\text{cap} = \max(1, \lceil C \cdot \frac{T \cdot K}{E} \rceil)$ where $C \in [0.75, 2.0]$. Tokens assigned to expert $e$ in descending router-probability order; any token exceeding `cap` is marked **Dropped** (residual passthrough).
- **Load Balancing Loss** (Switch / Mixtral):
  $$f_e = \frac{\text{assigned}_e}{T \cdot K}, \quad P_e = \frac{1}{T} \sum_{t=1}^T p_{t,e}, \quad \mathcal{L}_{\text{aux}} = \alpha \cdot E \sum_{e=1}^E f_e P_e$$
  (Note: perfectly uniform routing gives $\mathcal{L}_{\text{aux}} = \alpha \cdot 1.0$; total collapse onto 1 expert gives $\mathcal{L}_{\text{aux}} = \alpha \cdot E$.)
- **Multi-Step Router Dynamics Simulator**: Stepping training (`step 0..30`) simulates gradient updates under 3 selectable regimes:
  1. `none`: Self-reinforcing specialization (popular experts get slightly higher positive feedback → classic **Expert Collapse**!).
  2. `aux-loss`: Gradient of $\mathcal{L}_{\text{aux}}$ pushes overloaded experts down and underused experts up.
  3. `loss-free-bias` (DeepSeek-V3 style): Keeps routing weights pure, adjusts auxiliary bias $b_e \leftarrow b_e + \gamma \cdot \text{sign}(\bar{c} - c_e)$ after each step without interfering with main task gradients.

#### 2. Controls & Presets
- **Presets**: `Balanced Mixtral-Style (K=2, Aux Loss)`, `Expert Collapse Demo (No Balancing)`, `Tight Capacity Dropping (C=1.0)`, `DeepSeek Loss-Free Bias`.
- **Controls**:
  - `numExperts` (`4`, `6`, `8`)
  - `topK` (`1`, `2`, `3`)
  - `capacityFactor` slider (`0.75..2.0`, default `1.25`)
  - `balancingMode` segmented (`None`, `Aux Loss`, `Loss-Free Bias`)
  - `auxAlpha` slider (`0.0..0.2`, default `0.05`)
  - `routerNoise` slider (`0.0..0.5`, default `0.05`)

#### 3. Visual Stage & Stepper
- **Interactive Token → Expert Sankey Routing Graph (SVG)**:
  - Left column: Token chips colored by domain (`Code`, `Math`, `Prose`, `Logic`).
  - Center: Smooth curved routing ribbons whose width reflects gate weight $g_{t,e}$; **Dropped** token paths render dashed Rose!
  - Right column: Expert load buckets with horizontal fill bars and a crisp vertical **Capacity Ceiling Line**.
  - Hovering any token highlights its Top-$K$ experts and exact softmax probabilities; hovering any expert highlights all incoming tokens and overflow drops.
- **Utilization & Load-Balance Curve (SVG)**: Tracks Expert Load Gini/CV and $\mathcal{L}_{\text{aux}}$ over training steps `0..30`.
- **Metrics**: `Dropped Token Rate`, `Load Balance Score (CV)`, `Aux Loss (L_aux)`, `Active Params % (K/E)`.

#### 4. Guided Challenges (3)
1. **Trigger Expert Collapse**: Run `balancingMode = 'none'` for `>= 15` steps and observe severe imbalance (`maxExpertShare >= 0.45`).
2. **Eliminate Token Dropping**: Reduce dropped tokens to `0%` using either `Aux Loss` or `Loss-Free Bias` with `capacityFactor <= 1.25` (`droppedRate === 0 && step >= 10`).
3. **Compare Sparse vs Dense Compute**: Configure `numExperts = 8, topK = 2` and verify active expert ratio equals `25%`.

#### 5. Mandatory Engine Unit Tests
- Selected Top-$K$ normalized gating weights sum to `1.0` for every token.
- No expert ever exceeds `capacity` accepted tokens; `accepted + dropped === T * K`.
- Under perfectly uniform probabilities ($1/E$) and uniform assignments, $\mathcal{L}_{\text{aux}} / \alpha === 1.0$ within `1e-10`.
- Over 25 steps, `loss-free-bias` and `aux-loss` achieve strictly lower expert load variance than `none`.

---

## Chapter III: Efficiency & Alignment

---

### Lab 08: Quantization & Precision Loss Lab (`quantization`)
- **Difficulty**: Intermediate | **Tags**: `FP8`, `BF16`, `INT4`, `NF4`, `Outliers`, `SmoothQuant`

#### 1. Mathematical Model
- **View A — Interactive Floating-Point Bit Inspector**:
  - Uses `src/engine/math/ieee754.ts` to encode/decode any value across `FP32` (1-8-23), `FP16` (1-5-10), `BF16` (1-8-7), `FP8 E4M3` (1-4-3), and `FP8 E5M2` (1-5-2).
  - Clicking any bit toggles it live and recalculates exact decimal value, dynamic range, and quantization step ($\text{ULP}$).
- **View B — Matrix Quantization & Outlier Stress Simulator**:
  - Generates a $16 \times 16$ tensor ($256$ elements) drawn from $\mathcal{N}(0, 1)$, plus optional injected **Channel Outliers** (adds $\pm \text{outlierMag}$ to 2 designated channels, simulating emergent LLM activation outliers).
  - Real quantization algorithms:
    - `int8_sym` / `int4_sym`: $s = \max|X| / (2^{b-1} - 1)$, $q = \text{clamp}(\text{round}(x/s), -2^{b-1}+1, 2^{b-1}-1)$, $\hat{x} = q \cdot s$.
    - `int8_asym` / `int4_asym`: $s = (x_{\max} - x_{\min}) / (2^b - 1)$, $z = \text{round}(-x_{\min} / s)$.
    - `int4_group`: Splits tensor into contiguous groups of size $g \in \{8, 16, 32, 64\}$, each with its own scale $s_k$ (and accounts for scale metadata overhead in effective bits/weight: $4 + 16/g$).
    - `nf4`: Exact 16-level QLoRA NormalFloat4 lookup table normalized to $[-1, 1]$ per group.
    - `smoothquant` toggle: Applies per-channel migration scale $s_j = \max(|X_j|)^{\alpha}$ ($\alpha \in [0, 1]$) before quantizing, demonstrating how smoothing outliers collapses quantization MSE!
  - Computes exact metrics: `MSE`, `Max Abs Error`, `SQNR (dB)`, `Cosine Similarity`, and `Effective Bits/Param`.

#### 2. Controls & Presets
- **Presets**: `Clean Gaussian INT4`, `Emergent Outlier Catastrophe (Per-Tensor INT4)`, `Group-Wise NF4 Recovery`, `BF16 vs FP16 Precision Inspector`.
- **Controls**:
  - Mode tabs: `Tensor Quantization` | `IEEE-754 / FP8 Bit Lab`
  - `method` selector (`FP16`, `BF16`, `FP8 E4M3`, `INT8 Sym`, `INT4 Sym`, `INT4 Asym`, `INT4 Group`, `NF4 Group`)
  - `groupSize` segmented (`8`, `16`, `32`, `64`)
  - `outlierMag` slider (`0` to `25`, default `0`)
  - `smoothAlpha` slider (`0.0` to `1.0`, default `0.0` — SmoothQuant channel scaling)

#### 3. Visual Stage
- **Tensor Quantization View**:
  - Triple synchronized `MatrixHeatmap` (`Original` | `Dequantized` | `Error |x - x̂|`) with shared hover inspection showing exact `(orig, quantCode, scale, dequant, absErr)` for any cell!
  - Bottom **Value Histogram + Quantization Grid Overlay (SVG)**: Plots distribution bins with crisp vertical ticks at every representable quantization level so users literally SEE why a single outlier stretches the grid and crushes normal weights into 2 buckets!
- **Bit Inspector View**: Interactive colored bit boxes (`Sign` Rose, `Exponent` Violet, `Mantissa` Cyan) stacked for all 5 float formats simultaneously on the same test number, plus a log-scale representable number line.
- **Metrics**: `SQNR (dB)`, `Cosine Similarity`, `MSE`, `Effective Bits/Weight`.

#### 4. Guided Challenges (3)
1. **Witness Outlier Catastrophe**: Inject `outlierMag >= 15` under `INT4 Sym` (Per-Tensor) and watch `SQNR` plummet below `10 dB`.
2. **Rescue Precision with Group-Wise NF4**: Keeping `outlierMag >= 15`, switch to `NF4 Group` (`groupSize <= 32`) and recover `SQNR >= 18 dB` and `Cosine Similarity >= 0.99`.
3. **Flip a Float Exponent Bit**: In Bit Lab mode, click an exponent bit in `BF16` or `FP8 E4M3` and observe the exact power-of-2 scaling jump.

#### 5. Mandatory Engine Unit Tests
- For zero outliers: `SQNR(INT8) > SQNR(INT4)` and `SQNR(NF4) > SQNR(INT4_sym)` on standard Gaussian tensors.
- Decreasing `groupSize` (`64 -> 32 -> 16 -> 8`) monotonically does not worsen (and strictly improves under outliers) reconstruction MSE.
- `inspectFloatFormat(3.1415927, 'fp32')` round-trips identically; `BF16` preserves dynamic range of `1e20` while `FP16` overflows to `Infinity`!
- `FP8 E4M3` clamps/saturates near `448` without producing `Infinity`.

---

### Lab 09: Decoding & Sampling Playground (`decoding-sampling`)
- **Difficulty**: Foundational | **Tags**: `Temperature`, `Top-K`, `Top-P`, `Min-P`, `Beam Search`

#### 1. Mathematical Model
- **Mode A — Sampling Pipeline**:
  - 3 realistic curated context presets (16 candidate next tokens with realistic raw logits, plus a `Custom Logits` mode where users can drag individual token logit bars!).
  - Exact ordered transformation pipeline:
    1. Penalty stage (for tokens flagged as appearing in prior context): apply Repetition Penalty ($z_i \leftarrow z_i / r$ if $z_i > 0$ else $z_i \cdot r$), Frequency & Presence penalties.
    2. Temperature scaling: $p_i = \text{softmax}(z_i / T)$ with $T \in [0.05, 2.5]$ (exact argmax when `greedy` or $T \to 0$).
    3. **Top-$K$**: keep top $K$ tokens ($K \in [1, 16]$), mask rest.
    4. **Top-$P$ (Nucleus)**: sort descending, retain minimal prefix whose cumulative probability $\ge P$ ($P \in [0.1, 1.0]$).
    5. **Min-$P$**: retain tokens satisfying $p_i \ge \text{minP} \cdot \max_j(p_j)$ ($\text{minP} \in [0.0, 0.5]$).
    6. Renormalize surviving probabilities to sum to `1.0`.
  - **Monte Carlo Sampler**: Deterministic seeded sampling (`Sample 1×`, `Sample 100×`, `Clear`) overlaying empirical draw frequencies against theoretical filtered probabilities.
- **Mode B — Beam Search Tree Explorer**:
  - Real 3-step branching vocabulary graph with curated log-probabilities specifically designed so **Greedy ($B=1$) picks a locally attractive trap** while **Beam Search ($B \ge 2$)** discovers the globally higher-scoring completion!
  - Score with Wu et al. length penalty: $\text{score}(y) = \frac{\sum \log p(y_t)}{((5 + |y|) / 6)^\alpha}$ where $\alpha \in [0.0, 1.5]$.

#### 2. Controls & Presets
- **Presets**: `Factual QA (Sharp Peak)`, `Creative Story (Flat Tail)`, `Code Generation (Min-P Showcase)`, `Greedy Trap (Beam Search)`.
- **Controls**:
  - Mode tabs: `Token Sampling Pipeline` | `Beam Search Tree`
  - `temperature` slider (`0.05..2.5`, default `0.8`)
  - `topK` slider (`1..16`, default `16`)
  - `topP` slider (`0.10..1.00`, default `0.90`)
  - `minP` slider (`0.00..0.50`, default `0.00`)
  - `repetitionPenalty` slider (`1.0..2.0`, default `1.0`)
  - `beamWidth` slider (`1..4`) & `lengthPenalty` slider (`0.0..1.5`) in Beam mode

#### 3. Visual Stage
- **Sampling Bar & Cumulative Mass Chart (SVG)**:
  - Horizontal sorted token probability bars: surviving tokens in Cyan/Emerald, truncated-by-Top-K in Muted Gray, truncated-by-Top-P in Amber hatched, truncated-by-Min-P in Violet hatched.
  - Overlay cumulative probability curve with a dashed horizontal **Top-$P$ Cutoff Line** and vertical **Min-$P$ Threshold Marker**.
  - Interactive **Sample 1×** (animates a roulette pointer landing on the sampled token!) and **Sample 100×** buttons showing empirical histogram ticks beside each bar.
- **Beam Search Tree (SVG)**: Interactive directed tree showing active beams in Cyan/Emerald, pruned branches faded, exact cumulative log-prob and length-normalized score on every node, and step-by-step expansion via Stepper.
- **Metrics**: `Surviving Tokens`, `Distribution Entropy (bits)`, `Perplexity (2^H)`, `Top-1 Probability`.

#### 4. Guided Challenges (3)
1. **Temperature Extremes**: Raise `temperature >= 1.8` on `Factual QA` and watch perplexity triple (`perplexity >= 4.0`).
2. **Compare Top-P vs Min-P**: On `Creative Story`, enable `minP >= 0.1` (`topP = 1.0`, `topK = 16`) to dynamically prune low-probability tail tokens without cutting strong runners-up.
3. **Escape the Greedy Trap**: In `Beam Search Tree`, increase `beamWidth` from `1` to `>= 2` and uncover a higher-scoring complete sequence than Greedy!

#### 5. Mandatory Engine Unit Tests
- Final filtered distribution ALWAYS retains at least 1 token (even at extreme `topP=0.1, minP=0.5`) and sums to `1.0` within `1e-10`.
- Higher temperature strictly increases (or preserves for uniform) Shannon entropy.
- Top-$K$ never returns more than $K$ nonzero tokens.
- Beam Search with $B=1$ equals exact Greedy path; for the curated `Greedy Trap` tree, $B \ge 2$ strictly beats $B=1$ on total log-probability.

---

### Lab 10: LoRA & Low-Rank SVD Lab (`lora-svd`)
- **Difficulty**: Intermediate | **Tags**: `LoRA`, `QLoRA`, `SVD`, `Low-Rank`, `PEFT`

#### 1. Mathematical Model
- **Part A — Real Jacobi SVD & Low-Rank Matrix Approximation**:
  - Target weight delta $\Delta W \in \mathbb{R}^{16 \times 16}$ generated from selectable presets:
    - `Intrinsic Low-Rank (Rank ~3 + tiny noise)` (mirrors Aghajanyan / Hu et al. finding!)
    - `Structured Attention Shift (Rank ~6)`
    - `High-Rank Random Noise (Full Rank)` (shows when low-rank LoRA struggles!)
  - Computes exact SVD $\Delta W = U \Sigma V^T$ via `src/engine/math/svd.ts`, exact rank-$r$ optimal Eckart-Young reconstruction $\Delta W_r = \sum_{i=1}^r \sigma_i u_i v_i^T$, and explained variance ratio $\sum_{i=1}^r \sigma_i^2 / \sum_{i=1}^{16} \sigma_i^2$.
- **Part B — Live In-Browser LoRA Adapter Gradient Descent**:
  - Real trainable factors $A \in \mathbb{R}^{r \times 16}$ (Kaiming normal init) and $B \in \mathbb{R}^{16 \times r}$ (**zero init**, or toggleable random init to demonstrate why $B=0$ is critical so $\Delta W_0 = 0$ at step 0!).
  - Exact analytical matrix gradients of $\mathcal{L}(A, B) = \frac{1}{2} \| \frac{\alpha}{r} B A - \Delta W \|_F^2$:
    $$E = \frac{\alpha}{r} B A - \Delta W, \quad \nabla_B \mathcal{L} = \frac{\alpha}{r} E A^T, \quad \nabla_A \mathcal{L} = \frac{\alpha}{r} B^T E$$
  - Step/Play updates $A, B$ live via gradient descent / Adam and compares training loss against the theoretical SVD rank-$r$ lower bound!
- **Part C — Production LLM Fine-Tuning Memory Calculator**:
  - Compares `Full Fine-Tuning (BF16)` vs `LoRA (BF16 Base + FP32 Adapters)` vs `QLoRA (NF4 Base + BF16 Adapters)` VRAM breakdown (`Base Weights`, `Trainable Gradients`, `AdamW States (m, v, master)`, `Activations`) for `7B`, `14B`, `32B`, and `70B` models.

#### 2. Controls & Presets
- **Presets**: `Intrinsic Low-Rank Task (r=4)`, `High-Rank Stress Test`, `Broken Init (B ≠ 0) Demo`, `70B QLoRA Memory Budget`.
- **Controls**:
  - `rank` slider (`1..16`, default `4`)
  - `loraAlpha` slider (`1..32`, default `8`)
  - `zeroInitB` toggle (`B = 0` ON/OFF)
  - `targetPreset` selector (`Low-Rank`, `Attention Shift`, `Full-Rank Noise`)
  - `modelSizeB` segmented (`7B`, `14B`, `32B`, `70B`) for the VRAM comparison bar

#### 3. Visual Stage & Stepper
- **Matrix Factorization Diagram (SVG/Canvas)**: Visual equation $W_0\text{ (frozen)} + \frac{\alpha}{r} B_{(16\times r)} \cdot A_{(r\times 16)} \approx \Delta W$ with thin rectangular heatmaps for $B$ and $A$ physically changing width/height as `rank` changes, alongside live `Residual Error` heatmap!
- **Singular Value Scree Plot + Training Loss Chart (SVG)**: Shows $\sigma_1 \dots \sigma_{16}$ bars (captured in Cyan, truncated in Muted Gray) + live LoRA training MSE approaching the dashed **SVD Optimal Floor** as Stepper runs.
- **LLM VRAM Stacked Bar**: Full FT vs LoRA vs QLoRA side-by-side in GB.
- **Metrics**: `Trainable Params %`, `Explained Energy %`, `LoRA MSE vs SVD Floor`, `QLoRA VRAM Savings`.

#### 4. Guided Challenges (3)
1. **Hit 95% Energy at Low Rank**: On `Intrinsic Low-Rank`, find the smallest `rank <= 4` capturing `>= 95%` of Frobenius energy (`rank <= 4 && explainedEnergy >= 0.95`).
2. **Train LoRA to the SVD Optimal Floor**: Run the live gradient stepper (`step >= 30`) until LoRA reconstruction error gets within `10%` of the theoretical SVD floor (`loraMse <= svdFloorMse * 1.15 + 1e-4`).
3. **Spot When Low Rank Fails**: Switch to `High-Rank Random Noise` at `rank = 2` and observe explained energy drop below `35%`.

#### 5. Mandatory Engine Unit Tests
- SVD reconstruction at full rank $r = 16$ matches $\Delta W$ with $\| \Delta W - \Delta W_{16} \|_F < 10^{-8}$.
- With `zeroInitB = true`, initial adapter product $BA$ is identically the zero matrix (`frobeniusNorm === 0`).
- Running 100 steps of LoRA gradient descent strictly decreases MSE and converges near the Eckart-Young rank-$r$ floor.
- Trainable parameter count for $16 \times 16$ equals $r \cdot (16 + 16) = 32r$.

---

## Chapter IV: Training & Generative

---

### Lab 11: Autograd & Optimizers Arena (`backprop-optimizers`)
- **Difficulty**: Foundational | **Tags**: `Backprop`, `Chain Rule`, `SGD`, `Adam`, `AdamW`, `Cosine LR`

#### 1. Mathematical Model
- **Mode A — Interactive Reverse-Mode Autograd DAG**:
  - Uses `src/engine/math/autograd.ts` to execute real scalar/micro-circuit forward passes and step-by-step reverse-mode chain rule propagation:
    1. `Neuron + ReLU/GELU`: $L = (\text{act}(w_1 x_1 + w_2 x_2 + b) - y)^2$
    2. `Attention Score Micro-Graph`: $L = -\log(\text{sigmoid}((q_1 k_1 + q_2 k_2)/\sqrt{2}))$
    3. `Residual Skip vs Deep Chain`: $L = (\tanh(w_2 \tanh(w_1 x)) + \text{skip} \cdot x - y)^2$ (visibly showing vanishing gradient rescued by skip connection!)
  - Also computes numerical central finite difference $\frac{f(\theta + h) - f(\theta - h)}{2h}$ ($h = 10^{-5}$) for every parameter to verify exact autograd accuracy live!
- **Mode B — 2D Loss Landscape Optimizer Race**:
  - Analytical 2D test functions $f(x, y)$ with exact closed-form gradients $(\nabla_x f, \nabla_y f)$:
    1. `Ill-Conditioned Ravine`: $f(x, y) = 0.5 x^2 + 12 y^2$ (classic zig-zag oscillation for SGD!)
    2. `Rosenbrock Valley`: $f(x, y) = (1 - x)^2 + 10(y - x^2)^2$ (curved narrow canyon)
    3. `Saddle Point`: $f(x, y) = x^2 - y^2 + 0.1(x^4 + y^4)$ (SGD stalls near $(0, 0)$ while momentum/Adam escape!)
    4. `Multi-Modal Non-Convex`: $f(x, y) = \sin(2x)\cos(2y) + 0.15(x^2 + y^2)$
  - 5 Optimizers running simultaneously from user-clicked start point $(x_0, y_0)$:
    - `SGD`, `SGD + Momentum` ($\beta_1$), `RMSProp` ($\beta_2$), `Adam` (with bias correction $1-\beta_1^t, 1-\beta_2^t$), `AdamW` (decoupled weight decay $\theta \leftarrow (1 - \eta \lambda)\theta - \eta \hat{m}/(\sqrt{\hat{v}}+\epsilon)$).
  - LR Schedules: `Constant`, `Cosine Decay`, `Linear Warmup + Cosine Decay`.

#### 2. Controls & Presets
- **Presets**: `Ravine Zig-Zag (SGD vs Adam)`, `Saddle Point Escape`, `Dead ReLU Gradient Kill (Autograd)`, `Cosine Warmup Comparison`.
- **Controls**:
  - Mode tabs: `2D Optimizer Race` | `Micro-Autograd DAG`
  - **Race controls**: `landscape` selector, optimizer visibility toggles (`SGD`, `Momentum`, `RMSProp`, `Adam`, `AdamW`), `learningRate` slider (`0.002..0.3`), `beta1` (`0.0..0.99`), `beta2` (`0.5..0.999`), `weightDecay` (`0.0..0.5`), `lrSchedule` segmented (`Constant`, `Cosine`, `Warmup+Cosine`).
  - **Autograd controls**: `circuit` selector, editable numeric sliders for inputs/weights, `skipConnection` toggle, `Step Optimization` button (updates weights using computed gradients!).

#### 3. Visual Stage & Stepper
- **Optimizer Race Canvas (HiDPI 2D Canvas)**: Renders smooth log-contour heatmap of $f(x, y)$, click-anywhere to drop starting point $(x_0, y_0)$, glowing animated trajectories for each active optimizer with head markers, plus synchronized **Log-Loss vs Step** and **Learning Rate Schedule** sparklines below.
- **Autograd DAG (Interactive SVG)**: Clean left-to-right layered node graph showing each node's `op`, forward `val`, backward `grad`, and edge local derivative $\frac{\partial \text{child}}{\partial \text{parent}}$. Stepper animates reverse propagation one topological node at a time in Rose/Amber glow!
- **Metrics**: `Best Optimizer Loss`, `Current Step / LR`, `Autograd Max Grad Error`, `Gradient Norm`.

#### 4. Guided Challenges (3)
1. **Watch SGD Zig-Zag While Adam Glides**: On `Ill-Conditioned Ravine`, run `>= 40` steps and confirm `Adam` achieves `< 10%` of `SGD` loss (or converges cleanly while SGD oscillates).
2. **Expose the Dead ReLU**: In `Autograd DAG` (`Neuron + ReLU`), set input/bias so pre-activation `< 0` and verify exact `0.000` gradient on all upstream weights!
3. **Click & Escape a Saddle Point**: On `Saddle Point`, click near `(0.05, 0.02)` and run `>= 30` steps to watch adaptive/momentum optimizers escape the saddle.

#### 5. Mandatory Engine Unit Tests
- Every autograd circuit's analytical gradients match central finite-difference gradients within `1e-5` across all ops (`add, sub, mul, div, pow, exp, log, relu, gelu, tanh, sigmoid`).
- On `Ill-Conditioned Ravine`, `Adam` converges to $f(x, y) < 0.05$ within 100 steps from `(2.0, 1.5)` at `lr = 0.1`.
- `AdamW` with `weightDecay > 0` decays parameters strictly closer to origin than `Adam` with `weightDecay = 0` on flat/zero-gradient regions.
- Warmup + Cosine schedule starts near `0`, peaks at `lr` at warmup end, and decays monotonically to `minLr`.

---

### Lab 12: Diffusion & Flow Matching Denoising Lab (`diffusion-flow`)
- **Difficulty**: Advanced | **Tags**: `DDPM`, `DDIM`, `Flow Matching`, `Score Field`, `CFG`

#### 1. Mathematical Model (100% Exact Analytical Empirical Score & Velocity — Zero Model Downloads!)
- Target 2D dataset $Y = \{y_j, c_j\}_{j=1}^M$ ($M = 120$ deterministic points with binary class label $c_j \in \{0, 1\}$):
  - `Two Moons` (Class 0 = upper moon, Class 1 = lower moon — ideal for Classifier-Free Guidance!)
  - `Swiss Roll`
  - `Concentric Rings` (Class 0 = inner ring, Class 1 = outer ring)
  - `4-Mode Grid`
- **Diffusion Forward Process** ($t \in \{1 \dots T\}$, $T = 100$):
  - Noise schedule (`Linear` vs `Cosine` Nichol & Dhariwal) yielding $\bar\alpha_t \in (0, 1]$.
  - Forward sample: $x_t = \sqrt{\bar\alpha_t} x_0 + \sqrt{1 - \bar\alpha_t} \epsilon$.
- **Exact Analytical Denoiser for Empirical GMM** (smoothing $\sigma_0 = 0.06$):
  - Given query point $x_t$ and noise level $\bar\alpha_t$, variance $v_t = (1 - \bar\alpha_t) + \bar\alpha_t \sigma_0^2$:
    $$w_j(x_t) = \text{softmax}_j\!\left(-\frac{\|x_t - \sqrt{\bar\alpha_t} y_j\|^2}{2 v_t}\right), \quad \hat{x}_0(x_t) = \sum_{j=1}^M w_j(x_t) y_j$$
    $$\hat{\epsilon}(x_t, t) = \frac{x_t - \sqrt{\bar\alpha_t}\hat{x}_0(x_t)}{\sqrt{\max(1 - \bar\alpha_t, 10^{-6})}}$$
- **Classifier-Free Guidance (CFG)** with guidance scale $w_{\text{cfg}} \in [0.0, 5.0]$ and target class $c^* \in \{\text{All}, \text{Class A}, \text{Class B}\}$:
  - Compute $\hat{\epsilon}_{\text{uncond}}$ over all $Y$ and $\hat{\epsilon}_{\text{cond}}$ over $\{y_j : c_j = c^*\}$:
    $$\hat{\epsilon}_{\text{guided}} = \hat{\epsilon}_{\text{uncond}} + w_{\text{cfg}} (\hat{\epsilon}_{\text{cond}} - \hat{\epsilon}_{\text{uncond}})$$
- **3 Solvers Implemented Side-by-Side**:
  1. **DDPM (Stochastic SDE)**: Reverse Gaussian transition with fresh seeded noise $\sigma_t z$ at each step.
  2. **DDIM (Deterministic ODE, $\eta = 0$)**: Deterministic jump from $t \to t_{\text{prev}}$ using $\hat{x}_0$ and $\hat{\epsilon}_{\text{guided}}$.
  3. **Flow Matching (Rectified / Linear Interpolant ODE)**: Interpolant $x_t = (1 - t) x_{\text{noise}} + t y_j$ ($t: 0 \to 1$), exact analytical marginal velocity field:
     $$v_t(x_t) = \sum_j w_j^{\text{FM}}(x_t) \frac{y_j - x_t}{\max(1 - t, 0.02)}$$
     integrated with Euler/Midpoint steps — visually producing **dramatically straighter trajectories** that succeed in as few as `5–10` steps!

#### 2. Controls & Presets
- **Presets**: `Flow Matching 10-Step Straight Paths`, `DDPM vs DDIM Trajectory Compare`, `CFG Class Guidance (Two Moons)`, `Cosine vs Linear Noise Schedule`.
- **Controls**:
  - `dataset` segmented (`Two Moons`, `Swiss Roll`, `Rings`, `4-Grid`)
  - `sampler` segmented (`DDPM`, `DDIM`, `Flow Matching`, `Compare All 3`)
  - `numSteps` slider (`5`, `10`, `20`, `40`, default `20`)
  - `schedule` segmented (`Cosine`, `Linear`)
  - `targetClass` segmented (`Unconditional`, `Class A`, `Class B`)
  - `cfgScale` slider (`0.0..5.0`, default `1.5`)
  - `showVectorField` toggle (`ON` / `OFF`) & `showTrails` toggle (`ON` / `OFF`)

#### 3. Visual Stage & Stepper
- **Primary HiDPI 2D Canvas**:
  - Faint target distribution contour/reference dots (Class A Cyan, Class B Violet).
  - Live **Score / Velocity Vector Field Quiver Grid** (16×16 crisp arrows updating at every timestep $t$!).
  - Animated swarm of `120` particles flowing from Gaussian noise to the target manifold, with smooth luminous trajectories for 12 highlighted hero particles!
  - In `Compare All 3` mode, renders 3 synchronized mini-canvases (`DDPM` | `DDIM` | `Flow Matching`) starting from the **exact same initial Gaussian noise** so trajectory straightness and few-step quality are unmistakable!
- **Noise Schedule / SNR Chart (SVG)**: Plots $\bar\alpha_t$ and $\log\text{SNR}(t)$ with playhead synced to the Stepper (`Forward t=0→T` or `Reverse Denoise`).
- **Metrics**: `Mean Distance to Manifold`, `Trajectory Straightness Ratio`, `Class Purity % (CFG)`, `Timestep t / N`.

#### 4. Guided Challenges (3)
1. **Steer Generation with CFG**: Select `Two Moons`, set `targetClass = 'Class A'` and `cfgScale >= 2.0`, run reverse denoising to completion, and achieve `>= 90%` Class A purity.
2. **Prove Flow Matching's Straight-Line Advantage**: Switch to `Compare All 3` at `numSteps <= 10` and verify Flow Matching's trajectory straightness ratio is strictly closer to `1.0` (straighter) than DDPM.
3. **Inspect the Dynamic Vector Field**: Enable `showVectorField` and scrub the Stepper from high noise ($t$ near noise) to clean data to watch the field sharpen from a single global pull into crisp local manifold ridges.

#### 5. Mandatory Engine Unit Tests
- Cosine schedule $\bar\alpha_t$ is strictly decreasing in $(0, 1]$ with $\bar\alpha_0 \approx 1$ and $\bar\alpha_T < 0.02$.
- Reverse denoising (`DDIM` and `Flow Matching` at `numSteps = 20`) reduces mean nearest-neighbor distance from particles to target manifold by `> 70%` compared to initial $\mathcal{N}(0, I)$ noise!
- Under `Two Moons` with `targetClass = 'Class A'` and `cfgScale = 2.0`, `>= 85%` of final denoised particles are closer to Class A than Class B.
- Flow Matching trajectory path-length-to-displacement ratio (straightness) is strictly smaller (straighter) than stochastic DDPM at `numSteps = 20`.
- Zero `NaN` or `Infinity` coordinates across all datasets, step counts (`5..40`), and CFG values (`0..5`).
