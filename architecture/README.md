# Architecture

Cross-repository boundaries and responsibilities across the Crumble platform. Repository-local decisions live in each repository's `docs/adr/`.

```mermaid
flowchart TD
  subgraph Clients
    web["Bundled Web UI (/ui)"]
    macos["macOS App (apple/macos)"]
    ios["iOS App (apple/ios)"]
    android["Android App (android)"]
  end

  apfelkern["apfelkern (apple/apfelkern)\nGenerated Swift client, delivery state & BotAvatar"]
  macos --> apfelkern
  ios --> apfelkern

  subgraph Server["bot (Bun + Hono + SQLite + Pi Durable)"]
    api["Authenticated HTTP & SSE API (/v1)"]
    store["Product SQLite Store\nAgents, groups, skills, memories, schedules, changes"]
    pi["Pi Durable Stores\nPer-bot & per-group transcripts, jobs, reviews"]
    ws["Microsandbox Workspaces\nPer-bot Linux microVM (coding & bot desktop)"]
  end

  web --> api
  apfelkern --> api
  android --> api
  api --> store
  api --> pi
  pi --> ws
```

## Repository boundaries

| Repository | Scope |
| --- | --- |
| `spec` | Canonical [glossary](../GLOSSARY.md), [feature specifications](../features/README.md), and authored schemas. |
| `bot` | Server runtime, Pi Durable orchestration, Microsandbox workspaces, default skills (`skills/`), bundled web UI (`web/`), and the versioned OpenAPI/SSE contract (`openapi/`). |
| `apple` | Shared Swift package (`apfelkern`), native macOS client (`macos`), and native iOS client (`ios`). |
| `android` | Native Kotlin and Jetpack Compose Android client (`android`). |

Follow the [contribution guide](../CONTRIBUTING.md) when proposing cross-repository architecture changes.
