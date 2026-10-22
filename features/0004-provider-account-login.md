# 0004: Provider account login

- Status: Draft
- Issue: [crumble-project/spec#7](https://github.com/crumble-project/spec/issues/7)
- Repositories: bot, apple (apfelkern, macOS, iOS), android

## Problem

Owners cannot use provider subscriptions in Crumble, even when Pi AI supports those accounts. Settings accepts only API keys. The server treats every stored provider credential as an API key and prevents Pi AI from writing refreshed credentials.

The owner must be able to sign in from a client while the Crumble server runs on another machine, including in Docker.

## Behavior

### Available login methods

Provider settings show the interactive authentication methods exposed by each installed Pi AI provider. A provider can offer API-key setup, account login, both, or neither. Use provider-supplied names and login labels when available.

Support Pi AI's provider-neutral interaction protocol rather than a separate implementation for each provider. This includes OpenAI account login and the legacy OpenAI Codex provider when exposed by the installed library. Other supported providers use the same interface without a separate client release for each provider name.

Ambient credentials remain usable where supported. An ambient-only provider does not show a login action that it cannot perform. Existing API-key setup and saved API keys continue to work.

Each provider has one saved credential for the Crumble server, shared by bots configured to use that provider. Account login does not create a separate account for each bot.

### Interactive login

The owner selects a provider and an available method. The client shows a pending state immediately and starts an authenticated login session on the server.

The client presents Pi AI's interaction steps:

- Authorization URLs, with an explicit action to open the owner's browser.
- Device verification URLs and user codes, with expiration information when provided.
- Informational messages, links, and progress.
- Text, secret, selection, and manual-code prompts.

Secret inputs are obscured. Selection responses use the provider's option identifiers. A prompt that Pi AI withdraws cannot accept a later response. Each response belongs to one session and one outstanding prompt.

The owner can cancel a login. Cancellation stops pending prompts and provider work and prevents a late completion from saving credentials. A second login for the same provider is rejected while the first is active. Different providers can have independent sessions.

The client reports success only after Pi AI completes the flow and the server persists the credential. The provider's configuration state and available models then refresh without restarting the server or bots.

Starting or failing a replacement login does not discard an existing credential. A successful login replaces it. Sign-out cancels pending login for that provider and removes its saved credential. It does not claim to revoke the account's authorization at the provider.

### Remote servers and recovery

Login must work when the server and browser are on different machines. A callback listener on the server's loopback interface is not assumed to be reachable from the owner's browser.

Use the device flow or manual callback/code interaction supplied by Pi AI where applicable. If the provider requires manual callback input, explain what the owner must copy. Do not require access to the container shell or its credential files.

If the installed library cannot complete a provider flow with a remote browser, report that limitation explicitly. Do not offer it as a working remote login method. OpenAI account login must have a verified remote-server path before this feature is accepted as implemented.

A temporary client disconnect does not discard the pending server session. The client can retrieve its current state and outstanding prompt after reconnecting. Session responses must not expose previously submitted secrets.

Login sessions are temporary and expire after bounded inactivity and an absolute lifetime. Expiration cancels provider work. A server restart invalidates pending sessions explicitly; the owner starts again. Previously saved credentials remain available.

### Credentials and refresh

The server stores Pi AI's typed credentials encrypted at rest. Credentials and provider-specific fields must survive a restart without being converted into API-key strings.

Pi AI owns provider authentication, request-auth derivation, and token refresh. Crumble implements the persistent credential-store interface, including serialized mutations for each provider across all runtime instances in the server.

Login, refresh, API-key replacement, and sign-out must not overwrite newer credentials with stale results. Concurrent bot requests must not independently rotate the same refresh token. A refresh that finishes after sign-out must not restore the removed credential.

If refresh fails, report the failure and allow reauthentication. Preserve the saved credential unless the owner replaces or removes it. Do not silently switch to an environment credential after a saved credential fails.

Provider access tokens and refresh tokens never appear in client responses, logs, transcripts, or model tools. Only login interaction data needed by the owner crosses the client connection. Submitted codes, callback URLs, and secret inputs are not logged.

All login-session endpoints require the existing server authentication. Session identifiers do not grant access by themselves. Remote login transports sensitive authorization data and requires HTTPS or an encrypted private connection; plaintext HTTP across an untrusted network is not supported.

## Out of scope

- Reimplementing provider OAuth or refresh protocols outside Pi AI.
- Providers or authentication methods absent from the installed Pi AI version.
- Multiple saved accounts for one provider, or account selection per bot.
- Importing credentials from Codex CLI, Pi, or another application's credential files.
- Changing MCP integration sign-in.
- Buying subscriptions, guaranteeing model availability, or bypassing provider account restrictions.
- Provisioning TLS, a reverse proxy, or a private network.

## Acceptance criteria

- Provider settings reflect the installed providers' supported methods and labels without a hard-coded subscription-provider list.
- Every supported interaction type can complete through the authenticated client/server interface, including prompt withdrawal and selection identifiers.
- An owner can complete OpenAI account login from macOS against a remote server, including a Docker deployment, without reading container credential files.
- Other exposed provider login flows use the same interaction interface; unavailable remote flows are identified explicitly rather than hanging.
- Success appears only after credential persistence. Failure, cancellation, expiration, and interrupted sessions are distinguishable from success.
- Reconnection recovers a pending session; server restart invalidates that session while preserving saved credentials.
- Existing stored API keys and API-key setup remain usable. Failed replacement login leaves the previous credential intact.
- Successful login updates available models and allows subsequent bot requests without restarting the server.
- Typed credentials survive server restart. Pi AI refresh persists updated credentials and serializes concurrent refreshes.
- Sign-out and credential replacement cannot be undone by stale login or refresh completion.
- Unauthenticated requests cannot start, inspect, answer, or cancel a login session. Stale or mismatched prompt responses fail explicitly.
- Credentials and submitted authorization secrets are absent from API status responses, logs, transcripts, and tool output.
- macOS, iOS, and Android expose the same supported methods and outcomes. Older clients retain their existing API-key behavior.
- Default automated verification uses fake provider boundaries, with no real accounts, network requests, or paid model calls. Live account verification requires the owner's explicit participation.

## API and contract

Bot owns provider login sessions, credential persistence, and the model catalog. Extend provider discovery with authentication-method metadata and non-secret configuration state.

Add authenticated operations to start a login, retrieve session state, answer a prompt, cancel a session, and remove a saved provider credential. Session state identifies pending, successful, failed, cancelled, and expired outcomes. Starting another session for an active provider produces an explicit conflict.

Keep existing API-key endpoints compatible within contract major version 1. Define concrete endpoints and schemas in bot, then generate the contract and update client bindings. Do not duplicate generated API definitions here.

## Clients

Provider settings remain separate from the Crumble server connection token and MCP integration settings. Explain that provider credentials are stored on the Crumble server.

macOS, iOS, and Android render provider-neutral login steps and open authorization links only on owner action. Clients support cancellation, connection loss, and retry without presenting a cancelled or failed login as configured.

Apple clients share transport and model definitions through apfelkern. Platform-specific browser presentation remains client-owned.

Implement in contract order: bot and its contract release, Apple shared code and macOS, iOS, then Android. macOS is the first interactive client milestone, not the completion of the entire feature.

## Decisions

- Reuse Pi AI's authentication methods and interaction types. Codex-specific client logic would duplicate functionality and exclude other supported providers.
- Keep credentials on the server, where model requests and refresh occur. Clients relay interaction steps, not saved access or refresh tokens.
- Preserve one credential per provider, matching the existing server-wide provider settings and Pi AI's credential-store contract.
- Keep login sessions temporary. Saved credentials survive restart; unfinished authorization does not.
- Preserve existing credentials until replacement succeeds. Opening a login screen must not interrupt working bots.

## Open questions

- Confirm the proposed client scope: macOS first, with iOS and Android required before marking the feature implemented.
- Verify the remote-browser interaction paths of the installed Pi AI providers, especially OpenAI, before accepting the specification. Any library limitation must be resolved or reflected in the supported methods.
- Choose inactivity and absolute session-lifetime bounds during specification review.
