# Features

A feature specification describes one user-visible capability across every repository it touches. It is the single place that says what a feature does, why, and when it is done.

## Lifecycle

1. **Idea.** Open an issue in this repository with the idea form. Issues are the backlog.
2. **Draft.** Copy [TEMPLATE.md](TEMPLATE.md) to `NNNN-short-name.md`, using the next free number, and link the issue. Resolve open questions with the owner. New terms go into the [glossary](../GLOSSARY.md) as they are settled.
3. **Accepted.** The owner approves the specification. Nothing is built from a draft.
4. **Implementation.** Work is split into milestones. When a milestone's plan is ready, open one issue for it in the repository that implements it, linking the plan, and add it as a sub-issue of the idea issue; the pull request closes it. Plan later milestones and open their issues only when the previous one is merged. Plan checkboxes track tasks, so tasks get no issues. Each affected repository gets a branch named `feat/NNNN-short-name`. Work in contract order: bot and its contract release, then apfelkern, then desktop, iOS, and Android. Every pull request links the specification.
5. **Implemented.** Every acceptance criterion is verified, the changelogs are updated, and the idea issue is closed.

Change an accepted specification by editing it in a pull request that says what changed and why. Record cross-repository technical decisions in [architecture](../architecture/README.md) and repository-local decisions in that repository's `docs/adr`.

## Index

No feature specifications yet.
