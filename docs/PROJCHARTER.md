# FactoPlanno Project Charter

*The official starting point. The touchstone you should return to when things start drifting out of, or you aren't sure fits inside the established scope.*

---

## What this document is and what it isn't

This is a **project charter**, not implementation documentation. It exists to pin down *what we are building, why, and roughly how*, in enough depth that a year from now we can read it and instantly remember whether a proposed feature, refactor, or "what if we..." idea actually belongs in this project.

This was deliberately written *before* the real code exists. There is currently only a small prototype that proves the core interaction feel. Everything beyond that prototype is design that's internally consistent, but not yet built. That's the point: this document captures the design while it's fresh, so the *build* has a fixed star to navigate by.

When in doubt, ask: **does this question/feature/idea help us serve the intent below?** If yes, it belongs in the conversation. If no, even if it's interesting, it doesn't. At least not right away.

---

## Intent, purpose, motivation

### The Problem

There is a factory-planning tool for the game *Satisfactory* called **SaLT**, by AutumnFallStudios. It is beautifully simple: a blueprint-style grid where you place machines, drag belts, snap things into place, and helps visualize a factory before you build it in-game. It is also **abandoned**: last updated about five years ago, no source code published, and no active contact for the developer.

The problem isn't just that SaLT is unmaintained. It's that it's *the right idea*, has excellent bones, executed simply, with no path forward. It has gaps - features from more recent updates that it's missing, it has no community-maintainable future, and there's no legitimate way for anyone who loves it to extend it.

### Purpose

To build a spiritual successor to **SaLT**:

1. **Web-based** instead of a Unity desktop build. Anyone can use it instantly in a browser, no install, cross-platform by default.
2. **Open-source**, so it has a maintainable future and a contributor community.
3. **Faithful to what SaLT got right** - the blueprint-grid feel, the simplicity, the snap-to-grid satisfaction - but **substantially more capable** in the systems where SaLT fell short (multi-selection, grouping, proper belt modeling, undo, layers, and so on).

### Why a planner at all

Satisfactory rewards careful planning. A real factory is a long-term spatial commitment, and a tool that lets you draft it cleanly, such as visualizing footprints, laying out belts, and organizing zones, saves hours of in-game rework. SaLT proved that demand exists, and the other blueprint tools and community calculators don't fill the same niche. The need is not a recipe calculator and not a production simulator. The niche we're aiming at is the need for a **drafting surface**.

### Motivation

There are practical reasons (the existing tool is dead-ended) and personal ones (I work professionally in Unity / Unreal as a Game and Systems Designer, Tech Artist, and play way too much Satisfactory). This is not a speculative product, it's a tool I actively want for my own use.

---

## Project Identity

The shortest possible answer to "what is this?":

> **A web-based, open-source, 2D factory-planning canvas for Satisfactory, inspired by SaLT. A drafting tool, not a calculator or a simulator.**

Three identity claims to combat scope drift:

- **It is a drafting tool.** Its job is to let you arrange, organize, and visualize a factory plan spatially. It is not an in-game-accurate production simulator and it is not a production-cost calculator. Both of those things are interesting, and have potential to eventually be incorporated, but not until the main purpose is accomplished.
- **It is 2D.** The whole point is the blueprint-grid feel that is clean, top-down, and abstract. 3D is not a planned direction and would change what the tool is fundamentally.
- **It is community-shaped.** Open-source from the start, designed to be contributable, with the architectural discipline that requires (universal models, distinct separations between systems, no clever hidden state).

---

## Audience

The intended user is a ** Ficsit<sup><sup>TM</sup></sup> employee of any experience level who thoroughly plans before building.** They want a place to lay out their factory before committing in-game, with enough fidelity to trust the resulting plan but enough abstraction to work quickly, and assume some flexibility. They are comfortable with desktop tools and direct-manipulation interfaces; they are not necessarily developers.

The intended *contributor* is an experienced, full-time Ficsit employee comfortable with a React/JavaScript stack, motivated by either loving the game or finds the canvas-tool an interesting idea in its own right.

---

## Guiding principles

These are the principles that every design decision so far has either followed or deliberately tested against. They are the "why" behind the specific design rulings in the following sections.

### 1. Simplicity is the feature

SaLT's appeal is that it is *not crowded*. FactoPlanno must protect that. Every system added has to earn its right to complexity, and where two design concepts achieve the same outcome we go with the more minimal one. Learning how to use the tool should not be a challenge.

### 2. Loose and fast over strict and fiddly

