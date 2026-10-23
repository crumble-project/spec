# Product brief

Historical product brief for Crumble. Later decisions supersede parts of it:

- Each bot has one continuous [bot chat](../GLOSSARY.md) instead of multiple sessions.
- The project spans four repositories: `bot` (server, default skills, and bundled web UI), `apple` (`apfelkern`, `macos`, and `ios`), `android`, and `spec`.
- New capabilities are tracked as [feature specifications](../features/README.md).

## Vision

Crumble is a self-hosted, client/server AI agent platform comparable to Hermes Agent and Grok Bot, built on **Pi Durable**. Owners create and manage independent bots, each with its own identity, continuous chat, memory, learned skills, scheduled tasks, MCP integrations, and isolated workspace.

## Core capabilities

- **Bots and identities:** Create, configure, duplicate, enable/disable, and delete bots with custom avatars, instructions, and model overrides.
- **Conversations:** Continuous bot chats and multi-bot [group chats](../features/0001-group-chats.md) with streaming replies, attachments, reactions, inline charts/tables, and [history search](../features/0003-chat-history-search.md).
- **Autonomous work:** Background coding jobs and [desktop jobs](../features/0002-desktop-jobs.md) running in per-bot Microsandbox microVMs, plus one-time and cron scheduled tasks.
- **Compounding context:** Shared and per-bot memory with provenance, on-demand [skill packages that bots learn and refine](../features/0005-learned-skills.md), and reversible change history.
- **Providers and integrations:** API keys and interactive [provider account sign-in](../features/0004-provider-account-login.md), plus per-bot and shared MCP servers with OAuth.
- **Native and web clients:** Cohesive macOS, iOS, Android, and bundled web applications backed by a versioned HTTP and SSE contract.

## Engineering principles

- Favor simplicity, correctness, and mature libraries (Pi Durable, Pi AI, Hono, SQLite, Microsandbox) over custom infrastructure.
- Keep the server authoritative for execution, durability, and encrypted credentials; clients use optimistic UI and reconcile with server snapshots.
- Maintain explicit, versioned contracts between server and clients and verify behavior with automated tests.
