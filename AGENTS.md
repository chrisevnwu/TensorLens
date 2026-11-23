# AGENTS.md — Autonomous Engineering Protocol for TensorLens

This repository is designed to be built end-to-end by an autonomous coding agent (Codex) across sequential milestones (`M0` through `M15`) without human intervention between milestones.

Read the complete specification suite before writing your first line of code:
1. `docs/PRD.md` — Product vision, UX workbench layout, design system, i18n, and feature requirements.
2. `docs/ARCHITECTURE.md` — Locked tech stack, directory conventions, core math engine, plugin SDK, and testing gates.
3. `docs/LAB_SPECS.md` — Exact mathematical formulas, interactive controls, visual layouts, guided challenges, and unit-test invariants for all 12 labs.
4. `ROADMAP.md` — Atomic milestone checklist (`M0`–`M15`) and per-milestone verification commands.

---

## 1. Non-Negotiable Engineering Red Lines

Violating any rule below makes a milestone **FAILED**, even if the app compiles:

1. **100% Real Computation, Zero Fake Visuals**
   - Every chart, heatmap, particle trajectory, probability distribution, attention weight, quantization error, and gradient value MUST be computed live from pure TypeScript engines under `src/engine/`.
   - Never hardcode output arrays or fake animations when parameters change.
   - All randomness MUST use the deterministic seeded PRNG (`src/engine/math/prng.ts`) so outputs are reproducible and unit-testable.
2. **Strict Separation of Compute and UI**
   - `src/engine/` MUST NOT import React, DOM APIs, or browser globals. Every simulation engine must run cleanly in Node under Vitest.
3. **Zero Runtime Cloud/API Dependencies**
   - The entire app runs 100% offline in the browser as a static bundle deployable to GitHub Pages. No external API keys, no remote model fetches, no backend servers.
4. **100% Bilingual Parity (EN + ZH)**
   - Every user-visible string (navigation, lab titles, control labels, tooltips, step explanations, guided challenges, error/empty states) MUST be localized in both English (`en`, default) and Simplified Chinese (`zh`).
   - Dictionary types MUST enforce compile-time key parity so `npm run typecheck` fails if any key is missing in either locale.
   - Never leave hardcoded Chinese or English copy inside JSX components (mathematical symbols/proper acronyms like `RoPE`, `KV`, `INT4`, `DDIM` excepted).
5. **Dual Theme Fidelity (Dark + Light)**
   - Never hardcode raw light/dark colors (`#fff`, `#000`, `bg-gray-900`) in lab components or Canvas drawing code. Always read semantic CSS variables / theme palette tokens so both Dark and Light themes meet WCAG AA contrast (`>= 4.5:1` for text).
6. **No Shortcuts, Placeholders, or Skipped Tests**
   - Never leave `TODO`, `FIXME`, "Coming soon", stubbed labs, or `.skip` tests in any completed milestone.
   - Never lower TypeScript strictness (`strict: true`, `noUncheckedIndexedAccess: true`) or disable ESLint rules globally to silence errors.
7. **Zero Runtime Console Errors**
   - Every route and lab interaction verified in Playwright MUST emit zero `console.error`, zero uncaught `pageerror`, and zero React hydration/key warnings.

---

## 2. Autonomous Milestone Execution Loop

Work strictly in milestone order from `ROADMAP.md` (`M0` → `M1` → ... → `M15`). Do NOT pause to ask the user for confirmation between milestones unless a hard environment block prevents progress.

For each milestone `M[k]`:

### Step A — Plan & Inspect
- Read the milestone requirements in `ROADMAP.md` and the corresponding lab/system spec in `docs/LAB_SPECS.md` and `docs/ARCHITECTURE.md`.
- Check git status (`git status`) and ensure the working tree is clean from the previous milestone.

### Step B — Engine-First Implementation (TDD)
- For lab milestones (`M3`–`M14`), implement the pure computation module under `src/engine/labs/<lab-id>/` first.
- Write comprehensive Vitest unit tests under `src/engine/labs/<lab-id>/__tests__/` covering every mathematical invariant specified in `docs/LAB_SPECS.md` (including edge cases: zero vectors, extreme temperatures, single-token inputs, outlier spikes, numerical stability / no `NaN` or `Infinity`).
- Run `npm run test` and verify 100% pass before writing UI.

### Step C — UI, Visualizers, Guided Challenges & i18n
- Implement the lab UI under `src/labs/<lab-id>/` using the shared `LabShell` workbench, `ParameterControl`, `StepController`, `FormulaBar`, and theme-aware Canvas/SVG components.
- Implement all 3 Guided Challenges with deterministic auto-completion predicates connected to live lab state.
- Implement URL state serialization (`encodeState` / `decodeState`) so clicking "Share State" reproduces the exact simulation configuration.
- Add full `en` and `zh` translation entries in `src/i18n/labs/<lab-id>.ts` and register them cleanly.
- Register the lab in `src/labs/registry.ts` using lazy loading (`React.lazy`).

### Step D — Mandatory Verification Gate
Run ALL commands below and confirm exit code `0`:
```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```
- If Playwright browsers are not installed in the sandbox environment, attempt `npx playwright install chromium` once. If network restrictions prevent browser download, record the exact environment constraint in `PROGRESS.md`, run all static/jsdom/vitest integration checks (including React Testing Library smoke tests for every lab), and do NOT fabricate Playwright results.
- Verify responsive layouts: no horizontal scroll overflow on desktop (`1440x900`) and mobile (`390x844`).

### Step E — Record & Commit
- Check off completed items in `ROADMAP.md` (`- [x]`) and append a concise entry to `PROGRESS.md` (milestone ID, key files created, test counts, build bundle size).
- Create a clean atomic git commit:
  ```bash
  git add -A
  git commit -m "feat(M<k>): <concise summary of milestone>"
  ```
- Immediately proceed to `M[k+1]`.

---

## 3. Code Style & Architectural Conventions

- **TypeScript**: Prefer `interface` for public contracts and `type` for unions/aliases. Avoid `any`; use `unknown` + narrowing when needed.
- **Numerical Safety**: Always guard against division by zero (`1e-12` epsilon), `log(0)`, and `exp(x)` overflow (always use max-shifted `logSumExp` / stable Softmax).
- **Canvas Performance**:
  - Always scale Canvas backing store by `window.devicePixelRatio`.
  - Clean up `requestAnimationFrame`, `ResizeObserver`, and event listeners on unmount.
  - Pause animations automatically when `document.hidden` is true or when the user pauses the stepper.
- **Component Size**: Keep individual React files under ~350 lines by splitting complex visualizers into focused subcomponents (`*Canvas.tsx`, `*Controls.tsx`, `*Inspector.tsx`).
- **Bundle Discipline**: Keep each lab lazily loaded as its own Vite chunk. Never import a heavy third-party charting/ML library when lightweight custom SVG/Canvas + `src/engine/math/` produces cleaner visuals and smaller bundles.

---

## 4. Handling Blockers & Context Compaction

- Keep `ROADMAP.md` and `PROGRESS.md` continuously updated after every single milestone so that if the session compacts or restarts, the next turn knows the exact state from disk.
- If a test fails, fix the root cause in code/math rather than loosening assertions.
- Only stop before `M15` if an unrecoverable external error occurs (e.g., broken Node runtime or missing npm registry access during `M0`). Otherwise, execute cleanly through `M15` and deliver a final summary with verification results.