This is a planning surface, not a fidelity simulator. When in tension, we choose the option that lets the user *get the plan down* over the option that perfectly mirrors the game. For example: belts have no notion of "ports" or "connections"; lines crossing visually do not auto-junction; building footprints round *up* to the nearest half-meter rather than tracking exact in-game centimeters.

### 3. Faithful where it matters

Within those loose-and-fast bounds, we *are* faithful where faithfulness pays off in planning value: real in-game dimensions for footprints (rounded sensibly), real foundation block sizes, real belt-segment length limits driving auto-segmentation behavior. A plan you make here should be able to be followed easily, as well as one you can actually execute in-game.

### 4. Universal models, not bespoke per-feature systems

When two features want the same underlying behavior, they should share the same underlying mechanism. We do not implement "moving a belt" and "moving a machine" as separate code paths; they are both "moving an object." This principle is the single biggest architectural commitment in the project, and we'll see it pay off repeatedly below.

### 5. The user is never trapped

Destructive actions are reversible (undo). Restrictive states (locks) are always escapable. Selections always have a way out. No accidental gestures destroy work. If a user ever asks "how do I get out of this state," we have failed the principle and we must redesign.

### 6. Over-estimate over under-estimate

The tool that tells you a footprint is *slightly larger* than it really is leaves you with a meter of slack in-game. A planner that tells you a footprint is slightly *smaller* makes your real factory not fit what you drew. The first failure is a negligible wiggle room anyone can adjust or adapt to on the fly; the second wastes hours of designing and redesigning. We always round *up*.

### 7. Build for the next release, not just the current one

Several decisions explicitly trade tiny present-day complexity for large future ease. For example, modeling groups as single-parent containers so nesting can be enabled later if desired, keeping input handling tidy so a settings menu can expose remapping, and structuring storage so save/load is straightforward.

---

## Scope: what's in, what's adjacent, what's out

### In scope

A 2D blueprint-grid canvas with: machines, belts, pipes, splitters/mergers/junctions, foundations, labels, locators. Pan/zoom/snap. Selection and multi-selection. Grouping with a tiered access model. Layers. Locking. Copy/paste. Undo/redo. Save/load of plans. Eventually, sharing/export of plans, and a settings menu for keybinds and preferences.

### Adjacent (deferred, not rejected)

- **Real recipe data** (knowing a Constructor produces *X* at *Y/min* from *Z*). Genuinely useful, but it's a separate concern (calculation) from the canvas concern (placement), as well as an entirely separate sub-system than what's currently planned. Plausible as a later addition. Out of initial scope.
- **Rotation of objects.** Yes, eventually. Not in early releases because it interacts with several other systems (footprint orientation, snap behavior) that need to exist first before rotation interrupts. Can probably add sooner rather than later.
- **Sharing / export.** Save/load to local file is in scope; cloud-sharing or hosted plans is adjacent.

### Explicitly out of scope (in totality <sub><sup>*mostly*</sup></sub> )

- **3D modeling or visualization.** This is a 2D drafting tool by identity. A 3D version is a different project (or just go play the game lol?).
- **Live in-game integration** (reading from or writing to a running Satisfactory game). Out of scope; this is an offline planning surface.
- **Production-rate / supply-chain calculator** as a *primary* feature. The tool may eventually surface recipe-derived numbers (see "adjacent"), but the calculator role is already sufficiently occupied by other community tools and is a well-satisfied niche. This project could potentially include supply calculations, but will require architecting an entirely new system to be integrated with the base planned tool.
- **Multiplayer / real-time collaborative editing.** Real-time co-editing is a massive product-scope expansion and not what we are interested in building right now. This is separate from sharing and exporting saved blueprints.

---

## Conceptual architecture (the big ideas)

This section describes how the planned systems are *conceptually expected to work*. It is not code or syntax rules. It's the picture of the moving parts and how they fit together. Implementation choices should attempt to follow these shapes.

### The universal object model

Every placeable thing, such as machines, belts and pipes, splitters, mergers, junctions, foundation tiles, labels, and locators, is an **object**. Objects share a baseline of universal operations: place, select, move, delete, lock, group, copy/paste. They differ in their *type-specific* behaviors (a foundation tile is painted in bulk, a label can be renamed, a locator drives camera navigation, a belt segment participates in a run).

Object types may *opt out* of universal operations that are meaningless for them. For example: locators don't lock or group because there's no purpose for it. Opting out is a deliberate, type-by-type decision, not a special case.

