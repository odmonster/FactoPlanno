# Contributing to FactoPlanno

Thanks for your interest in FactoPlanno. This document explains how the project is built and the best way to get involved, so your time and effort don't go wasted.

## How this project is built

FactoPlanno is built **phase by phase**, against a design roadmap that's been deliberately planned in advance. Each phase is signed off before code is written, and the design is documented before the systems are implemented. This is intentional as it keeps the tool coherent and keeps the public build honest.

What this means for contributions:

- **The most useful contributions right now are small and aligned with the current phase** — bug fixes, small focused improvements, documentation fixes, clear bug reports.
- **Large, unsolicited PRs that jump ahead of the roadmap, or re-architect existing systems, are unlikely to be merged.** Not because the effort isn't appreciated, but because they cut against the phase-by-phase plan and the project's design direction. Please don't sink a weekend into a big PR and hope — it may be declined for reasons that have nothing to do with code quality.
- **If you have a bigger idea, open an Issue to discuss it first.** If it fits the project's direction, great. We can figure out where it belongs.

## Reporting bugs and suggesting ideas

Open an **Issue**. A good bug report includes what you did, what you expected, and what actually happened. Describe the problem you're witnessing or experiencing, not the feature you want - it makes it much easier to find the right fit. For more details, please follow the Bug Report Guide in the wiki.

## Pull request workflow

1. **Fork** this repository to your own account.
2. **Create a branch** for your change (ex. `fix/belt-snap-offset`).
3. **Make your change** and commit it with a clear summary AND description.
4. **Push** the branch to your fork.
5. **Open a pull request** against `main` in this repository.

A quick note about how the repo is set up: **`main` is protected.** All changes go through pull requests - including the owner's. No one can push directly to `main` by design, it's not a barrier aimed at you.

## Code style

Match the existing style of the codebase. The repository includes an ESLint configuration; please make sure your changes pass linting before opening a PR.

---

This project is a tool its author actively wants to exist, built openly so others who love it can use and improve upon it. Contributions in that spirit are very welcome.