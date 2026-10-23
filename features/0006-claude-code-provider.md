# 0006: Claude Code provider

- Status: Accepted
- Issue: [crumble-project/spec#10](https://github.com/crumble-project/spec/issues/10)
- Repositories: bot, apple (apfelkern, macOS, iOS), android

## Problem

Owners with a Claude Pro or Max subscription want their bots to run on it. Crumble's Anthropic account sign-in (feature 0004) sends the subscription token straight to the Messages API from Pi AI. Anthropic's [legal and compliance page](https://code.claude.com/docs/en/legal-and-compliance#authentication-and-credential-use) (read 2026-10-23) does not permit third-party developers to offer Claude.ai login in their own applications, to route requests through Free, Pro, or Max credentials, or to collect, store, or intermediate Claude.ai credentials. It does allow an end user to sign in to the unmodified Claude Code binary with their own subscription, including where a platform hosts Claude Code. Hermes Agent drives the official Claude Code CLI for the same purpose ([claude-subscription-directsdk](https://github.com/NousResearch/hermes-official-plugins/tree/main/claude-subscription-directsdk)); Crumble has no equivalent.

Anthropic has not confirmed that this arrangement, in particular the admission relay below, is permitted. The owner accepted that risk; see Decisions.

## Behavior

A new provider, **Claude Code**, appears in provider settings next to the Pi AI providers. Bots that select one of its models run every model request through the official `claude` CLI on the server, on the owner's subscription. Crumble keeps the agent loop: its own tools, working context, compaction, retries, and usage records. Claude Code only produces the next assistant message.

```mermaid
sequenceDiagram
  participant Runtime as Bot runtime (Pi Durable)
  participant Adapter as Claude Code adapter
  participant CLI as claude -p (fresh process)
  participant Relay as Admission relay (loopback)
  participant Anthropic

  Runtime->>Adapter: stream(model, working context, tools)
  Adapter->>CLI: spawn; replay context as stream-json frames
  CLI->>Relay: Messages request with the CLI's own authorization
  Relay->>Anthropic: first request only, forwarded from memory
  Anthropic-->>Relay: streamed reply
  Relay-->>CLI: streamed reply
  CLI-->>Adapter: stream-json events
  Adapter-->>Runtime: text, thinking, tool calls, usage, stop reason
  Note over Runtime: Crumble runs the tools and calls stream() again
```

### Credential boundary

- Crumble never reads, writes, or deletes Claude Code's credential files or keychain entries, and never stores a Claude credential in its database, logs, transcripts, or API responses.
- The admission relay does handle the credential in transit: every Messages request the CLI makes passes through it with the CLI's authorization header, which the relay forwards to Anthropic from memory without logging or persisting it. This is the same boundary as Hermes' relay. Whether it counts as intermediating is an open question.

### Installation and sign-in

- **Installation:** The owner installs Claude Code; Crumble does not ship it. The server finds `claude` on `PATH`, in the usual install directories, or at `CRUMBLE_CLAUDE_COMMAND`. For Docker, the setup guide installs it onto the data volume so it survives image updates.
- **Config directory:** The CLI keeps its login in `CRUMBLE_CLAUDE_CONFIG_DIR`, by default `claude` inside the data directory. Every process Crumble starts, including status checks, sets `CLAUDE_CONFIG_DIR` to it.
- **Sign-in:** The owner runs Claude Code's own login with that directory, as provider settings show it, for example `docker compose exec crumble sh -c 'CLAUDE_CONFIG_DIR="$CRUMBLE_DATA_DIR/claude" claude auth login'`. A plain `claude auth login` signs in a different directory and leaves the provider signed out. Crumble shows the exact command with the resolved executable and directory.
- **Refresh:** Claude Code refreshes its own login. Crumble does not. When a turn fails with Claude Code's authentication error, the provider reports signed out until the next status check finds a login.
- **Sign-out:** Through Claude Code: `claude auth logout` with the same directory, shown in provider settings. Removing the provider credential through the API is refused with that instruction; Crumble does not sign out for the owner.
- **Status:** Crumble runs `claude --version` and `claude auth status --json` when providers are listed, cached for 30 seconds and invalidated by an authentication failure. The provider is usable only when the CLI is found, its version is qualified, and `loggedIn` is true with a Claude subscription login.

### Supported versions

- Bot pins a list of qualified Claude Code versions: versions whose replay, tool denial, recovery, and relay behavior passed the wire tests below. A CLI version outside the list is reported as unsupported, with the installed version, the qualified versions, and how to install one. Bot turns on the provider are refused while it is unsupported; there is no best-effort mode.
- Every process Crumble starts disables Claude Code's auto-updater, but the owner's own installation can still update. Qualifying a new version means running the wire tests against it and adding it to the list in a bot release.

### Requests

- **Isolation:** Each model request is a fresh `claude -p` process in its own process group with stream-json input and output, no built-in tools (`--tools ""`), no setting sources, no slash commands, no session persistence, `--max-turns 1`, `--permission-mode dontAsk`, and only an inert MCP server (`--strict-mcp-config`) that lists the turn's Crumble tools and denies every call. The system prompt and request fields go through private per-request files. Auto-compaction, tool search, HTTP retries (`CLAUDE_CODE_MAX_RETRIES=0`), and the token-budget reminder are off. Claude Code gets an allowlisted environment, so inherited API keys, base URLs, cloud-backend variables, and Crumble's own secrets never reach it.
- **Replay:** The working context is replayed in order as stream-json frames: earlier user and tool-result frames with `shouldQuery:false`, each answered by a zero-turn acknowledgment before the next frame is sent; assistant turns as the CLI's original messages, including signed thinking, when Crumble's stored projection still matches them, and as plain text and tool calls when compaction or edits changed them. Only the last user frame queries. One native session ID per conversation, derived from the system prompt and first frame, keeps the prefix stable. A missing or non-zero acknowledgment fails the request as unsupported replay.
- **Admission relay:** A loopback relay on a random port and route, set as the CLI's `ANTHROPIC_BASE_URL`, forwards the first Messages request per model request and refuses later attempts locally. Claude Code 2.1.309 sends a second request after a `max_tokens` stop even with `--max-turns 1`, so the relay is what holds it to one. It captures the streamed reply, restores what the CLI rearranges for its own use (the date line, context reminders, cache breakpoints) so prefixes stay stable, and honors the standard proxy variables.
- **Completion:** The adapter releases a response to the runtime only when all of these hold: the relay captured exactly one complete upstream response with status 200, `message_stop`, and final usage; the CLI emitted exactly one result; every tool call's arguments parsed as a complete JSON object; and the streamed text equals the final text. A CLI exit of 1 with `error_max_turns` is the expected end of a tool-call response and passes only with a complete capture whose stop reason is `tool_use`. Anything else fails without releasing tool calls (see acceptance criteria).
- **Models:** The catalog lists the models the CLI's `initialize` handshake offers for the signed-in account, with a pinned table adding context windows and thinking rules. Pinned 1M models are requested with the CLI's `[1m]` suffix, because behind the relay the CLI otherwise uses its 200K gateway default. A model the table does not know is listed at 200K, never at a guessed larger window. Pinned models the handshake omits stay selectable; when the handshake fails, the pinned table alone is listed.
- **Thinking:** Reasoning effort maps to the CLI's `--effort`. Models that cannot turn thinking off get the lowest effort instead of a refused request.
- **Errors:** Upstream rejections keep their HTTP status. Errors the CLI answers itself map to typed provider errors: rate limit (429, including plan and session limits), billing (402), authentication or missing login (401), overload (529), server error (503), and missing CLI (503).
- **Usage:** Token counts, including cache reads and writes, are recorded as usual. Crumble records no cost for these requests: subscription use has no per-request price, and the CLI's list-price estimate is not recorded, so it can never read as a charge.
- **Cancellation and timeouts:** Stopping a turn, or a read-idle timeout, kills the process group and closes the upstream connection.

## Out of scope

- Claude Code's own tools, permissions, sessions, compaction, skills, or plugins.
- Falling back to an API key or to the direct Anthropic sign-in when the CLI fails.
- Shipping, installing, or updating Claude Code for the owner, and signing in or out on the owner's behalf.
- Running the CLI inside a bot's workspace.
- More than one Claude account per server.
- Loading third-party plugins. The provider is built in, behind the internal plugin interfaces in bot's ADR 0004.

## Acceptance criteria

Offline, against a fake upstream and a fake or pinned Claude Code:

- A bot on a Claude Code model answers, calls Crumble tools over several rounds, and records usage, with exactly one upstream request per model request.
- No Claude Code built-in tool or MCP tool runs inside the CLI process; tool calls reach Crumble's runtime and nothing else.
- A truncated stream, a dropped upstream connection, or an upstream HTTP error fails the request with the upstream status where there is one, and releases no tool calls.
- A tool call whose arguments are incomplete or not a JSON object fails the request; no tool from that response runs, including complete ones beside it.
- A refusal finishes as a refusal with its explanation; a tool call it cut off is not released.
- When the CLI attempts a second request (after `max_tokens` or a refusal), the relay refuses it, the runtime receives the first complete response with its own usage and stop reason, and the refused attempt is recorded.
- Exit 1 with `error_max_turns` is accepted only with a complete capture ending in `tool_use`; any other non-zero exit or error result fails.
- Replayed history reaches the upstream in transcript order. A second request in the same conversation carries the first request's prefix unchanged up to its cache breakpoint, with at most four breakpoints. This verifies prefix continuity and breakpoint placement, not cache hits.
- An unqualified CLI version shows as unsupported with the installed and qualified versions, and turns on the provider are refused without starting a request.
- Without the CLI, or signed out, provider settings show the state and the command to fix it; a bot turn fails with that reason; no other provider is affected.
- Status checks and requests use `CRUMBLE_CLAUDE_CONFIG_DIR`: a login in another directory leaves the provider signed out.
- Removing the provider credential through the API is refused with the sign-out instruction and changes nothing.
- Stopping a turn ends the CLI process tree within one second; no orphaned `claude` or `node` process remains.
- A restart in the middle of a turn resumes like any other provider, starting a new CLI process.
- Crumble's database, logs, transcripts, and API responses contain no Claude credential.
- Unit tests use a fake `claude` and need no credentials or network; CI time stays within its two-minute limit. Wire tests against real Claude Code versions run locally and qualify each version on the list.

Live, optional, run by hand with a real subscription:

- Cache qualification: a multi-round tool conversation records the cache-read share of input tokens per request. This measures real cache hits, which the offline tests cannot.

## API and contract

Compatible additions in the next contract 1.x minor version (proposed shape):

- `Provider.externalAuth`, null for providers that sign in through Crumble. For Claude Code: `status` (`signed_in`, `signed_out`, `cli_missing`, `unsupported_version`, `error`), `cliVersion`, `qualifiedVersions`, `signInCommand`, `signOutCommand`, and `message`. `authMethods` is empty and `credentialType` null for such a provider.
- `DELETE /v1/providers/{provider}` answers `409` for a provider with `externalAuth`, with a message carrying the sign-out command.
- `GET /v1/models` lists the provider's models only while `status` is `signed_in`.

## Clients

- **Web UI (bot), macOS and iOS (apfelkern):** Provider settings show the Claude Code status, the sign-in or sign-out command with a copy action, and for an unsupported version the installed and qualified versions. No sign-in or remove button for this provider.
- **Android:** The same, in its provider settings, when Android ships provider settings.
- Clients without the contract addition show the provider without sign-in actions; a remove action fails with the `409` message.

## Decisions

- **Drive the official CLI instead of calling the API with the subscription token.** The policy explicitly allows an end user signing in to unmodified Claude Code hosted by a platform; it explicitly forbids the direct path. Rejected: Pi AI's direct Anthropic OAuth path.
- **Port Hermes' design and code.** Argument and environment set, replay protocol, admission relay, completion checks, model table, error mapping, and their regression cases follow [claude-subscription-directsdk](https://github.com/NousResearch/hermes-official-plugins/tree/main/claude-subscription-directsdk) at `54afaf5`, translated to TypeScript, with its MIT notice in bot's third-party notices. Hermes found the CLI's version-specific behavior through live qualification; re-deriving it would repeat that work. Hermes-specific parts (its chat-completions shape, setup wizard, plugin manifest) are replaced by Pi AI's provider interface and Crumble's provider settings.
- **Only qualified CLI versions.** Tool isolation and response integrity depend on version-specific CLI behavior, so an unknown version is refused rather than tried. Hermes instead qualifies a pinned version in CI and runs others best-effort.
- **Fresh process per model request, Crumble owns the loop.** Keeps compaction, tools, retries, and restarts in Pi Durable. Rejected: a long-lived Claude Code session with its own tools, which would duplicate the runtime and hide tool activity from the transcript.
- **Sign-in and sign-out stay in Claude Code.** Rejected: pasting a `claude setup-token` token into Crumble and storing it, which collects and stores a Claude.ai credential, and relaying `claude auth login` through Crumble's login session, which passes the browser code through Crumble. Claude Code is the one provider that needs a shell on the server to sign in; the owner accepted that.
- **The owner installs Claude Code.** Crumble's images do not contain it. This does not by itself settle whether Anthropic's Commercial Terms apply (see open questions).
- **No extra usage limits.** As in Hermes, scheduled tasks and reviews on this provider draw on the owner's plan like any `claude -p` use; the owner chooses which bots use it.
- **Built in, behind plugin interfaces.** The provider is a plugin contribution compiled into bot (bot ADR 0004), so a later plugin system can load it without rewriting it.

- **Accept the policy risk and follow Hermes.** Anthropic has not answered whether the relay counts as intermediating credentials, or whether running an owner-installed Claude Code from Crumble needs the Commercial Terms. The owner accepted shipping on Hermes' precedent without asking.

## Open questions

- Should the direct Anthropic account sign-in from feature 0004 be removed, given the policy quoted in Problem? Does not block this feature.
