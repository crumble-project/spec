# 0003: Chat history search

- Status: Implemented
- Issue: [crumble-project/spec#5](https://github.com/crumble-project/spec/issues/5)
- Repositories: bot

## Problem

After compaction, a bot has summaries instead of older messages in its working context and cannot search the original transcript messages retained by the server.

## Behavior

Bots can search original messages (`history_search`) and read bounded context around a match (`history_read`) when the owner asks about earlier conversations.

- **Scope:** In a bot chat, a bot can search its own bot chat and group chats where it is currently a member (including pre-membership messages), or narrow to one chat. In a group turn, a bot can search only that group's shared transcript. Every search and read rechecks current access.
- **Searchable content:** Authored message bodies from the owner and bots, including messages older than compaction. Tool calls, tool results, compaction summaries, reactions, attachment contents, and private group-turn records are excluded.
- **Matching and paging:** Case-insensitive literal substring matching, ordered newest-first with deterministic tie-breaking. Queries are 1–500 Unicode code points; pages return up to 20 matches with 500-code-point excerpts.
- **Consistent cutoff:** Each search fixes its eligible chats and message cutoff at start and binds them into an encrypted continuation token. Surrounding reads (`history_read`) return up to 30 messages and 20,000 code points around a match, mark omitted bot-chat tool activity, and paginate in either direction using the same cutoff.
- **Historical evidence:** Retrieved messages do not replay submissions, wake bots, or alter the transcript.

## Out of scope

- Searching tool activity, compaction summaries, attachment contents, or coding/desktop job transcripts.
- Semantic/embedding search, query syntax, full-text indexing, or client search UIs.

## Acceptance criteria

- Search and surrounding reads recover original messages across compaction and server restarts with stable IDs, senders, and timestamps.
- Literal substring matching, newest-first ordering, query validation, and excerpt/page bounds (20 matches / 500 code points; 30 messages / 20,000 code points) are enforced.
- Access checks prevent cross-bot reads and revoke group access immediately upon member removal or group deletion, even with an existing cursor or message ID.
- Bot-chat reads indicate omitted tool activity; group reads expose no private member tool activity.
- Retrieval failures report an explicit error rather than an empty match list.

## API and contract

Shipped in `bot` as model tools (`history_search` and `history_read`) alongside the existing `group_chats` tool. No public HTTP contract changes were required.

## Clients

Requires no client changes; owners ask questions directly in existing bot and group chats.

## Decisions

- **Search authored messages, not tool output or compaction summaries.** Leads directly to original evidence without noise.
- **Literal substring search without indexing in v1.** Avoids extra infrastructure while transcript sizes remain modest.
- **Freeze cutoff per search, recheck access per request.** Prevents shifting pages while enforcing immediate revocation when group membership changes.

## Open questions

None.
