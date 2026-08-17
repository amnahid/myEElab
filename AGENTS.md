# Agent instructions — myEElab

Read this before starting any work session. Full rationale, market thesis, architecture, and phase-by-phase task lists live in `ROADMAP.md` — this file is just the operating manual.

## What this is
A browser-based, SPICE-accurate circuit simulator with two linked editor views — schematic (abstract symbols) and breadboard (realistic parts, physical wiring, virtual instruments), same underlying circuit. Open-source, entirely client-side simulation engine (wraps ngspice via WebAssembly) plus a proprietary cloud layer (real-time collaboration, cloud sync, embeds, simulation-verified AI assist). See `ROADMAP.md` §5 for the full architecture diagram, §7 for how the two views share one data model.

## Repo structure & license boundary — do not violate this
```
/packages/core    MIT or Apache-2.0. Schematic editor, netlist generator,
                  ngspice bridge, waveform viewer. MUST NOT import from
                  /cloud or make any network call, ever.
/packages/cloud   Proprietary. Sync service, auth, billing, embeds, AI
                  backend. MAY depend on /core.
/packages/web     App shell composing the above.
```
This boundary **is** the business model: the free tier's entire pitch is "fully open source, runs offline, your circuit never leaves your machine." If you're unsure which package a change belongs in, ask rather than guess.

## Tech stack
- Frontend: TypeScript, Vite, Konva for both the schematic and breadboard canvases (not a node-graph library — components need fixed-position pins and rotation), React for surrounding UI chrome.
- Breadboard-view component art (Phase A7): SVG per part, generated/parameterized where possible (e.g. resistor color bands computed from its resistance value) rather than one hand-drawn asset per possible value — keep this data-driven or the art backlog grows without bound as the component library grows.
- Simulation: ngspice compiled to WASM, run inside a Web Worker, driven via the shared-library callback API. Never shell out to a CLI binary or parse `.raw` files. Never run simulation on the main thread.
- Cloud (`packages/cloud` only): an existing auth provider (don't build auth from scratch), Postgres, Yjs for CRDT sync, a WebSocket server, Stripe for billing.
- Testing: TBD once the repo is scaffolded — document the choice here as soon as it's made.

## Current phase
Start at **Phase A1** (prove the ngspice bridge) unless told otherwise. `ROADMAP.md` §8–9 has the authoritative checklist per phase. Do not start a later phase's tasks before the current phase's Definition of Done is met, and do not start any Track B (cloud) phase before Track A phases A1–A4 are done and real users exist — see `ROADMAP.md` §10.

## Hard constraints
- Never add a network dependency to `packages/core`.
- Never introduce a GPL-licensed dependency without flagging it explicitly. ngspice itself is BSD-3-Clause, but a couple of its optional files (the XSPICE table code model, `numparam`) carry GPL/LGPL terms — confirm license before linking any new optional ngspice component.
- Never fabricate SPICE model parameters or claim a circuit is "verified" without actually running it through ngspice. If asked to add a component model, find or derive real parameters — don't invent plausible-looking ones.
- Never present an AI-generated circuit (Phase B5) as correct without showing the actual simulation result that verified it.
- Never build a second netlist-generation path for breadboard mode (Phase A7). Breadboard hole/row adjacency must resolve down to the same `Wire[]` that schematic mode produces, feeding Phase A2's existing node-resolution logic unchanged — two independent paths to the same netlist is exactly the kind of divergence that produces a circuit that looks right in one view and simulates wrong.

## Definition of done — apply to every task
- [ ] Code builds; existing tests pass
- [ ] New logic has tests — especially netlist-generation and node-resolution logic, where a silently wrong netlist is worse than a crash
- [ ] No new console errors/warnings in the browser
- [ ] Matches the relevant phase's task list and DoD in `ROADMAP.md`
- [ ] If a phase's DoD is fully met, mark it complete in `ROADMAP.md` and note what's next

## When stuck
Prefer existing ngspice-WASM prior art (`ROADMAP.md` §13 Sources) over inventing a new build pipeline. Prefer asking a clarifying question over guessing on anything license- or architecture-boundary-related — those mistakes are expensive to unwind later.
