# FactoPlanno

A web-based, open-source, minimalist 2D factory-planning canvas for *Satisfactory* - a drafting tool for laying out your factory before you build it in-game.

FactoPlanno is a blueprint-style grid: place machines, draw belts and pipes, snap things into place, and organize a factory plan spatially. It's inspired by **SaLT** (by AutumnFallStudios) - faithful to what made that tool good (the clean, top-down, snap-to-grid feel) while aiming to be more capable in the areas where it fell short, such as multi-selection, grouping, proper belt modeling, undo, layers, and foundations.

It is **a drafting tool - not a calculator and not a simulator.** It won't compute production rates or simulate the game. Its job is to give you a fast, clean surface to *plan* on, with enough fidelity (real in-game dimensions, real foundation sizes) that a plan you make here is one you can actually execute in-game.

## Status

**Early development.** The project is currently at the scaffold stage (Phase 0). The core design has been worked out in advance and is documented; the tool itself is being built **in public, phase by phase**, with each phase leaving it in a coherent, usable state. Expect things to be incomplete or absent for now.

## Built in public

Development is documented as it happens:

- **Dev logs** - written entries live on GitHub and on the project's itch.io page.
- **Video dev logs** - walkthrough versions go up on YouTube.

Links will be added here as those pages go live.

## Running locally

**Prerequisites:** a recent version of [Node.js](https://nodejs.org/) (v20 or newer).

```bash
git clone https://github.com/odmonster/FactoPlanno.git
cd FactoPlanno
npm install
npm run dev
```

Then open the local URL Vite prints (by default, http://localhost:5173).

## Tech stack

React + Vite + JavaScript. The stack is deliberately conservative and broadly approachable, so the project is easy for contributors to pick up.

## Contributing

FactoPlanno is open-source and built phase by phase against a planned roadmap. If you'd like to help, please read [CONTRIBUTING.md](CONTRIBUTING.md) first. It explains how the phase-based process works and the best way to get involved.

## License

[MIT](LICENSE.md) — you're free to use, modify, and redistribute this, including commercially, as long as the copyright notice is kept.