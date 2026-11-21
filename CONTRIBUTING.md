# Contributing to FactoPlanno

Thanks for your interest in FactoPlanno. This document explains how the project is built and the best way to get involved, so your time and effort don't go wasted.

## How this project is built

FactoPlanno is built according to **planned releases**, against a design roadmap that's been planned in advance by @odmonster. Each release's design is planned and prototyped before code is finalized and pushed to the main repository. The designs are documented before systems are implemented. This is intentional as it keeps the tool coherent, consistent, and protects what little sanity the developer has left.

What this means for contributions:

- **The most useful contributions right now are small and aligned with the next release goalpost currently in progress**: bug fixes, small focused improvements, documentation fixes, clear bug reports, or ideas/suggestions submitted via Issue discussions.
- **Large, unsolicited PRs that jump ahead of the roadmap, or re-architect existing systems, are unlikely to be merged.** Not because the effort isn't appreciated, but because they cut against the release plan and the project's design direction. Please don't sink a weekend into a big PR and hope for it to be included. It will most likely be declined for reasons that have nothing to do with code quality.
- **If you have a bigger idea, open an Issue to discuss it first.** If it fits the project's direction, great. We can figure out where it belongs, or how to incorporate it.

## Reporting bugs and suggesting ideas

Open an **Issue**. A good bug report includes what you did, what you expected, and what actually happened. Describe the problem you're witnessing or experiencing, not the feature you want - it makes it much easier to find the right fit. For more details, please follow the Bug Report Guide in the wiki.

## Pull request workflow

1. **Fork** this repository to your own account.
2. **Create a branch** for your change (ex. `fix/belt-snap-offset`).
3. **Make your change** and commit it with a clear summary AND description (bonus points if you include a change readme doc).
4. **Push** the branch to your fork.
5. **Open a pull request** against `main` in this repository.

NOTE: **`main` is protected.** All changes go through pull requests - including the owner's. No one can push directly to `main`. This is intentional.

## Code style

Match the existing style of the codebase. The repository includes an ESLint configuration; please make sure your changes pass linting before opening a PR.
The owner, @odmonster, is not a programmer by profession, they are a game dev (yes, they're different breeds). Constructive criticism, critiques, and suggestions are welcome so long as they are made in good-faith, and actually helpful.

---

This project is a tool its author actively wants to exist, built openly so others who love it can use and improve upon it. Contributions in that spirit are always welcome.