This model is the single biggest commitment in the architecture. It means the selection system, the group system, the lock system, the layer system, and the undo system each only need to know about "objects" generically and not about each separate type. Adding a new object type later (like a new building category, a new annotation, eventually rotation as a property) is mostly additive, and the universal systems already handle it.

### The grid, the unit, and the foundation

- **1 grid unit = 1 meter.** The fine grid cell represents one in-game meter.
- **One foundation = 8×8 units = 1 "block".** Major gridlines mark these 8×8 blocks. This matches the in-game foundation, which is what Satisfactory itself snaps everything to.
- **Footprints come from real in-game dimensions**, converted at 1m=1u, and **rounded up to the nearest 0.5-unit** (half-step) increment. Fractional sizes like 8×9.5m are preserved exactly; awkward sizes round up to favor the planner having slightly more space than the game.

### Three snap resolutions

The tool natively supports three snap granularities for placement and movement, used in different contexts:

- **Block snap (8 units / 8m)**: for the *foundation paint brush*. Foundations always land on whole-foundation positions.
- **Unit snap (1 unit / 1m)**: the default for everything else. Placing machines, moving any object, dropping locators and labels.
- **Half-step (0.5 units / 0.5m)**: engaged by *holding LShift while dragging*. For precise placement where the unit grid would be too coarse, particularly belts/pipes.

### The camera model

There is one camera, defined by an x/y world offset and a zoom factor. The canvas is conceptually infinite. The camera's job is to map world coordinates to screen coordinates and back. Pan, zoom-to-cursor, and the "fly to a locator" animations all just modify the camera's three numbers.

### Layers

A small, fixed set of built-in layers for **Foundations / Machines / Belts & Pipes / Annotations** that the user can toggle for visibility and for "is this the active interaction target." Layers are about **type/interaction-class** ("what *is* this thing") and are not arbitrary or user-created.

Layers exist to reduce visual crowding and to make targeted interactions safer like painting foundations on the Foundations layer means you cannot accidentally grab a machine, by design.

Crucially, **layers are not groups.** Layers are about object class; groups are about user-chosen logical bundling. An object is on exactly one layer (by virtue of what it is) and *separately* may belong to at most one group (by user choice). Keeping these two systems conceptually distinct is essential because collapsing them would create confusion.

### Selection

The selection system supports:

- **Single-click** to select one object.
- **Ctrl+click** to additively toggle individual objects in/out of the selection.
- **Left-drag on empty canvas** to draw a rectangular selection box. Selection uses **intersection** (any overlap counts), with a small inward pixel buffer to avoid edge-grazing false positives. Locked objects/groups are ignored by rect-select.
- **Selection itself is not undoable**, rather it changes what's *highlighted*, not what's in the plan.

Selection operates on objects *and on groups*. This means selecting a group means selecting it as a unit (the group is itself an object-like thing).

### Grouping

A **group** is a user-defined bundle of objects that share a logical identity ("this manufacturing wing," "this assembly line"). Groups support the universal operations (move-as-unit, delete, copy, lock).

Key rules:

- **Flat for now, nesting-ready later.** The current design for groups contains only individual objects, not other groups. But the underlying model uses a **single-parent-per-tier** ownership shape so nesting can be enabled later without rework. Nesting is not initially included because the need or desire for such an operation is unknown. However, I can understand an individual's potential want for a nested groups feature. Therefore, the design accounts for this want without assuming its widespread usage.
  - The only current exception to this rule are belts and pipes, in which Runs create intrinsic 'groups'.
- **An object belongs to at most one *direct* parent group.** Two sibling groups cannot both claim the same object. (Transitive ownership through nesting is fine as each tier still has a single direct owner.)
- **Groups have three lock/access modes** (see below).
- **Default state for any new group is Unlocked.** The tool never restricts you without your asking.
- **Entering a group** to edit individual members is done by **double-click**, which triggers a focus/dim mode (the rest of the canvas dims; the entered group stays lit). Clicking out exits.
- **Groups have a persistent visual marker** (outline/tint) when *not* entered, so they read as a unit at a glance.

### The three lock/access modes (for groups)

- **Unlocked** means members are directly selectable and movable in place. No entering required; no dimming. For active arranging on the canvas, especially when working across multiple groups simultaneously.
- **Group Locked** means single-click selects/moves the whole group as one unit. To edit individual members, double-click to enter (dim canvas outside of group); click out to exit. For settled sections you might still want to tweak, but not disrupt entirely.
- **Grid Locked** means fully frozen. Cannot be moved, entered, or edited. Single-click selects the group *only* to reach the lock toggle in the context widget, so the user can always escape this state. To be used when a section is finalized, and doesn't want to mistakenly disturb it while working in the vicinity.

