# Development Roadmap

The release plan for FactoPlanno. This page is a summary, see [`development-roadmap.md`](../blob/main/docs/development-roadmap.md) in the repo for the full version with deliverables, dependencies, and reasoning.

For the project's identity, scope, and design principles, see the [Project Charter](Project-Charter).

Each release is tagged on the [Releases](../releases) page when it lands.

---

## The releases at a glance

**v0.1.0 — The Foundation.** *(Released)* Build the canvas with the universal object model in place from the start: a single object store, the camera (pan / zoom-to-cursor / home), the infinite blueprint grid, a three-resolution snap system (block / unit / half-step), the corrected input model (right-drag pan etc.), a building palette with real in-game footprints, single-select with a context widget, and drag-to-move. Fewer features than the prototype had, but built with intention toward the long-term goals.

**v0.2.0 — Selection and Navigation.** Multi-select (Ctrl+click), rect-select with intersection + pixel buffer, move-many, individual lock toggle, copy / cut / paste with Ghost-mode paste. Plus the smaller items that naturally go with selection: half-step modifier (LShift), custom locators with their side-panel submenu, and stamps / labels.

**v0.3.0 — Grouping.** Flat groups (modeled so nesting can be enabled later without rework), persistent group identity, and the three lock / access modes: Unlocked, Group Locked, Grid Locked with double-click-to-enter and the focus / dim mode. Tiered lock behavior (group actions override individual locks).

**v0.4.0 — Save and Load.** Plans persist to versioned JSON files. Load with validation. New-plan / clear-canvas action. Prioritized in the sequence because losing work is annoying while testing, and serialization is also a forcing function that keeps the data model consistent.

**v0.5.0 — Belts and Pipes.** The full segment-and-run model. A segment is a real object bounded by the in-game length limit; a run is a specialized group of connected segments. Auto-break while drawing, endpoint extend, pipe junctions, Ctrl+drag spawn gesture on structures, lines always render beneath structures, split-on-delete of mid-run segments. Crossings are purely visual and do not auto-connect.

**v0.6.0 — Flow Direction.** Per-run direction, hover chevrons along a run when the cursor is over it, flip-direction button in the context widget. A small, contained release that immediately follows the belt/pipe model.

**v0.7.0 — Layers and Foundations.** The four built-in layers (Foundations / Machines / Belts & Pipes / Annotations) with visibility and active-interaction toggles. Foundation tiles as real objects, placed via a +/− paint brush at block-snap and moved at unit-snap.

**v0.8.0 — Undo and Redo.** Gesture-level granularity (one continuous user gesture = one undo step). Only plan changes are in the history, meaning pan, zoom, and selection are excluded. ~100-step cap, standard redo-clearing.

---

## Why this order

A few principles drive the sequence:

- **Foundations before features that depend on them.** The universal object model, the selection system, and the belt model are foundations; everything else rides on them.
- **One refactor at a time.** Selection, belts, and layers are each substantial system changes, kept in separate releases so each can stabilize before the next.
- **Save/load earlier than originally anticipated.** Once real work goes into the tool, not being able to save it gets painful fast.
- **Undo last.** Building it once against the full action set is dramatically easier than retrofitting every new action with undo support.

---

## Deferred (not dropped)

Real, agreed-upon items deliberately held back from the planned releases. They're available to pull forward if a clear reason emerges:

- **Settings / keybind menu** (remappable inputs, paste-mode toggle, preferences)
- **Sharing / export of plans** (once save/load exists)
- **Rotation of objects**
- **Real recipe data** (in-game throughput, recipes, derived numbers on placed machines)
- **Nested groups** (the data model already supports it; only the UI restriction needs lifting, deferred because necessity isn't immediately known)

---

## How releases work

A release is **done** when its deliverables are fully implemented, the tool is in a coherent and usable state, and a dev-log entry has been written. Releases are designed so the tool stays usable between them, and never a "half-refactored, nothing works" state.

Version numbers follow the usual `major.minor.patch` pattern. Each planned release bumps the middle number (v0.1.0 → v0.2.0). Bug fixes between releases bump the last number (v0.1.0 → v0.1.1). The project stays below v1.0.0 while the roadmap is being built.

The order above is the **recommended sequence**, not a mandate. If real use surfaces a different priority, and it's agreed that the releases should be reordered, it should be done deliberately and with the reason recorded. Drift is fine; silent drift is not.

---

## Want to contribute?

Pick a completed release or the one that's currently in progress (see the [issue tracker](../issues) or pinned discussions) and dig into the deliverables list in the [full roadmap](../blob/main/docs/development-roadmap.md). Each deliverable is scoped so it can be tackled mostly independently within its release.

For the *why* behind any design decision, the [Project Charter](Project-Charter) is the source of truth.