Lock modes cycle via the top-right context widget when the group is selected with green/amber/red state indicators.

### Individual object lock (and the tiered relationship)

Individual objects have a simpler **unlocked / locked** state. A locked object cannot be moved, deleted, or bulk-selected, but it *can* still be individually clicked to reach its unlock toggle. The user can never be permanently locked out.

The tiered relationship with group locks: **a lock protects against manipulation at its own tier; a higher tier's actions pass through it.** Concretely:

- A locked machine inside an Unlocked group: you cannot grab the machine individually, but moving the whole group carries it along.
- A locked (and not Grid-Locked) machine inside a group that the user selects to be deleted: the machine dies with the group. Group-tier deletion overrides the individual lock.
- A Grid-Locked group is protected as a whole, regardless of what's inside.

This is internally consistent and predictable: each tier protects its own tier; higher tiers usurp lower-tier locks.

### Belts and pipes, Segments and Runs

The most conceptually interesting system (translation: this broke O.D.'s brain so bad they needed to go outside and touch grass afterwards). The naive design ("a belt is a line") fights several requirements like in-game length limits, sensible deletion, and supply flow direction.

The settled model:
- **A Segment is the real object.** It's a single straight belt or pipe piece, bounded by the real in-game per-piece length limit. Segments participate in all universal object operations.
- **A Run is a specialized group of connected Segments.** When you draw a belt by dragging, the tool builds segments under your cursor and auto-groups them into a run. When you reach the in-game length limit, the tool inserts a break which silently spawns a new segment within the same run so you can keep dragging without re-clicking.
- **Runs inherit standard group behavior for free**. They move-as-unit, delete-whole, enter-to-edit-members, the three lock modes. The user's mental model of "this is one belt" is honored by the group; the internal reality of "many segments" is invisible until the user wants to manipulate one.
- **Runs add a thin specialized layer on top of groups:** they carry a per-run **flow direction** (uniform along the whole run, shown as hover chevrons, which can be inverted via the widget); and they have **connectivity awareness** so that removing a middle segment automatically splits the run into two independent runs.
- **Crossings are purely visual.** Two runs whose lines visually intersect mid-canvas do not auto-connect, do not auto-junction. Connections between runs happen only through dedicated splitter/merger/junction objects.
- **Belts and pipes render *beneath* structures.** This makes the Ctrl+drag spawn gesture (see next) feel natural.

The Ctrl+drag spawn gesture: while hovering over any structure (a splitter, merger, junction, or machine input/output), holding Ctrl and dragging spawns a new belt *underneath* that structure instead of moving the structure. There is no "connection" concept. The belt and the structure simply visually coincide, with the belt below. Forking and merging are mediated by placing splitter/merger/junction objects between runs, not by any auto-routing logic.

### Foundations you paint, but the tiles are real objects

Foundations are the one place where the *application* method is unique, but the *resulting objects* are not.

- A foundation tile is a normal object (selectable, movable, deletable, lockable, groupable).
- The brush has **+ (paint)** and **− (erase)** modes; sweeping with + drops one tile-object per swept block, snapping each to the nearest free block (block-snap, 8×8). The brush does not double-place on already-occupied blocks.
- Once placed, foundation tiles move at unit-snap (1m) like any other object. The unique brush is just a fast bulk creation/removal tool. The tiles themselves are classical objects.

This is *not* a "fill region" or "substrate" model. Treating tiles as real objects is what makes them participate in the universal systems (selection, grouping, locking) which the user will absolutely want for laying out floor plans.

### Custom locators (camera navigation)

A small, dedicated system for jumping the camera to named places on the canvas.

- A **Home** entry is permanent, un-editable, non-deletable, and points to world origin (the existing home-button behavior, now living in the locator panel).
- Up to 10 user-defined locators on top of Home. At cap, the "+ Add" button disables.
- Locators are objects on the **Annotations** layer (placeable, movable, deletable), but they **opt out** of locking and grouping as those operations would be meaningless for a navigation marker.
- Single-click a locator in the side panel automatically flies the camera there (eased animation). Double-click the panel entry opens inline rename.

### Undo / redo

A history of reversible **plan-modifying** actions. The discipline:

- **One continuous user gesture = one undo step.** A 20-block paint sweep is one Ctrl+Z. A 10-object multi-move is one Ctrl+Z. The user never has to undo per-tile or per-pixel.
- **Only plan changes are in the history.** Pan, zoom, "fly to locator," selection changes, entering/exiting a group are not undoable. Undo is for what changed *in the plan*, not what changed *in your view*.
- **Cap at ~100 actions.** Standard redo-clearing behavior. Taking a new action after an undo wipes the redo stack.

### Copy / paste / cut

Standard clipboard model with one notable refinement:

- **Ctrl+C / Ctrl+V / Ctrl+X.** Cut is a recoverable delete; copy/paste duplicates any selection (multiple objects, whole groups, or both, and relative arrangement preserved).
- **Paste places a ghost.** The pasted copy first appears as a translucent preview that follows the cursor; the user positions it and clicks to commit. (Cursor-Center mode is an instant drop at the cursor. Implementation of this paste alternative is deferred to the eventual settings menu.)

### Input model: pan, primary tools, modifiers

Pan is bound to **right-mouse drag**, **middle-mouse drag**, and **Space + left-drag** (three redundant bindings, no conflict between them). This matches the muscle memory of many game-engine and 3D-tool modeling applications, as well as other design tools like Adobe products, Canva, etc. It also leaves **left-mouse exclusively for the primary tool gesture** (select, place, draw, etc.).

Deletion happens deliberately: the context widget's delete button, the Delete/Backspace key on a selection, or Ctrl+X (recoverable).

Other named modifiers:

- **Ctrl+click** — additive multi-select toggle.
- **Ctrl+drag on a structure** — spawn a belt beneath it.
- **Shift (held during drag)** — half-step snap.
- **Ctrl+C / V / X / Z / Y** — copy / paste / cut / undo / redo.

The modifier budget on Ctrl is admittedly crowded at this time. The gestures are distinguishable (click vs drag vs letter key), but a future settings/keybind menu is planned to expose all of these as remappable partly for accessibility, partly so users from different tool backgrounds can reshape the input model to their habits.

---

## Pinned for the future:

Features and action items the project will eventually want, but which are deferred from the early releases for various reasons:

- **A settings / keybind menu** - Remappable keys, paste-mode toggle (Ghost vs Cursor Center), and other preferences.
- **UI personalization** - Custom UI and text colors, fonts, and text accessibility features.
- **Sharing / export** - once save/load exists - let your friends roast your builds!
- **Object rotation** - you spin me right 'round like a hurricane (sooner rather than later).
- **Real recipe data** - in-game throughput, recipes, derived numbers on placed machines - "how much will this build cost" before you build in-game.
- **Nested groups** - the data model already supports it; only the UI restriction needs lifting, deferred because necessity and user-desire isn't immediately known. Not immediately included to avoid over-complication and bloat. Possibly a future setting toggle.

Above list is not priority-order. Items can be implemented when/if they fit in.

---

## Process / how the project is being built:

A short note on the build approach itself:

The project is being built **one release at a time** in accordance with ***THIS*** Project Charter with each release designed to leave the tool in a coherent, usable state. Each release's design is planned and prototyped before code is finalized and pushed to the main repository. The designs are documented before systems are implemented. This is intentional as it keeps the tool coherent, consistent, and protects what little sanity the developer has left.

The tool is being **documented publicly** as it's built, meaning there will be written dev-log entries with technical breakdowns, and recorded videos walking through each release. The dev-log template per release: a feature-by-feature technical breakdown.

The development environment is **React + Vite + JavaScript**, with the project laid out as a normal open-source repository from day one. The choice of stack is conservative on purpose. It's popular, well-documented, and broadly approachable by contributors.

---

## How to use this document

The intended workflow:

1. When a new feature, refactor, or "what if we..." idea comes up, check it against the **Intent / Identity / Principles / Scope** sections. If it conflicts with the project's identity or principles, the conversation is about whether to *change the charter*, not about whether to just go build the thing.
2. When two design options compete and the right call isn't obvious, ask which one better serves the **Guiding Principles**. They've been calibrated specifically so that this question has answers.
3. When a system feels like it's getting complicated, check whether it's reaching for a **universal model** that already exists. The architectural commitment is that systems should generalize, not multiply.
4. If the charter itself starts to feel wrong, open an Issue to discuss updating *the charter* deliberately. We don't want to let the project drift away from a charter that no longer reflects it.

The charter is a flexible North Star. The intent is that we try to stick to the documented goals and guidelines as much as possible, and only modify it as the project evolves.

---

*This is version 1 of the charter, written at the close of the project's initial design pass and before the first release was built. Future revisions should preserve a sense of what changed and why.*